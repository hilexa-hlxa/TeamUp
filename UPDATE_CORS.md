# Update CORS on Render Backend

Your frontend is now configured to use: `https://teamup-u17c.onrender.com/api/v1/`

## ⚠️ Important: Update CORS on Backend

To allow your frontend to make requests, you need to update the `CORS_ORIGINS` environment variable in Render.

### Steps:

1. **Go to Render Dashboard**: https://dashboard.render.com
2. **Select your service**: `teamup-u17c` (or `teamup-api`)
3. **Go to "Environment" tab**
4. **Find `CORS_ORIGINS` variable**
5. **Update it with your frontend URL**:

   If your frontend is on Render:
   ```
   https://your-frontend-service.onrender.com,http://localhost:5173
   ```

   If your frontend is on a different domain:
   ```
   https://your-frontend-domain.com,http://localhost:5173
   ```

   For local development, keep `http://localhost:5173` in the list.

6. **Click "Save Changes"**
7. **Wait for redeploy** (~2-3 minutes)

### Current CORS Configuration

The backend currently allows:
- `http://localhost:5173` (local development)
- `http://localhost:5174` (local development)
- `http://127.0.0.1:5173` (local development)
- `http://127.0.0.1:5174` (local development)

**Add your production frontend URL to this list!**

### Test CORS

After updating, test from your frontend:
```javascript
fetch('https://teamup-u17c.onrender.com/api/v1/health')
  .then(r => r.json())
  .then(console.log)
```

If CORS is configured correctly, you should see the health check response.

If you get CORS errors, double-check:
- ✅ Frontend URL is exactly correct (including `https://`)
- ✅ No trailing slashes in CORS_ORIGINS
- ✅ Service has been redeployed after changes
