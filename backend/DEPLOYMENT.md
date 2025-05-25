# Backend Deployment Guide

## 🚀 Hosting Options

### 1. Vercel (Recommended for simplicity)
- **Pros**: Same platform as frontend, easy setup
- **Cons**: Limited for heavy compute tasks
- **Best for**: Small to medium apps

### 2. Railway (Recommended for FastAPI)
- **Pros**: Great FastAPI support, easy database integration
- **Cons**: Paid after free tier
- **Best for**: Production apps with databases

### 3. Render
- **Pros**: Free tier, good performance
- **Cons**: Cold starts on free tier
- **Best for**: Small to medium production apps

## 📋 Pre-deployment Checklist

### 1. Environment Variables Setup
Create these environment variables in your hosting platform:

```
ENVIRONMENT=production
SUPABASE_URL=https://gcphmqkssyeippswxxfz.supabase.co
SUPABASE_KEY=your_supabase_service_role_key
SUPABASE_BUCKET=Images
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
MONGODB_DB_NAME=pdftoppt
FRONTEND_URL=https://your-frontend-domain.vercel.app
```

### 2. Update CORS Origins
In `app/main.py`, replace `"https://your-frontend-domain.vercel.app"` with your actual frontend URL.

### 3. Dependencies
Ensure `requirements.txt` includes all dependencies:
```
fastapi>=0.68.0
python-multipart
firebase-admin
pillow
python-dotenv
uvicorn
pydantic
pytest
httpx
pymongo
```

## 🔧 Deployment Steps

### For Vercel:
1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in the backend directory
3. Set environment variables in Vercel dashboard
4. Deploy: `vercel --prod`

### For Railway:
1. Connect GitHub repo to Railway
2. Select backend folder as root
3. Set environment variables in Railway dashboard
4. Deploy automatically on git push

### For Render:
1. Connect GitHub repo
2. Set build command: `pip install -r requirements.txt`
3. Set start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Set environment variables

## 🔒 Security Notes

1. **Never commit sensitive credentials to git**
2. **Use environment variables for all secrets**
3. **Update CORS origins for production**
4. **Use HTTPS in production**
5. **Consider rate limiting for production**

## 🧪 Testing Deployment

After deployment, test these endpoints:
- `GET /` - Health check
- `GET /test-db` - Database connection
- `GET /questions` - API functionality

## 📱 Frontend Configuration

Update your frontend API URL from:
```javascript
https://teacher-backend-xi.vercel.app/api/questions
```

To your new backend URL:
```javascript
https://your-backend-domain.com/questions
``` 