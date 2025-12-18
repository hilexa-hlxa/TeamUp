from sqlalchemy.orm import Session
from fastapi import HTTPException, status, BackgroundTasks
from typing import Optional
from models.application import Application
from models.membership import Membership
from schemas.application import ApplicationCreate
from services.notification_service import NotificationService


class ApplicationService:
    @staticmethod
    def create(db: Session, app_data: ApplicationCreate, applicant_id: int) -> Application:
        # Check if already applied to this specific target
        existing = db.query(Application).filter(
            Application.type == app_data.type,
            Application.target_id == app_data.target_id,
            Application.applicant_id == applicant_id,
            Application.status == "pending"
        ).first()

        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Already applied to this target"
            )

        # Check if there's already an active application for this target's creator (client)
        # Only ONE active application per client
        from models.project import Project
        from models.hackathon import Hackathon
        
        target_creator_id = None
        if app_data.type == "project":
            project = db.query(Project).filter(Project.id == app_data.target_id).first()
            if project:
                target_creator_id = project.created_by
        elif app_data.type == "hackathon":
            hackathon = db.query(Hackathon).filter(Hackathon.id == app_data.target_id).first()
            if hackathon:
                target_creator_id = hackathon.created_by
        
        if target_creator_id:
            # Get all active applications by this applicant
            active_apps = db.query(Application).filter(
                Application.applicant_id == applicant_id,
                Application.status == "pending"
            ).all()
            
            # Check each active application to see if it's for a project/hackathon by the same creator
            for app in active_apps:
                app_creator_id = None
                if app.type == "project":
                    app_project = db.query(Project).filter(Project.id == app.target_id).first()
                    if app_project:
                        app_creator_id = app_project.created_by
                elif app.type == "hackathon":
                    app_hackathon = db.query(Hackathon).filter(Hackathon.id == app.target_id).first()
                    if app_hackathon:
                        app_creator_id = app_hackathon.created_by
                
                if app_creator_id == target_creator_id:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="You already have an active application to a project/hackathon by this creator. Only one active application per client is allowed."
                    )

        # Check if already a member (for projects)
        if app_data.type == "project":
            existing_member = db.query(Membership).filter(
                Membership.project_id == app_data.target_id,
                Membership.user_id == applicant_id
            ).first()

            if existing_member:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Already a member of this project"
                )
        elif app_data.type == "hackathon":
            from models.hackathon_participant import HackathonParticipant
            existing_participant = db.query(HackathonParticipant).filter(
                HackathonParticipant.hackathon_id == app_data.target_id,
                HackathonParticipant.user_id == applicant_id
            ).first()

            if existing_participant:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Already a participant of this hackathon"
                )

        application = Application(
            type=app_data.type,
            target_id=app_data.target_id,
            applicant_id=applicant_id,
            message=app_data.message
        )
        db.add(application)
        db.commit()
        db.refresh(application)
        return application

    @staticmethod
    def approve(db: Session, application_id: int, background_tasks: Optional[BackgroundTasks] = None) -> Application:
        application = db.query(Application).filter(Application.id == application_id).first()
        if not application:
            raise HTTPException(status_code=404, detail="Application not found")

        if application.status != "pending":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Application already processed"
            )

        if application.type == "project":
            # Create membership with status='active'
            membership = Membership(
                project_id=application.target_id,
                user_id=application.applicant_id,
                role_in_team="member",  # default role, can be customized
                status="active"
            )
            db.add(membership)
        elif application.type == "hackathon":
            # Create hackathon_participant
            from models.hackathon_participant import HackathonParticipant
            participant = HackathonParticipant(
                hackathon_id=application.target_id,
                user_id=application.applicant_id
            )
            db.add(participant)

        application.status = "approved"
        db.commit()
        db.refresh(application)

        # Notify user
        NotificationService.create(
            db=db,
            user_id=application.applicant_id,
            type="application_status",
            payload={"application_id": application.id, "type": application.type, "target_id": application.target_id, "status": "approved"},
            background_tasks=background_tasks
        )

        return application

    @staticmethod
    def reject(db: Session, application_id: int) -> Application:
        application = db.query(Application).filter(Application.id == application_id).first()
        if not application:
            raise HTTPException(status_code=404, detail="Application not found")

        if application.status != "pending":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Application already processed"
            )

        application.status = "rejected"
        db.commit()
        db.refresh(application)
        return application

    @staticmethod
    def list_by_project(db: Session, project_id: int):
        return db.query(Application).filter(
            Application.type == "project",
            Application.target_id == project_id
        ).all()

    @staticmethod
    def list_by_hackathon(db: Session, hackathon_id: int):
        return db.query(Application).filter(
            Application.type == "hackathon",
            Application.target_id == hackathon_id
        ).all()

    @staticmethod
    def list_by_user(db: Session, user_id: int):
        return db.query(Application).filter(Application.applicant_id == user_id).all()