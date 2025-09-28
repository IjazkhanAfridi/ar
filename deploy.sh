#!/bin/bash

# AR Configurator Deployment Script for VPS
# This script handles initial deployment and updates

set -e  # Exit on any error

echo "🚀 Starting AR Configurator Deployment..."

# Configuration
PROJECT_DIR="/var/www/ar-configurator"
GIT_REPO="https://github.com/IjazkhanAfridi/ar.git"
BRANCH="production"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if this is initial deployment or update
if [ -d "$PROJECT_DIR" ]; then
    print_status "Updating existing deployment..."
    cd $PROJECT_DIR
    
    # Stop PM2 process
    pm2 stop ar-configurator || true
    
    # Pull latest changes
    git pull origin $BRANCH
    
    print_status "Repository updated"
else
    print_status "Initial deployment - cloning repository..."
    cd /var/www/
    git clone $GIT_REPO ar-configurator
    cd ar-configurator
    git checkout $BRANCH
    
    print_status "Repository cloned"
fi

# Install dependencies
print_status "Installing dependencies..."
npm run install:all

# Build frontend
print_status "Building frontend..."
npm run build

# Copy frontend to backend
print_status "Copying frontend to backend..."
npm run copy:frontend

# Verify build
if [ -f "backend/public/index.html" ]; then
    print_status "Frontend build successful"
else
    print_error "Frontend build failed - index.html not found"
    exit 1
fi

# Set up directories and permissions
print_status "Setting up directories and permissions..."
mkdir -p backend/uploads backend/experiences logs
chmod 755 backend/uploads backend/experiences
chown -R www-data:www-data backend/uploads backend/experiences || true

# Set up environment file
if [ ! -f "backend/.env" ]; then
    if [ -f "backend/.env.production" ]; then
        cp backend/.env.production backend/.env
        print_status "Environment file created from .env.production"
    else
        print_warning "No environment file found. Please create backend/.env"
    fi
fi

# Start or restart PM2 process
print_status "Starting application with PM2..."
if pm2 describe ar-configurator > /dev/null 2>&1; then
    pm2 restart ar-configurator
    print_status "Application restarted"
else
    pm2 start ecosystem.config.js --env production
    pm2 save
    print_status "Application started"
fi

# Wait a moment for the app to start
sleep 3

# Check if application is running
if pm2 describe ar-configurator | grep -q "online"; then
    print_status "✅ Deployment successful!"
    print_status "Application is running on port 3001"
    print_status "Check status with: pm2 status"
    print_status "View logs with: pm2 logs ar-configurator"
else
    print_error "❌ Deployment failed - application not running"
    print_error "Check logs with: pm2 logs ar-configurator"
    exit 1
fi

echo ""
print_status "🎉 AR Configurator deployment complete!"
print_status "Visit your subdomain to test the application"