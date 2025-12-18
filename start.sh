#!/bin/bash
set -e

# Run migrations
echo "Running database migrations..."
if ! alembic upgrade head 2>/dev/null; then
    echo "Migrations failed, initializing database from models..."
    python3 init_sqlite_db.py || echo "Database initialization failed, continuing..."
fi

# Start the server
echo "Starting server on port ${PORT:-8000}..."
exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
