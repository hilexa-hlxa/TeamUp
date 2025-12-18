# TeamUp Backend API

FastAPI backend for TeamUp - a team formation and project management platform.

## Features

- 🔐 JWT-based authentication with access & refresh tokens
- 👥 User management with roles (student, mentor, customer)
- 📋 Project CRUD with filtering and progress tracking
- ✅ Kanban-style task management
- 🤝 Application and membership system
- 🔔 Real-time notifications via WebSocket
- 🏆 Hackathon listings
- 📊 Automatic progress calculation
- 🗃️ PostgreSQL database with Alembic migrations

## Quick Start

### Prerequisites

- Python 3.11+
- PostgreSQL 15+
- Virtual environment (venv)

### Local Development Setup

1. **Activate virtual environment:**
```bash
source venv/bin/activate
```

2. **Install dependencies:**
```bash
pip install -r requirements.txt
```

3. **Set up environment variables:**
Create a `.env` file in the root directory:
```env
APP_ENV=dev
DB_URL=postgresql+psycopg://postgres:postgres@localhost:5432/teamup
JWT_SECRET=your-secret-key-here
JWT_ALG=HS256
ACCESS_TTL_MIN=30
REFRESH_TTL_DAYS=7
CORS_ORIGINS=http://localhost:5173
```

4. **Run database migrations:**
```bash
alembic upgrade head
```

5. **Start the server:**
```bash
# Option 1: Using uvicorn directly
uvicorn main:app --reload

# Option 2: Using the run script
./run.sh

# Option 3: Using Python
python -m uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`
API documentation: `http://localhost:8000/docs`

### Using Docker (Recommended for Production)

```bash
# Start all services
docker-compose up -d

# Run migrations
docker-compose exec api alembic upgrade head

# Seed database: removed - not needed in production

# View logs
docker-compose logs -f api
```

API will be available at http://localhost:8000
Adminer (DB UI) at http://localhost:8080

### Manual Setup

```bash
# Install dependencies
pip install -r requirements.txt

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Run migrations
alembic upgrade head

# Seed database: removed - not needed in production

# Start server
uvicorn app.main:app --reload
```

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Project Structure

```
app/
├── main.py              # FastAPI application
├── core/                # Config, security
├── db/                  # Database session, base
├── models/              # SQLAlchemy models
├── schemas/             # Pydantic schemas
├── services/            # Business logic
├── api/v1/              # API endpoints
└── ws/                  # WebSocket manager

alembic/                 # Database migrations
```

## Development

```bash
# Create migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head
```

## WebSocket Notifications

Connect to `/ws/notifications/{user_id}?token=<access_token>`

Notifications are sent automatically for:
- Application approved
- Task completed
- Invitations

## Environment Variables

See `.env.example` for all configuration options.

## Seed Data

To populate database with test data:

```bash
python3 seed_data.py
```

**Note:** Requires at least one user and one project in the database.

## License