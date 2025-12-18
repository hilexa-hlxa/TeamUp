from fastapi import APIRouter, Depends, Query, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from db.session import get_db
from api.deps import get_current_user, require_project_creation_permission
from models.user import User
from schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse
from schemas.membership import MembershipInviteIn
from schemas.project_roles import RoleRequirementCreate
from services.project_service import ProjectService

router = APIRouter(prefix="/projects", tags=["projects"])


@router.post("", response_model=ProjectResponse, status_code=201)
def create_project(
        project_data: ProjectCreate,
        current_user: User = Depends(require_project_creation_permission),
        db: Session = Depends(get_db)
):
    return ProjectService.create(db, project_data, current_user.id)


@router.get("", response_model=List[ProjectResponse])
def list_projects(
        status: Optional[str] = Query(None),
        tech_stack: Optional[List[str]] = Query(None),
        skip: int = 0,
        limit: int = 100,
        db: Session = Depends(get_db)
):
    return ProjectService.list_projects(db, status, tech_stack, skip, limit)


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: int, db: Session = Depends(get_db)):
    project = ProjectService.get_by_id(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.patch("/{project_id}", response_model=ProjectResponse)
def update_project(
        project_id: int,
        project_data: ProjectUpdate,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    project = ProjectService.get_by_id(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if project.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    return ProjectService.update(db, project_id, project_data)


@router.delete("/{project_id}", status_code=204)
def delete_project(
        project_id: int,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    project = ProjectService.get_by_id(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Only project creator, admin, or mentor can delete
    is_creator = project.created_by == current_user.id
    user_role = (current_user.role or "").lower().strip()
    is_admin_or_mentor = user_role in ["admin", "mentor"]
    
    # Allow deletion if user is creator OR admin/mentor
    if is_creator or is_admin_or_mentor:
        db.delete(project)
        db.commit()
        return
    
    # If we get here, user is not authorized
    raise HTTPException(
        status_code=403, 
        detail=f"Not authorized. Your role: '{current_user.role}'"
    )


@router.post("/{project_id}/invite", status_code=201)
def invite_user(
        project_id: int,
        invite_data: MembershipInviteIn,
        background_tasks: BackgroundTasks,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    from models.membership import Membership
    from models.user import User
    from services.notification_service import NotificationService

    project = ProjectService.get_by_id(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if project.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    user_id = invite_data.user_id
    role_in_team = invite_data.role_in_team

    # Check if user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check if already a member
    existing = db.query(Membership).filter(
        Membership.project_id == project_id,
        Membership.user_id == user_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="User is already a member")

    # Create membership with status='invited'
    membership = Membership(
        project_id=project_id,
        user_id=user_id,
        role_in_team=role_in_team,
        status="invited",
        invited_by=current_user.id
    )
    db.add(membership)
    db.commit()
    db.refresh(membership)

    # Send notification
    NotificationService.create(
        db=db,
        user_id=user_id,
        type="invite",
        payload={"project_id": project_id, "project_title": project.title, "membership_id": membership.id},
        background_tasks=background_tasks
    )

    return {"id": membership.id, "status": "invited"}


@router.post("/{project_id}/required-roles", status_code=201)
def add_required_role(
        project_id: int,
        role_data: RoleRequirementCreate,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    from models.project_role_requirement import ProjectRoleRequirement

    project = ProjectService.get_by_id(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if project.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    role_name = role_data.role_name

    # Check if role already exists
    existing = db.query(ProjectRoleRequirement).filter(
        ProjectRoleRequirement.project_id == project_id,
        ProjectRoleRequirement.role_name == role_name
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Role already exists")

    role_req = ProjectRoleRequirement(
        project_id=project_id,
        role_name=role_name
    )
    db.add(role_req)
    db.commit()
    db.refresh(role_req)

    return {"id": role_req.id, "role_name": role_req.role_name}