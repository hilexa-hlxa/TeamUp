from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from db.session import get_db
from api.deps import get_current_user, require_project_creation_permission
from models.user import User
from models.hackathon import Hackathon

router = APIRouter(prefix="/hackathons", tags=["hackathons"])


class HackathonCreate(BaseModel):
    title: str
    description: str
    start_at: datetime
    end_at: datetime
    prize: Optional[str] = None
    max_participants: Optional[int] = None


class HackathonResponse(BaseModel):
    id: int
    title: str
    description: str
    start_at: datetime
    end_at: datetime
    prize: Optional[str] = None
    max_participants: Optional[int] = None
    created_by: int
    created_at: datetime

    class Config:
        from_attributes = True


@router.post("", response_model=HackathonResponse, status_code=201)
def create_hackathon(
        hackathon_data: HackathonCreate,
        current_user: User = Depends(require_project_creation_permission),
        db: Session = Depends(get_db)
):
    hackathon = Hackathon(
        **hackathon_data.model_dump(),
        created_by=current_user.id
    )
    db.add(hackathon)
    db.commit()
    db.refresh(hackathon)
    return hackathon


@router.get("", response_model=List[HackathonResponse])
def list_hackathons(db: Session = Depends(get_db)):
    return db.query(Hackathon).all()


@router.get("/{hackathon_id}", response_model=HackathonResponse)
def get_hackathon(hackathon_id: int, db: Session = Depends(get_db)):
    hackathon = db.query(Hackathon).filter(Hackathon.id == hackathon_id).first()
    if not hackathon:
        raise HTTPException(status_code=404, detail="Hackathon not found")
    return hackathon


@router.get("/active", response_model=List[HackathonResponse])
def list_active_hackathons(db: Session = Depends(get_db)):
    now = datetime.now()
    return db.query(Hackathon).filter(
        Hackathon.start_at <= now,
        Hackathon.end_at >= now
    ).all()


@router.post("/{hackathon_id}/join", status_code=201)
def join_hackathon(
        hackathon_id: int,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    from models.application import Application
    
    hackathon = db.query(Hackathon).filter(Hackathon.id == hackathon_id).first()
    if not hackathon:
        raise HTTPException(status_code=404, detail="Hackathon not found")
    
    # Проверяем, не подал ли уже заявку
    existing = db.query(Application).filter(
        Application.target_id == hackathon_id,
        Application.type == "hackathon",
        Application.applicant_id == current_user.id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Application already exists")
    
    # Создаем заявку
    application = Application(
        type="hackathon",
        target_id=hackathon_id,
        applicant_id=current_user.id,
        status="pending"
    )
    db.add(application)
    db.commit()
    db.refresh(application)
    
    return {"id": application.id, "status": "pending", "message": "Application submitted successfully"}


@router.delete("/{hackathon_id}", status_code=204)
def delete_hackathon(
        hackathon_id: int,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    hackathon = db.query(Hackathon).filter(Hackathon.id == hackathon_id).first()
    if not hackathon:
        raise HTTPException(status_code=404, detail="Hackathon not found")

    # Only hackathon creator, admin, or mentor can delete
    is_creator = hackathon.created_by == current_user.id
    user_role = (current_user.role or "").lower().strip()
    is_admin_or_mentor = user_role in ["admin", "mentor"]
    
    # Allow deletion if user is creator OR admin/mentor
    if is_creator or is_admin_or_mentor:
        db.delete(hackathon)
        db.commit()
        return
    
    # If we get here, user is not authorized
    raise HTTPException(
        status_code=403, 
        detail=f"Not authorized. Your role: '{current_user.role}'"
    )