# AR Configurator - Unified Application

## 🚀 Quick Start

Run the entire application (frontend + backend) with a single command:

```bash
npm run start
```

This command will:
1. Build the frontend for production
2. Start the backend server
3. Serve the frontend from the backend server

The application will be available at: **http://localhost:5000**

## 🏗 Architecture

### Unified Server Setup
- **Backend**: Node.js Express server (Port 5000)
- **Frontend**: React application served as static files from backend
- **Database**: PostgreSQL with Drizzle ORM
- **AR Framework**: A-Frame with MindAR

### How It Works
1. The backend server serves static files from `frontend/dist`
2. All API routes are available at `/api/*`
3. All other routes serve the React application (SPA routing)
4. Upload files are served from `/uploads/*`
5. AR experiences are served from `/experiences/*`

## 📋 Available Commands

```bash
# Start the complete application (builds frontend + starts backend)
npm run start

# Start only the backend (without building frontend)
npm run start:backend-only

# Development mode (separate frontend + backend servers)
npm run dev

# Build frontend only
npm run build:frontend

# Install all dependencies
npm run install:all

# Database operations
npm run db:migrate
npm run db:setup
```

## 🔧 Development vs Production

### Development Mode (`npm run dev`)
- Frontend: http://localhost:5173 (Vite dev server)
- Backend: http://localhost:5000 (Express API server)
- Hot reloading enabled
- Separate servers for frontend and backend

### Production Mode (`npm run start`)
- Single server: http://localhost:5000
- Frontend built and served statically from backend
- Optimized builds with minification
- Better performance and simplified deployment

## 🌐 Server Configuration

The backend automatically detects and serves the frontend:

```javascript
// Serve frontend static files from build
const frontendDistPath = path.join(__dirname, '..', '..', 'frontend', 'dist');
app.use(express.static(frontendDistPath));

// Handle SPA routing - send all non-API requests to frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});
```

## 🔍 API Endpoints

All API endpoints are available at `/api/*`:
- `GET /api/experiences` - List all AR experiences
- `POST /api/experiences` - Create new AR experience
- `GET /api/experiences/:id` - Get specific experience
- `PUT /api/experiences/:id` - Update experience
- `DELETE /api/experiences/:id` - Delete experience

## 📁 File Structure

```
ar-configurator/
├── frontend/
│   ├── dist/                 # Built frontend (served by backend)
│   ├── src/                  # React source code
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── server.js         # Main server (serves frontend + API)
│   │   ├── routes/           # API routes
│   │   └── ...
│   ├── uploads/              # Uploaded files
│   ├── experiences/          # Generated AR experiences
│   └── package.json
└── package.json              # Root package with unified commands
```

## 🚀 Deployment

For production deployment:

1. Install dependencies: `npm run install:all`
2. Set up environment variables in `backend/.env`
3. Run database migrations: `npm run db:migrate`
4. Start the application: `npm run start`

The application will automatically build the frontend and start serving both the frontend and backend from a single server.

## ✅ Benefits of Unified Setup

- **Simplified Deployment**: Single command to run everything
- **Reduced Complexity**: One server instead of two
- **Better Performance**: Static file serving with optimized builds
- **Easier CORS**: No cross-origin issues between frontend and backend
- **Production Ready**: Optimized for production deployment

---

**Your AR Configurator is now running as a unified application!** 🎉