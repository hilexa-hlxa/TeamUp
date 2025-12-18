from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import List, Optional
from models.project import Project
from models.task import Task
from schemas.project import ProjectCreate, ProjectUpdate


class ProjectService:
    @staticmethod
    def create(db: Session, project_data: ProjectCreate, created_by: int) -> Project:
        project = Project(
            **project_data.model_dump(exclude={"required_roles"}),
            created_by=created_by
        )
        db.add(project)
        db.commit()
        db.refresh(project)
        return project

    @staticmethod
    def get_by_id(db: Session, project_id: int) -> Optional[Project]:
        return db.query(Project).filter(Project.id == project_id).first()

    @staticmethod
    def list_projects(
            db: Session,
            status: Optional[str] = None,
            tech_stack: Optional[List[str]] = None,
            skip: int = 0,
            limit: int = 100
    ) -> List[Project]:
        query = db.query(Project)

        if status:
            query = query.filter(Project.status == status)

        if tech_stack:
            for tech in tech_stack:
                query = query.filter(Project.tech_stack.contains([tech]))

        return query.offset(skip).limit(limit).all()

    @staticmethod
    def update(db: Session, project_id: int, project_data: ProjectUpdate) -> Project:
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        update_data = project_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(project, field, value)

        db.commit()
        db.refresh(project)
        return project

    @staticmethod
    def recalculate_progress(db: Session, project_id: int) -> float:
        tasks = db.query(Task).filter(Task.project_id == project_id).all()
        if not tasks:
            progress = 0.0
        else:
            done_count = sum(1 for t in tasks if t.status == "done")
            progress = (done_count / len(tasks)) * 100

        project = db.query(Project).filter(Project.id == project_id).first()
        if project:
            project.progress_percent = progress
            db.commit()

        return progress