# 🚀 Hostinger VPS Deployment Guide - AR Configurator

## 📋 Overview
This guide will help you deploy your AR Configurator on your Hostinger VPS using a subdomain, with the backend serving both API and frontend.

## 🏗️ Architecture
```
Your VPS:
├── Main Domain (existing app)
├── Subdomain (AR Configurator)
│   ├── Backend Server (Node.js + Express)
│   ├── Frontend (served by backend)
│   ├── MySQL Database (Hostinger)
│   └── File Uploads
```

## 🔧 Prerequisites

### On Your Local Machine
- Node.js installed
- Git configured
- Your project cleaned and ready

### On Your Hostinger VPS
- SSH access to your VPS
- Node.js installed (v18+ recommended)
- PM2 process manager
- Nginx configured
- Your existing app running

## 📁 Step 1: Prepare Local Project

### 1.1 Test Local Build
```bash
# Use the production build script (recommended)
./build-production.bat  # Windows
# OR
./build-production.sh   # Linux/Mac

# OR manually:
cd backend
npm run build

# Test local production server
npm start
```

Visit `http://localhost:5000` to ensure everything works.

### 1.2 Create Production Environment File
Create `backend/.env.production`:
```bash
# Database Configuration
DATABASE_URL=mysql://u311916992_ijazkhan:Ikafridi%40640@srv1973.hstgr.io:3306/u311916992_packarcreator
NODE_ENV=production
PORT=3001

# Your subdomain
HOST=0.0.0.0
CORS_ORIGIN=https://ar.yourdomain.com

# Security (Generate new secrets)
JWT_SECRET=your_new_super_secure_jwt_secret_2025
COOKIE_SECRET=your_new_super_secure_cookie_secret_2025

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

# Upload limits
MAX_FILE_SIZE=52428800
```

### 1.3 Push to Git
```bash
git add .
git commit -m "Prepared for VPS deployment"
git push origin production
```

## 🌐 Step 2: Configure Subdomain

### 2.1 Add Subdomain in Hostinger Panel
1. Go to Hostinger hPanel
2. Navigate to **DNS/Subdomains**
3. Create subdomain: `ar.yourdomain.com`
4. Point it to your VPS IP address

### 2.2 Verify DNS Propagation
```bash
# Check if subdomain resolves to your VPS
nslookup ar.yourdomain.com
```

## 🖥️ Step 3: Deploy on VPS

### 3.1 SSH into Your VPS
```bash
ssh root@your-vps-ip
# or
ssh your-username@your-vps-ip
```

### 3.2 Navigate to Web Directory
```bash
cd /var/www/
# or wherever your web files are located
```

### 3.3 Clone Your Repository
```bash
git clone https://github.com/IjazkhanAfridi/ar.git ar-configurator
cd ar-configurator
git checkout production
```

### 3.4 Install Dependencies and Build
```bash
# Use the production build script (recommended)
chmod +x build-production.sh
./build-production.sh

# OR manually:
cd backend
npm install --production=false
cd ../frontend  
npm install
npm run build
cd ../backend
npm run copy:frontend

# Verify the build
ls -la backend/public/
# Should show index.html and assets folder
```

### 3.5 Set Up Environment
```bash
# Copy environment file
cp backend/.env.production backend/.env

# Make sure uploads directory exists
mkdir -p backend/uploads
chmod 755 backend/uploads

# Make sure experiences directory exists  
mkdir -p backend/experiences
chmod 755 backend/experiences
```

## ⚙️ Step 4: Configure Nginx

### 4.1 Create Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/ar-configurator
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name ar.yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ar.yourdomain.com;
    
    # SSL Configuration (use your existing SSL setup)
    ssl_certificate /path/to/your/ssl/cert.pem;
    ssl_certificate_key /path/to/your/ssl/private.key;
    
    # Basic SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # Proxy to Node.js app
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # File upload size limit
        client_max_body_size 100M;
    }
    
    # Handle static files efficiently
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:3001;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
```

### 4.2 Enable the Site
```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/ar-configurator /etc/nginx/sites-enabled/

# Test nginx configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

## 🔄 Step 5: Set Up Process Manager

### 5.1 Install PM2 (if not already installed)
```bash
npm install -g pm2
```

### 5.2 Create PM2 Configuration
Create `ecosystem.config.js` in your project root:
```javascript
module.exports = {
  apps: [{
    name: 'ar-configurator',
    script: 'backend/src/server.js',
    cwd: '/var/www/ar-configurator',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    instances: 1,
    exec_mode: 'cluster',
    watch: false,
    max_memory_restart: '1G',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

### 5.3 Start the Application
```bash
# Create logs directory
mkdir -p logs

# Start with PM2
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Set up PM2 to start on boot
pm2 startup
```

## 🔒 Step 6: SSL Configuration

### 6.1 If Using Let's Encrypt
```bash
# Install certbot (if not already installed)
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d ar.yourdomain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

### 6.2 Update Nginx Configuration
After SSL setup, your nginx config will be automatically updated, or update the SSL paths in the config above.

## 🧪 Step 7: Testing and Verification

### 7.1 Check Application Status
```bash
# Check PM2 status
pm2 status

# Check application logs
pm2 logs ar-configurator

# Check if port is listening
netstat -tlnp | grep :3001
```

### 7.2 Test the Application
1. Visit `https://ar.yourdomain.com`
2. Test user registration
3. Test file uploads
4. Test AR experience creation
5. Check browser console for errors

## 🔄 Step 8: Deployment Scripts

### 8.1 Create Update Script
Create `update.sh` on your VPS:
```bash
#!/bin/bash
cd /var/www/ar-configurator

# Pull latest changes
git pull origin production

# Install any new dependencies
npm run install:all

# Rebuild frontend
npm run build
npm run copy:frontend

# Restart PM2 process
pm2 restart ar-configurator

echo "Deployment complete!"
```

Make it executable:
```bash
chmod +x update.sh
```

### 8.2 Future Updates
For future updates:
```bash
./update.sh
```

## 📊 Step 9: Monitoring and Maintenance

### 9.1 Set Up Log Rotation
```bash
# Install logrotate configuration
sudo nano /etc/logrotate.d/ar-configurator
```

Add:
```
/var/www/ar-configurator/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        pm2 reload ar-configurator
    endscript
}
```

### 9.2 Monitor Application
```bash
# Check PM2 status
pm2 monit

# Check system resources
htop

# Check nginx access logs
tail -f /var/log/nginx/access.log

# Check application logs
pm2 logs ar-configurator --lines 100
```

## 🚀 Final Checklist

- [ ] Subdomain DNS configured and propagated
- [ ] Application built and deployed on VPS
- [ ] Nginx configured with SSL
- [ ] PM2 process running successfully
- [ ] Database connection working
- [ ] File uploads working (check permissions)
- [ ] AR experiences creating successfully
- [ ] All static assets loading correctly

## 🎯 Your AR Configurator is now live at: `https://ar.yourdomain.com`

### 📞 Troubleshooting

**Common Issues:**
1. **502 Bad Gateway**: PM2 process not running - check `pm2 status`
2. **Database Connection Failed**: Check `.env` file and database credentials
3. **File Upload Errors**: Check directory permissions for `uploads/` and `experiences/`
4. **SSL Issues**: Verify certificate paths in nginx config
5. **Static Files Not Loading**: Ensure frontend was built and copied to `backend/public/`

**Log Locations:**
- Application logs: `pm2 logs ar-configurator`
- Nginx logs: `/var/log/nginx/`
- System logs: `/var/log/syslog`