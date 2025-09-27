# 🚀 Complete Vercel Deployment Guide for AR Configurator

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Push your code to GitHub
3. **MySQL Database**: Your Hostinger MySQL database is already configured

## 📁 Project Structure (Cleaned for Production)

```
ar-configurator/
├── frontend/           # React + Vite frontend
├── backend/           # Node.js + Express API
├── vercel.json       # Vercel configuration
├── .vercelignore     # Files to ignore during deployment
└── package.json      # Root package.json
```

## 🔧 Step 1: Prepare for Deployment

### 1.1 Update Frontend Configuration

Edit `frontend/src/config/api.js` (or similar) to use environment-based API URL:

```javascript
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-app-name.vercel.app/api'  // Replace with your Vercel URL
  : 'http://localhost:5000/api';

export { API_BASE_URL };
```

### 1.2 Update Frontend Build Configuration

In `frontend/vite.config.js`, ensure it's configured for production:

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'three-vendor': ['three', '@react-three/fiber', '@react-three/drei']
        }
      }
    }
  },
  server: {
    port: 5173,
    host: true
  }
})
```

## 🚀 Step 2: Deploy to Vercel

### 2.1 Connect GitHub Repository

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Select the root directory of your project

### 2.2 Configure Build Settings

Vercel will automatically detect the configuration from `vercel.json`, but verify:

**Framework Preset**: Other
**Root Directory**: `./` (root)
**Build Command**: `npm run vercel-build`
**Output Directory**: `frontend/dist`

### 2.3 Environment Variables

Add these environment variables in Vercel Dashboard:

```bash
# Database
DATABASE_URL=mysql://u311916992_ijazkhan:Ikafridi%40640@srv1973.hstgr.io:3306/u311916992_packarcreator

# App Configuration
NODE_ENV=production
PORT=5000

# Security (IMPORTANT: Change these values)
JWT_SECRET=super_secret_production_jwt_key_2025_ar_configurator_v1_secure
COOKIE_SECRET=super_secret_production_cookie_key_2025_ar_configurator_v1_secure

# CORS (Replace with your actual Vercel URL)
CORS_ORIGIN=https://your-app-name.vercel.app

# AR Configuration
AR_POSITION_SCALE=0.3
AR_Y_OFFSET=0.01
AR_DEBUG_TRANSFORMS=false
AR_MODEL_ROTATION_X=0
AR_MODEL_ROTATION_Y=0
AR_MODEL_ROTATION_Z=0
AR_POSITION_SCALE_FACTOR=0.8
AR_SCALE_FACTOR_IMAGE=0.5
AR_SCALE_FACTOR_MODEL=0.5
AR_SCALE_FACTOR_VIDEO=0.5
```

### 2.4 Deploy

1. Click "Deploy"
2. Vercel will build and deploy your application
3. You'll get a URL like `https://your-app-name.vercel.app`

## 🔄 Step 3: Post-Deployment Configuration

### 3.1 Update CORS Settings

After getting your Vercel URL, update the `CORS_ORIGIN` environment variable:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Update `CORS_ORIGIN` with your actual Vercel URL
3. Redeploy the application

### 3.2 Update Frontend API Configuration

Update your frontend API base URL to match your Vercel deployment:

```javascript
// In your frontend API configuration
const API_BASE_URL = 'https://your-actual-vercel-url.vercel.app/api';
```

## 📱 Step 4: Test Deployment

### 4.1 Basic Functionality Test

1. Visit your Vercel URL
2. Test user registration/login
3. Test file uploads
4. Test AR experience creation

### 4.2 API Endpoints Test

Test these endpoints:
- `GET /api/health` - Health check
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/experiences` - Get experiences
- `POST /api/experiences` - Create experience

## 🔒 Step 5: Security & Production Hardening

### 5.1 Environment Variables Security

**CRITICAL**: Update these production secrets:

```bash
JWT_SECRET=<generate-a-strong-random-string>
COOKIE_SECRET=<generate-a-different-strong-random-string>
```

Generate secure secrets:
```bash
# Use this command to generate secure secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 5.2 Database Security

- Ensure your MySQL database has proper firewall rules
- Consider using connection pooling limits
- Monitor database connections

## 🐛 Step 6: Troubleshooting

### Common Issues and Solutions

**Issue**: "Function timeout"
**Solution**: Increase function timeout in `vercel.json`:
```json
{
  "functions": {
    "backend/src/server.js": {
      "maxDuration": 30
    }
  }
}
```

**Issue**: "CORS errors"
**Solution**: Verify `CORS_ORIGIN` environment variable matches your Vercel URL exactly

**Issue**: "Database connection failed"
**Solution**: Check `DATABASE_URL` format and ensure MySQL server is accessible

**Issue**: "File uploads not working"
**Solution**: Vercel has file size limits. Consider using external storage (AWS S3, Cloudinary)

## 📊 Step 7: Monitoring & Analytics

### 7.1 Vercel Analytics

Enable Vercel Analytics in your dashboard for:
- Page views
- Performance metrics
- Error tracking

### 7.2 Database Monitoring

Monitor your MySQL database:
- Connection count
- Query performance
- Storage usage

## 🔄 Step 8: Continuous Deployment

### Automatic Deployments

Vercel automatically deploys when you:
1. Push to your main branch
2. Merge pull requests
3. Make changes to your repository

### Branch Deployments

- Each pull request gets a preview deployment
- Test features before merging to main

## 📝 Step 9: Custom Domain (Optional)

### Add Custom Domain

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed
4. Update `CORS_ORIGIN` environment variable

## 🎯 Final Checklist

- [ ] Code pushed to GitHub
- [ ] Vercel project created and connected
- [ ] Environment variables configured
- [ ] CORS_ORIGIN updated with actual URL
- [ ] JWT_SECRET and COOKIE_SECRET changed to secure values
- [ ] Database connection tested
- [ ] File uploads working
- [ ] AR experiences creating successfully
- [ ] Frontend connecting to backend API
- [ ] All API endpoints responding correctly

## 🚀 Your AR Configurator is now live on Vercel!

Access your application at: `https://your-app-name.vercel.app`

---

## 📞 Need Help?

If you encounter issues:
1. Check Vercel deployment logs
2. Check browser developer console
3. Verify environment variables
4. Test database connectivity
5. Check API endpoint responses

Your AR Configurator is production-ready with MySQL database integration! 🎉