# Render Troubleshooting Guide

## Common Issues and Solutions

### 1. "Internal server error" or Service won't start

**Possible causes:**
- Database connection issue
- Missing environment variables
- Migration failures
- Port configuration

**Solutions:**

#### Check Logs:
1. Go to your service in Render dashboard
2. Click "Logs" tab
3. Look for error messages

#### Verify Environment Variables:
Make sure these are set:
- `DATABASE_URL` (auto-set by Render when database is linked)
- `JWT_SECRET` (required)
- `APP_ENV=production`
- `CORS_ORIGINS` (your frontend URL)

#### Manual Setup (if Blueprint fails):

1. **Create Database first:**
   - New → PostgreSQL
   - Name: `teamup-db`
   - Plan: Free
   - Copy the **Internal Database URL**

2. **Create Web Service:**
   - New → Web Service
   - Connect GitHub repo
   - Settings:
     - **Build Command**: `pip install -r requirements.txt`
     - **Start Command**: `chmod +x start.sh && ./start.sh`
   - Environment Variables:
     ```
     APP_ENV=production
     DATABASE_URL=<paste Internal Database URL>
     JWT_SECRET=<generate with: openssl rand -hex 32>
     JWT_ALG=HS256
     ACCESS_TTL_MIN=30
     REFRESH_TTL_DAYS=7
     CORS_ORIGINS=https://your-frontend.onrender.com
     ```
   - **Link Database**: Click "Link Database" and select `teamup-db`

3. **Deploy**

### 2. Database Connection Errors

**Error**: `sqlalchemy.exc.OperationalError` or connection refused

**Solution:**
- Make sure database is **linked** to the web service
- Check that `DATABASE_URL` is set correctly
- Verify database is running (Render dashboard → Database → Status)

### 3. Migration Failures

**Error**: `alembic.util.exc.CommandError` or migration errors

**Solution:**
- Check database is accessible
- Verify `DATABASE_URL` format (should be `postgresql://...`)
- The app automatically converts it to `postgresql+psycopg://`
- Check logs for specific migration error

### 4. Port Issues

**Error**: Service starts but returns 503

**Solution:**
- Render automatically sets `$PORT` environment variable
- Make sure start command uses `$PORT` (not hardcoded 8000)
- Current start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### 5. CORS Errors

**Error**: CORS policy blocking requests from frontend

**Solution:**
- Update `CORS_ORIGINS` environment variable
- Add your frontend URL: `https://your-frontend.onrender.com`
- Include `http://localhost:5173` for local development
- Restart service after updating

### 6. Service Spins Down (Free Tier)

**Symptom**: First request takes 30+ seconds

**Solution:**
- This is normal on free tier
- Service spins down after 15 minutes of inactivity
- First request wakes it up (takes ~30 seconds)
- Upgrade to paid plan for always-on service

### 7. Build Failures

**Error**: Build command fails

**Common causes:**
- Missing dependencies in `requirements.txt`
- Python version mismatch
- Network issues during pip install

**Solution:**
- Check build logs
- Verify `requirements.txt` is complete
- Try rebuilding the service

## Quick Health Check

After deployment, test these endpoints:

1. **Health Check**: `https://your-service.onrender.com/health`
   - Should return: `{"status": "healthy"}`

2. **API Root**: `https://your-service.onrender.com/`
   - Should return: `{"message": "TeamUp API", "version": "1.0.0"}`

3. **API Docs**: `https://your-service.onrender.com/docs`
   - Should show Swagger UI

## Getting Help

1. **Check Render Logs**: Most detailed error info
2. **Check Build Logs**: For build-time errors
3. **Test Locally**: Make sure it works locally first
4. **Render Support**: dashboard.render.com → Support

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | Yes | Database connection (auto-set when linked) | `postgresql://user:pass@host/db` |
| `JWT_SECRET` | Yes | Secret key for JWT tokens | `your-secret-key-here` |
| `APP_ENV` | No | Environment mode | `production` |
| `JWT_ALG` | No | JWT algorithm | `HS256` |
| `ACCESS_TTL_MIN` | No | Access token TTL | `30` |
| `REFRESH_TTL_DAYS` | No | Refresh token TTL | `7` |
| `CORS_ORIGINS` | No | Allowed CORS origins | `https://frontend.onrender.com` |
| `PORT` | Auto | Port number (set by Render) | `10000` |
