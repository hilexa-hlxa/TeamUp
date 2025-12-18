from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from db.session import get_db
from api.deps import get_admin_user
from models.user import User
from models.project import Project
from models.application import Application
from models.hackathon import Hackathon
from schemas.project import ProjectCreate, ProjectResponse
from schemas.application import ApplicationResponse
from schemas.user import UserResponse, UserUpdate
from services.project_service import ProjectService
from services.application_service import ApplicationService

router = APIRouter(prefix="/admin", tags=["admin"])


# ==================== APPLICATIONS MANAGEMENT ====================

@router.get("/applications", response_model=List[ApplicationResponse])
def list_all_applications(
        status: Optional[str] = Query(None),
        type: Optional[str] = Query(None),
        current_user: User = Depends(get_admin_user),
        db: Session = Depends(get_db)
):
    """Get all applications (admin only)"""
    query = db.query(Application)
    
    if status:
        query = query.filter(Application.status == status)
    if type:
        query = query.filter(Application.type == type)
    
    return query.order_by(Application.created_at.desc()).all()


@router.get("/applications/{application_id}", response_model=ApplicationResponse)
def get_application(
        application_id: int,
        current_user: User = Depends(get_admin_user),
        db: Session = Depends(get_db)
):
    """Get application by ID (admin only)"""
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    return application


@router.post("/applications/{application_id}/approve", response_model=ApplicationResponse)
def approve_application_admin(
        application_id: int,
        background_tasks: BackgroundTasks,
        current_user: User = Depends(get_admin_user),
        db: Session = Depends(get_db)
):
    """Approve application (admin can approve any application)"""
    return ApplicationService.approve(db, application_id, background_tasks)


@router.post("/applications/{application_id}/reject", response_model=ApplicationResponse)
def reject_application_admin(
        application_id: int,
        current_user: User = Depends(get_admin_user),
        db: Session = Depends(get_db)
):
    """Reject application (admin can reject any application)"""
    return ApplicationService.reject(db, application_id)


# ==================== PROJECTS MANAGEMENT ====================

@router.post("/projects", response_model=ProjectResponse, status_code=201)
def create_project_admin(
        project_data: ProjectCreate,
        current_user: User = Depends(get_admin_user),
        db: Session = Depends(get_db)
):
    """Create project (admin can create projects)"""
    return ProjectService.create(db, project_data, current_user.id)


@router.get("/projects", response_model=List[ProjectResponse])
def list_all_projects(
        status: Optional[str] = Query(None),
        current_user: User = Depends(get_admin_user),
        db: Session = Depends(get_db)
):
    """Get all projects (admin only)"""
    query = db.query(Project)
    if status:
        query = query.filter(Project.status == status)
    return query.order_by(Project.created_at.desc()).all()


@router.delete("/projects/{project_id}", status_code=204)
def delete_project_admin(
        project_id: int,
        current_user: User = Depends(get_admin_user),
        db: Session = Depends(get_db)
):
    """Delete any project (admin only)"""
    project = ProjectService.get_by_id(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    db.delete(project)
    db.commit()


# ==================== USERS MANAGEMENT ====================

@router.get("/users", response_model=List[UserResponse])
def list_all_users(
        role: Optional[str] = Query(None),
        current_user: User = Depends(get_admin_user),
        db: Session = Depends(get_db)
):
    """Get all users (admin only)"""
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    return query.order_by(User.created_at.desc()).all()


@router.get("/users/{user_id}", response_model=UserResponse)
def get_user_admin(
        user_id: int,
        current_user: User = Depends(get_admin_user),
        db: Session = Depends(get_db)
):
    """Get user by ID (admin only)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.patch("/users/{user_id}", response_model=UserResponse)
def update_user_admin(
        user_id: int,
        user_data: UserUpdate,
        current_user: User = Depends(get_admin_user),
        db: Session = Depends(get_db)
):
    """Update user (admin only)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    update_data = user_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    
    db.commit()
    db.refresh(user)
    return user


@router.delete("/users/{user_id}", status_code=204)
def delete_user_admin(
        user_id: int,
        current_user: User = Depends(get_admin_user),
        db: Session = Depends(get_db)
):
    """Delete user (admin only)"""
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.delete(user)
    db.commit()


# ==================== STATISTICS ====================

@router.get("/stats")
def get_statistics(
        current_user: User = Depends(get_admin_user),
        db: Session = Depends(get_db)
):
    """Get platform statistics (admin only)"""
    from models.membership import Membership
    from models.task import Task
    from models.hackathon_participant import HackathonParticipant
    
    stats = {
        "users": {
            "total": db.query(User).count(),
            "by_role": {}
        },
        "projects": {
            "total": db.query(Project).count(),
            "by_status": {}
        },
        "applications": {
            "total": db.query(Application).count(),
            "by_status": {},
            "by_type": {}
        },
        "memberships": db.query(Membership).count(),
        "tasks": db.query(Task).count(),
        "hackathons": db.query(Hackathon).count(),
        "hackathon_participants": db.query(HackathonParticipant).count()
    }
    
    # Users by role
    for role in ["student", "mentor", "customer", "admin"]:
        stats["users"]["by_role"][role] = db.query(User).filter(User.role == role).count()
    
    # Projects by status
    for status in ["recruiting", "active", "completed"]:
        stats["projects"]["by_status"][status] = db.query(Project).filter(Project.status == status).count()
    
    # Applications by status
    for status in ["pending", "approved", "rejected"]:
        stats["applications"]["by_status"][status] = db.query(Application).filter(Application.status == status).count()
    
    # Applications by type
    stats["applications"]["by_type"]["project"] = db.query(Application).filter(Application.type == "project").count()
    stats["applications"]["by_type"]["hackathon"] = db.query(Application).filter(Application.type == "hackathon").count()
    
    return stats

