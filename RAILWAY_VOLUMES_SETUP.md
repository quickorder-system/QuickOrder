# Railway Persistent Volume Setup Guide

## Problem
Payment screenshots uploaded to QuickOrder are stored in the `/uploads` directory. In Railway's default ephemeral containers, files don't persist between deployments or restarts, causing 404 errors when trying to view payment proofs.

## Solution: Configure Persistent Volume in Railway

### Steps to Configure Volume:

1. **Go to Railway Dashboard**
   - Navigate to your QuickOrder project
   - Click on the "Backend" service

2. **Configure Volume**
   - Go to the "Settings" tab
   - Scroll to "Storage" section
   - Click "Add Volume"
   - Set the following:
     - **Mount Path**: `/app/uploads`
     - **Size**: Choose at least 1GB (for payment screenshots)

3. **Redeploy**
   - The service will restart with the persistent volume mounted
   - Future uploads will persist across restarts and deployments

### What's Already in Place:

✅ **Dockerfile** - Creates `/app/uploads` directory during build
✅ **docker-compose.yml** - Mounts `uploads-data` volume for local development
✅ **upload.js** - Uses `{ recursive: true }` to ensure directory creation
✅ **server.js** - Serves `/uploads` as static files

### Verifying it Works:

1. Upload a payment screenshot in the app
2. Restart the Railway service
3. Check if the image still loads from the admin panel
4. If it works, you should see the payment proof image display without 404 errors

### File Upload Location:
- **Local Development**: `/uploads/` (volume in docker-compose)
- **Production (Railway)**: `/app/uploads/` (persistent volume)
- **Access URL**: `https://quickorder-production-145f.up.railway.app/uploads/[filename]`

### Troubleshooting:

If images still return 404:

1. Check if volume is actually mounted in Railway dashboard:
   - Service Settings → Storage
   - Should show a mounted volume at `/app/uploads`

2. Check server logs:
   - Look for errors during file upload
   - File should be saved successfully with 200 response

3. Verify the upload was successful:
   - Check the response from `/api/upload` 
   - Should include `fileUrl: "/uploads/[timestamp-filename]"`

4. Check if file permissions are correct:
   - Railway should have write permissions to volume

### Database Persistence:
- MongoDB data is already persistent via `mongo-data` volume
- This guide ensures payment screenshots are also persistent
