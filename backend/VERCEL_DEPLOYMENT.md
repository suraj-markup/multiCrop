# 🚀 Vercel Backend Deployment Guide

## 📋 Pre-deployment Setup

### 1. Project Structure
Your backend should have this structure:
```
backend/
├── api/
│   └── index.py          # Vercel entry point
├── app/
│   ├── main.py          # FastAPI app
│   ├── config.py        # Configuration
│   └── ...
├── vercel.json          # Vercel configuration
├── requirements.txt     # Python dependencies
└── VERCEL_DEPLOYMENT.md # This guide
```

### 2. Environment Variables
You'll need to set these in Vercel dashboard:

**Required:**
```
SUPABASE_URL=https://gcphmqkssyeippswxxfz.supabase.co
SUPABASE_KEY=your_supabase_service_role_key
SUPABASE_BUCKET=Images
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
MONGODB_DB_NAME=pdftoppt
```

**Optional:**
```
ENVIRONMENT=production
FRONTEND_URL=https://your-frontend-domain.vercel.app
```

## 🔧 Deployment Steps

### Step 1: Install Vercel CLI
```bash
npm i -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```

### Step 3: Deploy from Backend Directory
```bash
cd backend
vercel
```

Follow the prompts:
- **Set up and deploy?** → Yes
- **Which scope?** → Your personal account
- **Link to existing project?** → No
- **Project name?** → `your-project-backend` (or any name)
- **Directory?** → `./` (current directory)

### Step 4: Set Environment Variables
After first deployment, go to:
1. Vercel Das Yohboard →ur Project → Settings → Environment Variables
2. Add all the environment variables listed above
3. Redeploy: `vercel --prod`

### Step 5: Update Frontend API URL
In your frontend code, replace:
```javascript
https://teacher-backend-xi.vercel.app/api/questions
```

With your new Vercel backend URL:
```javascript
https://your-backend-project.vercel.app/api/questions
```

## 🔍 Testing Your Deployment

After deployment, test these endpoints:

1. **Health Check:**
   ```
   GET https://your-backend-project.vercel.app/
   ```

2. **Database Connection:**
   ```
   GET https://your-backend-project.vercel.app/test-db
   ```

3. **Questions API:**
   ```
   GET https://your-backend-project.vercel.app/api/questions
   ```

## 🐛 Common Issues & Solutions

### Issue 1: Import Errors
**Problem:** `ModuleNotFoundError: No module named 'app'`
**Solution:** The `api/index.py` file should properly import your app

### Issue 2: CORS Errors
**Problem:** Frontend can't connect to backend
**Solution:** 
1. Set `FRONTEND_URL` environment variable
2. Update CORS origins in `app/main.py`

### Issue 3: Database Connection Fails
**Problem:** MongoDB connection timeout
**Solution:** 
1. Check `MONGODB_URI` environment variable
2. Ensure MongoDB Atlas allows connections from `0.0.0.0/0`

### Issue 4: Function Timeout
**Problem:** Requests taking too long
**Solution:** Increase `maxDuration` in `vercel.json` (max 30s on free plan)

## 📱 Frontend Integration

After backend deployment, update your frontend:

1. **Update API Base URL:**
   ```javascript
   // In your frontend config or API calls
   const API_BASE_URL = 'https://your-backend-project.vercel.app';
   ```

2. **Update CORS Origins:**
   In `backend/app/main.py`, replace:
   ```python
   "https://your-frontend-domain.vercel.app"
   ```
   With your actual frontend Vercel URL.

## 🔒 Security Checklist

- ✅ Environment variables set (not hardcoded)
- ✅ CORS properly configured
- ✅ MongoDB Atlas IP whitelist updated
- ✅ Supabase service role key secured
- ✅ No sensitive data in git repository

## 🚀 Continuous Deployment

To enable automatic deployments:
1. Connect your GitHub repository to Vercel
2. Set the root directory to `backend`
3. Every push to main branch will auto-deploy

## 📞 Support

If you encounter issues:
1. Check Vercel function logs in dashboard
2. Test endpoints individually
3. Verify environment variables
4. Check this guide for common solutions

Your FastAPI backend is now ready for Vercel! 🎉 