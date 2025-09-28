@echo off
REM Production Build Script for AR Configurator (Windows)
REM This script builds the frontend and prepares the backend for deployment

echo 🚀 Starting production build process...

REM Check if we're in the correct directory
if not exist "backend\package.json" (
    echo ❌ Error: Run this script from the project root directory
    exit /b 1
)

if not exist "frontend\package.json" (
    echo ❌ Error: Run this script from the project root directory
    exit /b 1
)

REM Install backend dependencies
echo 📦 Installing backend dependencies...
cd backend
call npm install --production=false
if %errorlevel% neq 0 (
    echo ❌ Failed to install backend dependencies
    exit /b 1
)

REM Install frontend dependencies
echo 📦 Installing frontend dependencies...
cd ..\frontend
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install frontend dependencies
    exit /b 1
)

REM Build frontend
echo 🏗️  Building frontend...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Failed to build frontend
    exit /b 1
)

REM Copy frontend to backend
echo 📋 Copying frontend build to backend...
cd ..\backend
call npm run copy:frontend
if %errorlevel% neq 0 (
    echo ❌ Failed to copy frontend to backend
    exit /b 1
)

REM Create logs directory for PM2
echo 📁 Creating logs directory...
if not exist "logs" mkdir logs

echo ✅ Production build complete!
echo.
echo 📋 Next steps for VPS deployment:
echo 1. Upload the entire project to your VPS
echo 2. Install Node.js and PM2 on your VPS
echo 3. Set up your .env file in the backend directory
echo 4. Run: pm2 start ecosystem.config.js --env production
echo 5. Set up Nginx reverse proxy
echo.
echo 🔗 The application will serve both API and frontend from the backend server

cd ..