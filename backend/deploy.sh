#!/bin/bash

echo "🚀 Deploying FastAPI Backend to Vercel..."

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check if we're in the backend directory
if [ ! -f "vercel.json" ]; then
    echo "❌ vercel.json not found. Make sure you're in the backend directory."
    exit 1
fi

# Check if api/index.py exists
if [ ! -f "api/index.py" ]; then
    echo "❌ api/index.py not found. Creating it..."
    mkdir -p api
    echo "from app.main import app" > api/index.py
fi

echo "✅ Pre-deployment checks passed!"

# Deploy to Vercel
echo "🔄 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Set environment variables in Vercel dashboard"
echo "2. Update frontend API URL"
echo "3. Test your endpoints"
echo ""
echo "📖 See VERCEL_DEPLOYMENT.md for detailed instructions" 