# Render Deployment Guide

## Quick Setup (Using render.yaml)

1. **Push render.yaml to GitHub** (already created)

2. **Go to Render Dashboard**: https://dashboard.render.com

3. **Create New Blueprint**:
   - Click "New +" → "Blueprint"
   - Connect your GitHub repository: `hilexa-hlxa/TeamUp`
   - Render will automatically detect `render.yaml`
   - Click "Apply"

4. **Update CORS_ORIGINS**:
   - After deployment, go to your service settings
   - Update `CORS_ORIGINS` environment variable with your frontend URL

---

## Manual Setup (Alternative)

### Step 1: Create PostgreSQL Database

1. Go to Render Dashboard → "New +" → "PostgreSQL"
2. Settings:
   - **Name**: `teamup-db`
   - **Database**: `teamup`
   - **User**: `teamup_user`
   - **Region**: Oregon (or closest to you)
   - **Plan**: Free
3. Click "Create Database"
4. **Copy the Internal Database URL** (you'll need this)

### Step 2: Create Web Service

1. Go to Render Dashboard → "New +" → "Web Service"
2. Connect your GitHub repository: `hilexa-hlxa/TeamUp`
3. Configure settings:

#### Basic Settings:
- **Name**: `teamup-api`
- **Region**: Oregon
- **Branch**: `main`
- **Root Directory**: (leave empty)
- **Environment**: `Python 3`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `alembic upgrade head && uvicorn main:app --host 0.0.0.0 --port $PORT`

#### Environment Variables:
Add these in the "Environment" section:

```
APP_ENV=production
JWT_SECRET=<generate a random secret key>
JWT_ALG=HS256
ACCESS_TTL_MIN=30
REFRESH_TTL_DAYS=7
CORS_ORIGINS=https://your-frontend-url.onrender.com,http://localhost:5173
DB_URL=<paste the Internal Database URL from Step 1>
```

**Important**: 
- Replace `<generate a random secret key>` with a strong random string (you can use: `openssl rand -hex 32`)
- Replace `<paste the Internal Database URL from Step 1>` with your actual database connection string
- Update `CORS_ORIGINS` with your frontend URL after deploying

#### Advanced Settings:
- **Auto-Deploy**: Yes (deploys on every push to main)
- **Health Check Path**: `/health`

4. Click "Create Web Service"

### Step 3: Link Database to Service

1. In your Web Service settings
2. Go to "Environment" tab
3. Click "Link Database" 
4. Select `teamup-db`
5. The `DB_URL` will be automatically set

---

## Database Connection String Format

Render provides the connection string in this format:
```
postgresql://teamup_user:password@dpg-xxxxx-a.oregon-postgres.render.com/teamup
```

Your app uses `postgresql+psycopg://`, but `postgresql://` also works with psycopg.

---

## After Deployment

1. **Check logs**: Go to your service → "Logs" tab
2. **Test health endpoint**: `https://your-service.onrender.com/health`
3. **API docs**: `https://your-service.onrender.com/docs`
4. **Update CORS**: Add your frontend URL to `CORS_ORIGINS`

---

## Troubleshooting

### Migration fails:
- Check database is linked correctly
- Verify `DB_URL` environment variable
- Check logs for specific error

### Service won't start:
- Check "Logs" tab for errors
- Verify `startCommand` is correct
- Ensure all environment variables are set

### CORS errors:
- Update `CORS_ORIGINS` with your frontend URL
- Include both `https://` and `http://` if needed
- Restart service after updating

---

## Free Tier Limitations

- Services spin down after 15 minutes of inactivity
- First request after spin-down takes ~30 seconds
- Database has 90-day retention on free tier
- 750 hours/month compute time

---

## Production Recommendations

1. **Upgrade to paid plan** for always-on service
2. **Use custom domain** for your API
3. **Set up monitoring** and alerts
4. **Enable auto-scaling** if needed
5. **Use Render's managed SSL** (automatic)
