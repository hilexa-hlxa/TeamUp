from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
import structlog
import uvicorn  # <-- add this
from core.config import settings
from db.session import get_db
from api.v1 import auth, users, projects, tasks, applications, memberships, notifications, hackathons, admin
from ws.manager import manager
from core.security import decode_token
from core.exceptions import (
    api_exception_handler,
    validation_exception_handler,
    sqlalchemy_exception_handler,
    general_exception_handler
)

# Configure structlog for JSON logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()

app = FastAPI(
    title="TeamUp API",
    version="1.0.0",
    description="Backend API for TeamUp - Team Formation Platform"
)

# Exception handlers
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(SQLAlchemyError, sqlalchemy_exception_handler)
app.add_exception_handler(ValueError, general_exception_handler)  # Handle ValueError before general Exception
app.add_exception_handler(Exception, general_exception_handler)

# CORS
# In development, allow all origins for easier local network testing
if settings.APP_ENV == "dev":
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Allow all origins in dev mode
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allow_headers=["*"],
        expose_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allow_headers=["*"],
        expose_headers=["*"],
    )

# Include routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(projects.router, prefix="/api/v1")
app.include_router(tasks.router, prefix="/api/v1")
app.include_router(applications.router, prefix="/api/v1")
app.include_router(memberships.router, prefix="/api/v1")
app.include_router(notifications.router, prefix="/api/v1")
app.include_router(hackathons.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {"message": "TeamUp API", "version": "1.0.0"}

@app.get("/health")
def health_check():
    from db.session import is_using_sqlite, get_engine
    from sqlalchemy import text
    
    db_type = "sqlite" if is_using_sqlite() else "postgresql"
    
    # Test database connection
    try:
        engine = get_engine()
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"
    
    return {
        "status": "healthy",
        "database": {
            "type": db_type,
            "status": db_status
        }
    }

@app.websocket("/ws/notifications/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int):
    # Get token from query parameters
    token = websocket.query_params.get("token")
    
    if not token:
        await websocket.close(code=4001, reason="Token required")
        return
    
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        await websocket.close(code=4001, reason="Invalid token")
        return
    
    token_user_id = int(payload.get("sub"))
    if token_user_id != user_id:
        await websocket.close(code=4003, reason="User ID mismatch")
        return

    await manager.connect(websocket, user_id)
    logger.info("user_connected", user_id=user_id)

    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
        logger.info("user_disconnected", user_id=user_id)

# Run with python3 main.py
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
