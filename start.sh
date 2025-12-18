#!/bin/bash
set -e

# Run migrations
echo "Running database migrations..."
alembic upgrade head || echo "Migration failed, continuing..."

# Start the server
echo "Starting server on port ${PORT:-8000}..."
exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
