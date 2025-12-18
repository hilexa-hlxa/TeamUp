from sqlalchemy.orm import Session
from fastapi import HTTPException, BackgroundTasks
from typing import List, Optional
from models.task import Task
from schemas.task import TaskCreate, TaskUpdate
from services.project_service import ProjectService
from services.notification_service import NotificationService


class TaskService:
    VALID_STATUSES = ["todo", "in_progress", "done"]

    @staticmethod
    def create(db: Session, task_data: TaskCreate, background_tasks: Optional[BackgroundTasks] = None) -> Task:
        task = Task(**task_data.model_dump())
        db.add(task)
        db.commit()
        db.refresh(task)

        if task.assignee_id:
            NotificationService.create(
                db=db,
                user_id=task.assignee_id,
                type="task_done",  # Note: task_assigned is not in TZ, but we'll use task_done for completion
                payload={"task_id": task.id, "task_title": task.title, "project_id": task.project_id},
                background_tasks=background_tasks
            )

        return task

    @staticmethod
    def update(db: Session, task_id: int, task_data: TaskUpdate, current_user_id: int, background_tasks: Optional[BackgroundTasks] = None) -> Task:
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")

        old_status = task.status
        update_data = task_data.model_dump(exclude_unset=True)

        if "status" in update_data:
            new_status = update_data["status"]
            if new_status not in TaskService.VALID_STATUSES:
                raise HTTPException(status_code=400, detail="Invalid status")

        for field, value in update_data.items():
            setattr(task, field, value)

        db.commit()
        db.refresh(task)

        # Recalculate progress if status changed
        if "status" in update_data and old_status != task.status:
            ProjectService.recalculate_progress(db, task.project_id)

            if task.status == "done":
                project = ProjectService.get_by_id(db, task.project_id)
                if project:
                    NotificationService.create(
                        db=db,
                        user_id=project.created_by,
                        type="task_done",
                        payload={"task_id": task.id, "task_title": task.title, "project_id": task.project_id, "assignee_id": task.assignee_id},
                        background_tasks=background_tasks
                    )

        return task

    @staticmethod
    def list_by_project(db: Session, project_id: int) -> List[Task]:
        return db.query(Task).filter(Task.project_id == project_id).all()