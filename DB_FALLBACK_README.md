# Database Fallback System

This application implements an automatic database fallback system:
- **Primary**: PostgreSQL (production database)
- **Fallback**: SQLite (backup when PostgreSQL fails)

## How It Works

1. **On Startup**: The application attempts to connect to PostgreSQL
2. **If PostgreSQL Fails**: Automatically switches to SQLite (`teamup_backup.db`)
3. **Auto-Recovery**: Periodically attempts to reconnect to PostgreSQL
4. **Seamless Operation**: Your application continues working even if PostgreSQL is down

## Configuration

### Environment Variables

- `DB_URL` or `DATABASE_URL`: PostgreSQL connection string (optional)
- `SQLITE_DB_PATH`: Path to SQLite backup file (default: `teamup_backup.db`)

### Example

```bash
# PostgreSQL (primary)
DB_URL=postgresql+psycopg://user:pass@host:5432/dbname

# SQLite (automatic fallback)
# No configuration needed - uses teamup_backup.db by default
```

## Health Check

Check which database is active:

```bash
curl https://your-api.onrender.com/health
```

Response:
```json
{
  "status": "healthy",
  "database": {
    "type": "postgresql",  // or "sqlite"
    "status": "connected"
  }
}
```

## Migration Behavior

- Migrations run on the **active database** (PostgreSQL if available, SQLite otherwise)
- If PostgreSQL is down during migration, it will migrate SQLite
- When PostgreSQL comes back, you may need to sync data manually

## Important Notes

⚠️ **Data Sync**: If the app switches from PostgreSQL to SQLite and back, data won't automatically sync. The SQLite database is a **temporary fallback**, not a permanent backup.

✅ **Use Cases**:
- Development when PostgreSQL isn't available
- Temporary outages
- Testing without database setup

❌ **Not Recommended For**:
- Long-term production use of SQLite
- High-traffic applications (SQLite has concurrency limitations)
- Multi-server deployments (SQLite is file-based)

## Monitoring

The application logs database switches:

```
INFO: attempting_postgresql_connection
INFO: postgresql_connection_successful
```

Or if fallback occurs:

```
WARNING: postgresql_connection_test_failed_fallback_to_sqlite
INFO: using_sqlite_fallback path=teamup_backup.db
```

## Manual Database Switch

You can check which database is active in code:

```python
from db.session import is_using_sqlite

if is_using_sqlite():
    print("Using SQLite fallback")
else:
    print("Using PostgreSQL")
```
