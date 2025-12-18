from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError
import structlog

logger = structlog.get_logger()


class APIException(Exception):
    """Base exception for API errors"""
    def __init__(self, status_code: int, detail: str):
        self.status_code = status_code
        self.detail = detail


async def api_exception_handler(request: Request, exc: APIException):
    """Handle custom API exceptions"""
    logger.warning(
        "api_exception",
        path=request.url.path,
        method=request.method,
        status_code=exc.status_code,
        detail=exc.detail
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.status_code,
                "message": exc.detail,
                "path": request.url.path
            }
        }
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle Pydantic validation errors"""
    # Skip handling for OPTIONS requests (CORS preflight)
    if request.method == "OPTIONS":
        return JSONResponse(
            status_code=200,
            content={}
        )
    
    # Convert errors to JSON-serializable format
    errors = []
    for error in exc.errors():
        error_dict = {
            "type": error.get("type"),
            "loc": error.get("loc"),
            "msg": error.get("msg"),
            "input": error.get("input")
        }
        # Handle ctx if it exists - convert exceptions to strings
        if "ctx" in error:
            ctx = error["ctx"]
            if isinstance(ctx, dict):
                ctx_clean = {}
                for key, value in ctx.items():
                    if isinstance(value, Exception):
                        ctx_clean[key] = str(value)
                    elif isinstance(value, (str, int, float, bool, type(None))):
                        ctx_clean[key] = value
                    else:
                        ctx_clean[key] = str(value)
                error_dict["ctx"] = ctx_clean
            else:
                error_dict["ctx"] = str(ctx) if ctx else None
        errors.append(error_dict)
    
    logger.warning(
        "validation_error",
        path=request.url.path,
        method=request.method,
        errors=errors
    )
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": {
                "code": 422,
                "message": "Validation error",
                "details": errors,
                "path": request.url.path
            }
        }
    )


async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
    """Handle SQLAlchemy database errors"""
    error_msg = str(exc)
    error_orig = getattr(exc, 'orig', None)
    error_orig_str = str(error_orig) if error_orig else ""
    
    # Combine error messages for better detection
    full_error = f"{error_msg} {error_orig_str}".lower()
    
    # Log full error details
    logger.error(
        "database_error",
        path=request.url.path,
        method=request.method,
        error=error_msg,
        error_orig=error_orig_str,
        exc_info=True
    )
    
    # Provide more specific error messages for common issues
    if "duplicate key" in full_error or "unique constraint" in full_error or "already exists" in full_error:
        if "email" in full_error or "users_email" in full_error:
            detail = "Email already registered"
            status_code = status.HTTP_400_BAD_REQUEST
        else:
            detail = "Duplicate entry. This record already exists."
            status_code = status.HTTP_400_BAD_REQUEST
    elif "foreign key" in full_error or "violates foreign key" in full_error:
        detail = "Invalid reference. Related record does not exist."
        status_code = status.HTTP_400_BAD_REQUEST
    elif "not null" in full_error or "null value" in full_error or "violates not-null" in full_error:
        # Extract which column is null
        if "name" in full_error:
            detail = "Name field is required."
        elif "email" in full_error:
            detail = "Email field is required."
        elif "password_hash" in full_error:
            detail = "Password is required."
        else:
            detail = "Required field is missing."
        status_code = status.HTTP_400_BAD_REQUEST
    elif "check constraint" in full_error or "violates check" in full_error:
        detail = "Data validation failed. Please check your input."
        status_code = status.HTTP_400_BAD_REQUEST
    else:
        # For debugging: include more details - but sanitize for production
        from core.config import settings
        if settings.APP_ENV == "dev":
            detail = f"Database error: {error_msg[:300]}"
        else:
            detail = "Database error occurred. Please try again later."
        status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    
    return JSONResponse(
        status_code=status_code,
        content={
            "error": {
                "code": status_code,
                "message": detail,
                "path": request.url.path
            }
        }
    )


async def general_exception_handler(request: Request, exc: Exception):
    """Handle all other exceptions"""
    # Ensure we convert exception to string for logging
    error_str = str(exc) if exc else "Unknown error"
    error_type = type(exc).__name__ if exc else "Unknown"
    
    logger.error(
        "unhandled_exception",
        path=request.url.path,
        method=request.method,
        error=error_str,
        error_type=error_type,
        exc_info=True
    )
    
    # Handle ValueError specifically (from Pydantic validators)
    if isinstance(exc, ValueError):
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "error": {
                    "code": 400,
                    "message": error_str,
                    "path": request.url.path
                }
            }
        )
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": 500,
                "message": "Internal server error",
                "path": request.url.path
            }
        }
    )

