from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from db.session import get_db
from schemas.user import UserCreate
from schemas.auth import LoginRequest, TokenResponse, RefreshRequest
from services.auth_service import AuthService
import structlog

logger = structlog.get_logger()

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=TokenResponse)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    try:
        return AuthService.register(db, user_data)
    except HTTPException:
        # Re-raise HTTP exceptions (like email already exists)
        raise
    except SQLAlchemyError as e:
        # Log the actual database error for debugging
        logger.error(
            "registration_database_error",
            email=user_data.email,
            error=str(e),
            error_type=type(e).__name__,
            exc_info=True
        )
        # Re-raise to let SQLAlchemy exception handler catch it
        raise
    except Exception as e:
        # Log any other unexpected errors
        logger.error(
            "registration_unexpected_error",
            email=user_data.email,
            error=str(e),
            error_type=type(e).__name__,
            exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )

@router.post("/login", response_model=TokenResponse)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    return AuthService.login(db, login_data.email, login_data.password)

@router.post("/refresh", response_model=TokenResponse)
def refresh(refresh_data: RefreshRequest, db: Session = Depends(get_db)):
    return AuthService.refresh(db, refresh_data.refresh_token)