#!/bin/bash

# Production Build Script for AR Configurator
# This script builds the frontend and prepares the backend for deployment

set -e

echo "🚀 Starting production build process..."

# Check if we're in the correct directory
if [ ! -f "backend/package.json" ] || [ ! -f "frontend/package.json" ]; then
    echo "❌ Error: Run this script from the project root directory"
    exit 1
fi

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install --production=false

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install

# Build frontend
echo "🏗️  Building frontend..."
npm run build

# Copy frontend to backend
echo "📋 Copying frontend build to backend..."
cd ../backend
npm run copy:frontend

# Create logs directory for PM2
echo "📁 Creating logs directory..."
mkdir -p logs

echo "✅ Production build complete!"
echo ""
echo "📋 Next steps for VPS deployment:"
echo "1. Upload the entire project to your VPS"
echo "2. Install Node.js and PM2 on your VPS"
echo "3. Set up your .env file in the backend directory"
echo "4. Run: pm2 start ecosystem.config.js --env production"
echo "5. Set up Nginx reverse proxy"
echo ""
echo "🔗 The application will serve both API and frontend from the backend server"