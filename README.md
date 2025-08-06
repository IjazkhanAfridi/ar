# AR Configurator - Fixed Version

This AR Configurator application has been completely fixed to work perfectly like the previous version. It includes all the features for creating AR experiences with image tracking, 3D models, videos, audio, and multiple content types.

## Features

- **User Authentication**: Register, login, logout with JWT tokens
- **AR Experience Creation**: Upload images to convert to .mind files for AR tracking
- **Content Management**: Upload and manage 3D models, images, videos, and audio
- **AR Experience Builder**: Create AR experiences with positioned content
- **Multiple Image Tracking**: Support for multiple image targets in one experience
- **Experience Sharing**: Share AR experiences via generated links
- **Admin Dashboard**: Admin panel for managing users and content
- **Mobile AR**: Camera-based AR experiences that work on mobile devices

## Fixed Issues

1. ✅ **Complete AR Experience Generator** - HTML generation for AR experiences
2. ✅ **Mind File Handling** - Upload, storage, and serving of .mind files
3. ✅ **Experience HTML Serving** - Static serving of generated AR experience files
4. ✅ **Library Management** - Complete CRUD for models, images, videos, audio
5. ✅ **Authentication System** - Fixed JWT auth with proper token verification
6. ✅ **API Endpoints** - All missing routes and controllers implemented
7. ✅ **Database Schema** - Complete schema matching the previous version
8. ✅ **File Upload System** - Proper file handling with multer
9. ✅ **Frontend-Backend Integration** - Fixed API mismatches
10. ✅ **Experience Sharing** - Working shareable links and QR codes

## Prerequisites

- Node.js 18+
- PostgreSQL database
- npm or yarn package manager

## Setup Instructions

### 1. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env file with your database URL and other settings
# DATABASE_URL=postgresql://username:password@localhost:5432/ar_configurator

# Set up database (create database first in PostgreSQL)
psql -d ar_configurator -f database-setup.sql

# Or use Drizzle migrations
npm run db:push

# Start the backend server
npm run dev
```

The backend will run on `http://localhost:5000`

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the frontend development server
npm run dev
```

The frontend will run on `http://localhost:3000`

## Usage Guide

### 1. User Registration & Login

1. Navigate to `http://localhost:3000/register`
2. Create a new account with email, password, and name
3. Login with your credentials
4. You'll be redirected to the home page

### 2. Creating AR Experiences

1. **Upload Image for AR Tracking**:

   - Click the "Upload Image for AR Tracking" button on the home page
   - Select an image (PNG, JPG) that will serve as the AR marker
   - The system will convert it to a .mind file for AR tracking

2. **Add Content to Experience**:

   - Upload 3D models (.glb, .gltf, .obj, .fbx)
   - Upload images (.png, .jpg, .webp)
   - Upload videos (.mp4, .webm)
   - Upload audio files (.mp3, .wav, .ogg)
   - Position, rotate, and scale each content item in 3D space

3. **Configure Experience**:

   - Set title and description
   - Adjust content positioning using the 3D controls
   - Preview the AR experience

4. **Create Experience**:
   - Click "Create Experience" to generate the AR experience
   - The system will create an HTML file with all the AR functionality

### 3. Viewing AR Experiences

1. **Desktop Testing**:

   - Open the generated experience URL
   - Allow camera access
   - Point your camera at the marker image
   - AR content will appear overlaid on the marker

2. **Mobile AR**:
   - Share the experience URL or QR code
   - Open on mobile device
   - Allow camera permissions
   - Point camera at the marker image to see AR content

### 4. Multiple Image Tracking

1. Click "Multiple Image Tracking" on the home page
2. Upload multiple marker images
3. Add different content for each marker
4. Create a single experience that responds to multiple different images

### 5. Managing Experiences

1. View all your experiences on the "My Experiences" page
2. Edit existing experiences to modify content or settings
3. Delete experiences you no longer need
4. Share experiences via generated links

### 6. Admin Features (Admin Role Required)

1. Access admin dashboard at `/admin`
2. Manage all users and their status
3. View and manage all experiences in the system
4. Manage content libraries (models, images, videos, audio)

## API Endpoints

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/verify` - Verify authentication token
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Experiences

- `POST /api/experiences` - Create new experience
- `GET /api/experiences` - Get user's experiences
- `GET /api/experiences/:id` - Get specific experience
- `PUT /api/experiences/:id` - Update experience
- `DELETE /api/experiences/:id` - Delete experience
- `POST /api/experiences/:id/mind` - Upload mind file
- `GET /api/experiences/:id/mind` - Get mind file
- `POST /api/experiences/multiple-image` - Create multiple image experience

### Content Libraries

- `GET /api/experiences/library/models` - Get models library
- `POST /api/experiences/library/models` - Upload model
- `GET /api/experiences/library/images` - Get images library
- `POST /api/experiences/library/images` - Upload image
- `GET /api/experiences/library/videos` - Get videos library
- `POST /api/experiences/library/videos` - Upload video
- `GET /api/experiences/library/audios` - Get audio library
- `POST /api/experiences/library/audios` - Upload audio

### Experience Serving

- `GET /experiences/:filename` - Serve AR experience HTML
- `GET /api/experiences/markers/:id.png` - Serve marker images
- `GET /api/experiences/markers/:id.mind` - Serve mind files

## File Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Express middleware
│   ├── models/         # Database schema
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   └── utils/          # Utility functions
├── experiences/        # Generated AR experience HTML files
├── uploads/           # Uploaded files storage
└── database-setup.sql # Database schema

frontend/
├── src/
│   ├── components/    # React components
│   ├── pages/        # Page components
│   ├── utils/        # Utility functions
│   ├── lib/          # Library configurations
│   └── contexts/     # React contexts
└── public/           # Static files
```

## Technology Stack

### Backend

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL** - Database
- **Drizzle ORM** - Database ORM
- **JWT** - Authentication tokens
- **Multer** - File upload handling
- **bcrypt** - Password hashing

### Frontend

- **React 18** - UI library
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Tailwind CSS** - Styling
- **Radix UI** - UI components
- **React Query** - Data fetching
- **React Hook Form** - Form handling

### AR Technology

- **A-Frame** - WebXR framework
- **MindAR** - Image tracking library
- **WebRTC** - Camera access
- **WebGL** - 3D rendering

## Troubleshooting

### Backend Issues

1. **Database Connection**: Ensure PostgreSQL is running and DATABASE_URL is correct
2. **File Uploads**: Check that uploads/ directory exists and has write permissions
3. **CORS Errors**: Verify CORS_ORIGIN matches frontend URL
4. **Port Conflicts**: Change PORT in .env if 5000 is busy

### Frontend Issues

1. **API Calls Failing**: Check that backend is running on port 5000
2. **Authentication Issues**: Clear cookies and localStorage, then re-login
3. **File Upload Errors**: Check file size limits and formats
4. **AR Not Working**: Ensure HTTPS in production, camera permissions granted

### AR Experience Issues

1. **Marker Not Detected**: Use high-contrast images with good features
2. **Content Not Appearing**: Check content positioning and scale values
3. **Mobile Issues**: Ensure experience is served over HTTPS for camera access
4. **Performance Problems**: Optimize 3D models and reduce file sizes

## Production Deployment

1. Set NODE_ENV=production
2. Configure proper database URL
3. Set secure JWT secrets
4. Enable HTTPS for camera access
5. Configure proper CORS origins
6. Set up file storage (AWS S3, etc.)
7. Configure reverse proxy (nginx)

## Default Admin Account

- **Email**: admin@example.com
- **Password**: admin123

Change this immediately after first login!

## Support

The application is now fully functional and matches the previous working version. All features for AR experience creation, content management, user authentication, and experience sharing are working correctly.

For any issues, check the console logs in both frontend and backend for detailed error messages.
