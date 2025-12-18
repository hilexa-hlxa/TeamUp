from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from db.session import get_db
from api.deps import get_current_user
from models.user import User
from models.project import Project
from schemas.application import ApplicationCreate, ApplicationResponse, ApplicationUpdate
from services.application_service import ApplicationService

router = APIRouter(prefix="/applications", tags=["applications"])


@router.post("", response_model=ApplicationResponse, status_code=201)
def create_application(
        app_data: ApplicationCreate,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    # All roles can create applications (advertising themselves)
    application = ApplicationService.create(db, app_data, current_user.id)
    
    # Convert to response format
    result = {
        "id": application.id,
        "type": application.type,
        "target_id": application.target_id,
        "applicant_id": application.applicant_id,
        "message": application.message,
        "status": application.status,
        "created_at": application.created_at,
        "updated_at": application.updated_at,
    }
    
    # Load applicant data if available
    if application.applicant:
        result["applicant"] = {
            "id": application.applicant.id,
            "name": application.applicant.name,
            "email": application.applicant.email,
            "role": application.applicant.role,
            "skills": application.applicant.skills or [],
            "avatar_url": application.applicant.avatar_url,
        }
    
    # Load project/hackathon data if available
    if application.type == "project":
        project = db.query(Project).filter(Project.id == application.target_id).first()
        if project:
            result["project"] = {
                "id": project.id,
                "title": project.title,
                "created_by": project.created_by,
            }
    elif application.type == "hackathon":
        from models.hackathon import Hackathon
        hackathon = db.query(Hackathon).filter(Hackathon.id == application.target_id).first()
        if hackathon:
            result["hackathon"] = {
                "id": hackathon.id,
                "title": hackathon.title,
            }
    
    return result


@router.get("", response_model=List[ApplicationResponse])
def list_applications(
        type: Optional[str] = Query(None),
        target_id: Optional[int] = Query(None),
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    from models.application import Application
    from models.user import User
    from models.project import Project
    from models.hackathon import Hackathon
    
    # If user is listing their own applications
    if not type and not target_id:
        applications = ApplicationService.list_by_user(db, current_user.id)
    # If listing by project
    elif type == "project" and target_id:
        project = db.query(Project).filter(Project.id == target_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        if project.created_by != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
        applications = ApplicationService.list_by_project(db, target_id)
    # If listing by hackathon
    elif type == "hackathon" and target_id:
        hackathon = db.query(Hackathon).filter(Hackathon.id == target_id).first()
        if not hackathon:
            raise HTTPException(status_code=404, detail="Hackathon not found")
        if hackathon.created_by != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
        applications = ApplicationService.list_by_hackathon(db, target_id)
    else:
        raise HTTPException(status_code=400, detail="Invalid parameters")
    
    # Enrich applications with related data
    result = []
    for app in applications:
        app_dict = {
            "id": app.id,
            "type": app.type,
            "target_id": app.target_id,
            "applicant_id": app.applicant_id,
            "message": app.message,
            "status": app.status,
            "created_at": app.created_at,
            "updated_at": app.updated_at,
        }
        
        # Load applicant data
        if app.applicant:
            app_dict["applicant"] = {
                "id": app.applicant.id,
                "name": app.applicant.name,
                "email": app.applicant.email,
                "role": app.applicant.role,
                "skills": app.applicant.skills or [],
                "avatar_url": app.applicant.avatar_url,
            }
        
        # Load project/hackathon data
        if app.type == "project":
            project = db.query(Project).filter(Project.id == app.target_id).first()
            if project:
                app_dict["project"] = {
                    "id": project.id,
                    "title": project.title,
                    "created_by": project.created_by,
                }
        elif app.type == "hackathon":
            hackathon = db.query(Hackathon).filter(Hackathon.id == app.target_id).first()
            if hackathon:
                app_dict["hackathon"] = {
                    "id": hackathon.id,
                    "title": hackathon.title,
                    "created_by": hackathon.created_by,
                }
        
        result.append(app_dict)
    
    return result


@router.post("/{application_id}/approve", response_model=ApplicationResponse)
def approve_application(
        application_id: int,
        background_tasks: BackgroundTasks,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    from models.application import Application
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    # Check authorization based on application type
    if application.type == "project":
        project = db.query(Project).filter(Project.id == application.target_id).first()
        if not project or project.created_by != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
    elif application.type == "hackathon":
        from models.hackathon import Hackathon
        hackathon = db.query(Hackathon).filter(Hackathon.id == application.target_id).first()
        if not hackathon or hackathon.created_by != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")

    application = ApplicationService.approve(db, application_id, background_tasks)
    
    # Convert to response format
    result = {
        "id": application.id,
        "type": application.type,
        "target_id": application.target_id,
        "applicant_id": application.applicant_id,
        "message": application.message,
        "status": application.status,
        "created_at": application.created_at,
        "updated_at": application.updated_at,
    }
    
    # Load applicant data if available
    if application.applicant:
        result["applicant"] = {
            "id": application.applicant.id,
            "name": application.applicant.name,
            "email": application.applicant.email,
            "role": application.applicant.role,
            "skills": application.applicant.skills or [],
            "avatar_url": application.applicant.avatar_url,
        }
    
    # Load project/hackathon data if available
    if application.type == "project":
        project = db.query(Project).filter(Project.id == application.target_id).first()
        if project:
            result["project"] = {
                "id": project.id,
                "title": project.title,
                "created_by": project.created_by,
            }
    elif application.type == "hackathon":
        from models.hackathon import Hackathon
        hackathon = db.query(Hackathon).filter(Hackathon.id == application.target_id).first()
        if hackathon:
            result["hackathon"] = {
                "id": hackathon.id,
                "title": hackathon.title,
            }
    
    return result


@router.post("/{application_id}/reject", response_model=ApplicationResponse)
def reject_application(
        application_id: int,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    from models.application import Application
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    # Check authorization based on application type
    if application.type == "project":
        project = db.query(Project).filter(Project.id == application.target_id).first()
        if not project or project.created_by != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
    elif application.type == "hackathon":
        from models.hackathon import Hackathon
        hackathon = db.query(Hackathon).filter(Hackathon.id == application.target_id).first()
        if not hackathon or hackathon.created_by != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")

    application = ApplicationService.reject(db, application_id)
    
    # Convert to response format
    result = {
        "id": application.id,
        "type": application.type,
        "target_id": application.target_id,
        "applicant_id": application.applicant_id,
        "message": application.message,
        "status": application.status,
        "created_at": application.created_at,
        "updated_at": application.updated_at,
    }
    
    # Load applicant data if available
    if application.applicant:
        result["applicant"] = {
            "id": application.applicant.id,
            "name": application.applicant.name,
            "email": application.applicant.email,
            "role": application.applicant.role,
            "skills": application.applicant.skills or [],
            "avatar_url": application.applicant.avatar_url,
        }
    
    # Load project/hackathon data if available
    if application.type == "project":
        project = db.query(Project).filter(Project.id == application.target_id).first()
        if project:
            result["project"] = {
                "id": project.id,
                "title": project.title,
                "created_by": project.created_by,
            }
    elif application.type == "hackathon":
        from models.hackathon import Hackathon
        hackathon = db.query(Hackathon).filter(Hackathon.id == application.target_id).first()
        if hackathon:
            result["hackathon"] = {
                "id": hackathon.id,
                "title": hackathon.title,
            }
    
    return result