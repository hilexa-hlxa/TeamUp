from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from db.session import get_db
from api.deps import get_current_user
from models.user import User
from models.membership import Membership
from schemas.membership import MembershipInviteOut as MembershipResponse

from schemas.membership import (
    MembershipInviteIn,
    MembershipInviteOut,
    MembershipDecision,
    MembershipStatus,
)


router = APIRouter(prefix="/memberships", tags=["memberships"])

@router.get("/project/{project_id}", response_model=List[MembershipResponse])
def list_project_members(
    project_id: int,
    db: Session = Depends(get_db)
):
    return db.query(Membership).filter(Membership.project_id == project_id).all()

@router.get("/user/{user_id}", response_model=List[MembershipResponse])
def list_user_memberships(
    user_id: int,
    db: Session = Depends(get_db)
):
    return db.query(Membership).filter(Membership.user_id == user_id).all()


@router.post("/{membership_id}/accept", response_model=MembershipResponse)
def accept_membership(
    membership_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    membership = db.query(Membership).filter(Membership.id == membership_id).first()
    if not membership:
        raise HTTPException(status_code=404, detail="Membership not found")

    if membership.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    if membership.status != "invited":
        raise HTTPException(status_code=400, detail="Membership is not in invited status")

    membership.status = "active"
    db.commit()
    db.refresh(membership)

    return membership

