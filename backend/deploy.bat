@echo off
echo 🚀 Deploying FastAPI Backend to Vercel...

REM Check if vercel CLI is installed
where vercel >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Vercel CLI not found. Installing...
    npm install -g vercel
)

REM Check if we're in the backend directory
if not exist "vercel.json" (
    echo ❌ vercel.json not found. Make sure you're in the backend directory.
    pause
    exit /b 1
)

REM Check if api/index.py exists
if not exist "api\index.py" (
    echo ❌ api/index.py not found. Creating it...
    mkdir api 2>nul
    echo from app.main import app > api\index.py
)

echo ✅ Pre-deployment checks passed!

REM Deploy to Vercel
echo 🔄 Deploying to Vercel...
vercel --prod

echo ✅ Deployment complete!
echo.
echo 📋 Next steps:
echo 1. Set environment variables in Vercel dashboard
echo 2. Update frontend API URL
echo 3. Test your endpoints
echo.
echo 📖 See VERCEL_DEPLOYMENT.md for detailed instructions
pause 