    # Railway Persistent Volume Setup Guide

    ## Quick Summary
    Payment screenshots are returning 404 errors because Railway containers are ephemeral (temporary). Files uploaded to `/uploads` disappear when the app restarts. **Solution**: Add a persistent volume at `/app/uploads` to permanently store screenshots.

    ## Problem
    Payment screenshots uploaded to QuickOrder are stored in the `/uploads` directory. In Railway's default ephemeral containers, files don't persist between deployments or restarts, causing 404 errors when trying to view payment proofs.

## Solution: Configure Persistent Volume in Railway

### Steps to Configure Volume:

1. **Go to Railway Dashboard**
   - Visit https://railway.app
   - Select your QuickOrder project

2. **Locate the Service**
   - In the project canvas/diagram, you should see your app service
   - Look for a box labeled with your app name or "Backend"
   - Click on it to open the service details

3. **Configure Volume**
   - Once the service is selected, look for a **"Volumes"** tab or section
   - Alternatively, check the **"Settings"** tab on the right sidebar
   - Click **"Create Volume"** or **"Add Volume"**
   - Fill in the configuration:
     - **Mount Path**: `/app/uploads`
     - **Size**: 1 GB (sufficient for payment screenshots)
   - Click **"Create"**

4. **Redeploy**
   - Railway will automatically redeploy your service with the volume mounted
   - Wait for the deployment to complete (check the "Deployments" tab)
   - Once complete, the service will be running with persistent storage

**Note**: If you can't find a "Volumes" section, the option might be under:
   - Service Settings → Storage
   - Right-click the service → Add Volume
   - The three-dot menu on the service card

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

1. **Can't find the Volume section?**
   - Look at the top of the service panel for tabs: "Overview", "Logs", "Settings", "Deploy"
   - Volumes might be under "Settings"
   - Try right-clicking on the service in the canvas
   - Check if there's a menu button (⋮ or ⋯) with "Add Volume" option

2. **Check if volume is actually mounted in Railway dashboard:**
   - Service Settings → Look for "Volumes" or "Storage" section
   - Should show a mounted volume at `/app/uploads`
   - If not present, the volume hasn't been created yet

3. **Check server logs:**
   - Go to the service "Logs" tab
   - Look for errors during file upload
   - File should be saved successfully with 200 response
   - Look for messages like "File uploaded successfully: /uploads/[filename]"

4. **Verify the upload was successful:**
   - Open browser DevTools (F12)
   - Go to Network tab
   - Upload a payment screenshot
   - Check the response from `POST /api/upload`
   - Should include `fileUrl: "/uploads/[timestamp-filename]"`

5. **Check if file permissions are correct:**
   - Railway should have write permissions to volume
   - Check logs for permission errors like "EACCES" or "Permission denied"

6. **Alternative: Check Deployments**
   - Go to your project's "Deployments" tab
   - Make sure the latest deployment completed successfully
   - If failed, check the logs for errors

### Database Persistence:
- MongoDB data is already persistent via `mongo-data` volume
- This guide ensures payment screenshots are also persistent
