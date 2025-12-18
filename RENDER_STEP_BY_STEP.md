# Render Deployment - Step by Step Guide

Follow these steps to deploy your TeamUp API to Render.

## Prerequisites
- ✅ GitHub repository: `hilexa-hlxa/TeamUp` (already done)
- ✅ Render account (sign up at https://render.com if needed)

---

## Method 1: Using Blueprint (Easiest - Recommended)

### Step 1: Go to Render Dashboard
1. Visit: https://dashboard.render.com
2. Sign in or create an account

### Step 2: Create New Blueprint
1. Click the **"New +"** button (top right)
2. Select **"Blueprint"**

### Step 3: Connect GitHub Repository
1. Click **"Connect account"** or **"Configure account"**
2. Authorize Render to access your GitHub
3. Select repository: **`hilexa-hlxa/TeamUp`**
4. Click **"Connect"**

### Step 4: Review Configuration
Render will automatically detect `render.yaml` and show:
- **Web Service**: `teamup-api`
- **Database**: `teamup-db` (PostgreSQL)

### Step 5: Apply Blueprint
1. Review the services (should show 1 web service + 1 database)
2. Click **"Apply"**
3. Wait for deployment (~5-10 minutes)

### Step 6: Update CORS (After Deployment)
1. Go to your **Web Service** → **Environment** tab
2. Find `CORS_ORIGINS`
3. Update with your frontend URL:
   ```
   https://your-frontend.onrender.com,http://localhost:5173
   ```
4. Click **"Save Changes"**
5. Service will auto-redeploy

---

## Method 2: Manual Setup (If Blueprint Fails)

### Part A: Create PostgreSQL Database

1. **Go to Render Dashboard**
   - Click **"New +"** → **"PostgreSQL"**

2. **Configure Database**:
   - **Name**: `teamup-db`
   - **Database**: `teamup`
   - **User**: `teamup_user` (or leave default)
   - **Region**: `Oregon` (or closest to you)
   - **PostgreSQL Version**: `15` (or latest)
   - **Plan**: `Free` (or upgrade if needed)

3. **Create Database**
   - Click **"Create Database"**
   - Wait for provisioning (~2-3 minutes)
   - **Copy the Internal Database URL** (you'll need this)

### Part B: Create Web Service

1. **Go to Render Dashboard**
   - Click **"New +"** → **"Web Service"**

2. **Connect Repository**:
   - Click **"Connect account"** if needed
   - Select repository: **`hilexa-hlxa/TeamUp`**
   - Click **"Connect"**

3. **Configure Service**:

   **Basic Settings**:
   - **Name**: `teamup-api`
   - **Region**: `Oregon` (same as database)
   - **Branch**: `main`
   - **Root Directory**: (leave empty - root is correct)
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `chmod +x start.sh && ./start.sh`

   **Environment Variables**:
   Click **"Add Environment Variable"** and add:

   ```
   APP_ENV = production
   ```

   ```
   DATABASE_URL = <paste Internal Database URL from Part A>
   ```

   ```
   JWT_SECRET = <generate with: openssl rand -hex 32>
   ```
   (Or use any random string like: `your-super-secret-jwt-key-here-12345`)

   ```
   JWT_ALG = HS256
   ```

   ```
   ACCESS_TTL_MIN = 30
   ```

   ```
   REFRESH_TTL_DAYS = 7
   ```

   ```
   CORS_ORIGINS = https://your-frontend.onrender.com,http://localhost:5173
   ```
   (Update with your actual frontend URL later)

4. **Link Database**:
   - Scroll down to **"Add Database"** section
   - Click **"Link Database"**
   - Select **`teamup-db`** (the one you created)
   - This will automatically set `DATABASE_URL`

5. **Advanced Settings** (optional):
   - **Auto-Deploy**: `Yes` (deploys on every push)
   - **Health Check Path**: `/health`

6. **Create Web Service**:
   - Click **"Create Web Service"**
   - Wait for deployment (~5-10 minutes)

---

## After Deployment

### 1. Check Deployment Status
- Go to your service dashboard
- Check **"Logs"** tab for any errors
- Status should show **"Live"** when ready

### 2. Test Your API

**Health Check**:
```bash
curl https://teamup-api.onrender.com/health
```
Expected response:
```json
{
  "status": "healthy",
  "database": {
    "type": "postgresql",
    "status": "connected"
  }
}
```

**API Root**:
```bash
curl https://teamup-api.onrender.com/
```
Expected:
```json
{
  "message": "TeamUp API",
  "version": "1.0.0"
}
```

**API Documentation**:
Visit: `https://teamup-api.onrender.com/docs`
- Should show Swagger UI
- All endpoints should be listed

### 3. Update CORS Origins
1. Go to **Environment** tab
2. Update `CORS_ORIGINS` with your frontend URL
3. Save and wait for redeploy

### 4. Get Your API URL
Your API will be available at:
```
https://teamup-api.onrender.com
```

Or if you set a custom domain:
```
https://api.yourdomain.com
```

---

## Troubleshooting

### Service Won't Start
1. **Check Logs**: Go to **"Logs"** tab
2. **Common Issues**:
   - Missing environment variables
   - Database connection failed (check `DATABASE_URL`)
   - Migration errors (check logs)

### Database Connection Errors
1. Verify database is **linked** to web service
2. Check `DATABASE_URL` is set correctly
3. Database might still be provisioning (wait 2-3 minutes)

### Migration Failures
1. Check logs for specific error
2. Database might not be ready yet
3. SQLite fallback will activate automatically if PostgreSQL fails

### CORS Errors
1. Update `CORS_ORIGINS` with exact frontend URL
2. Include protocol: `https://` or `http://`
3. Restart service after updating

### Service Spins Down (Free Tier)
- Normal behavior: spins down after 15 min inactivity
- First request takes ~30 seconds to wake up
- Upgrade to paid plan for always-on

---

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | Yes* | PostgreSQL connection (auto-set when linked) | `postgresql://user:pass@host/db` |
| `JWT_SECRET` | Yes | Secret key for JWT tokens | `your-secret-key-here` |
| `APP_ENV` | No | Environment mode | `production` |
| `JWT_ALG` | No | JWT algorithm | `HS256` |
| `ACCESS_TTL_MIN` | No | Access token TTL | `30` |
| `REFRESH_TTL_DAYS` | No | Refresh token TTL | `7` |
| `CORS_ORIGINS` | No | Allowed CORS origins | `https://frontend.onrender.com` |
| `SQLITE_DB_PATH` | No | SQLite fallback path | `teamup_backup.db` |

*`DATABASE_URL` is automatically set when you link the database, but you can also set it manually.

---

## Project Structure on Render

Your project structure is:
```
/
├── main.py              ← Entry point (FastAPI app)
├── requirements.txt     ← Python dependencies
├── start.sh            ← Startup script
├── alembic/            ← Database migrations
├── api/                ← API endpoints
├── core/               ← Configuration
├── db/                 ← Database session (with fallback)
├── models/             ← SQLAlchemy models
├── schemas/            ← Pydantic schemas
├── services/           ← Business logic
└── ws/                 ← WebSocket manager
```

Render will:
1. Install dependencies from `requirements.txt`
2. Run `start.sh` which:
   - Runs migrations (`alembic upgrade head`)
   - Starts server (`uvicorn main:app`)

---

## Next Steps

1. ✅ Deploy backend (this guide)
2. ⏭️ Deploy frontend (separate service or different platform)
3. ⏭️ Update frontend API URL to point to Render
4. ⏭️ Test full application

---

## Support

- **Render Docs**: https://render.com/docs
- **Render Status**: https://status.render.com
- **Your Logs**: Dashboard → Service → Logs tab

Good luck! 🚀
