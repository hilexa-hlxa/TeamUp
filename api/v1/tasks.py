from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from db.session import get_db
from api.deps import get_current_user
from models.user import User
from schemas.task import TaskCreate, TaskUpdate, TaskResponse
from services.task_service import TaskService

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.post("", response_model=TaskResponse, status_code=201)
def create_task(
        task_data: TaskCreate,
        background_tasks: BackgroundTasks,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    return TaskService.create(db, task_data, background_tasks)


@router.get("/project/{project_id}", response_model=List[TaskResponse])
def list_project_tasks(
        project_id: int,
        db: Session = Depends(get_db)
):
    return TaskService.list_by_project(db, project_id)


@router.patch("/{task_id}", response_model=TaskResponse)
def update_task(
        task_id: int,
        task_data: TaskUpdate,
        background_tasks: BackgroundTasks,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    return TaskService.update(db, task_id, task_data, current_user.id, background_tasks)


@router.delete("/{task_id}", status_code=204)
def delete_task(
        task_id: int,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    from models.task import Task
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    db.delete(task)
    db.commit()