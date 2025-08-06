# AR Configurator Backend

A modern, well-structured Node.js/Express backend for AR experience configuration and management.

## 🚀 Features

- **Authentication & Authorization**: JWT-based auth with role-based access control
- **AR Experience Management**: Create, update, delete AR experiences with 3D content
- **File Upload & Processing**: Image, video, audio, and 3D model handling
- **Admin Dashboard**: User and experience management
- **Rate Limiting**: Protection against abuse
- **Input Validation**: Zod-based request validation
- **Error Handling**: Comprehensive error management
- **Logging**: Structured logging with different levels
- **Security**: Helmet, CORS, and other security middlewares

## 🏗️ Project Structure

```
src/
├── config/          # Configuration files
│   ├── config.js    # Environment variables and app config
│   └── database.js  # Database connection and setup
├── controllers/     # Route controllers
│   ├── authController.js
│   ├── experienceController.js
│   └── adminController.js
├── middleware/      # Custom middleware
│   ├── auth.js      # Authentication middleware
│   ├── errorHandler.js
│   ├── rateLimiter.js
│   └── upload.js    # File upload middleware
├── models/          # Database schemas
│   └── schema.js    # Drizzle ORM schemas
├── routes/          # Route definitions
│   ├── authRoutes.js
│   ├── experienceRoutes.js
│   ├── adminRoutes.js
│   └── index.js
├── services/        # Business logic layer
│   ├── userService.js
│   ├── experienceService.js
│   └── fileService.js
├── utils/           # Utility functions
│   ├── logger.js
│   ├── experienceGenerator.js
│   └── markerCompiler.js
├── validators/      # Input validation schemas
│   └── schemas.js
└── server.js        # Main application entry point
```

## 🛠️ Installation & Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Database Setup**
   ```bash
   # Push database schema
   npm run db:push
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

## 🔧 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `development` |
| `DATABASE_URL` | PostgreSQL connection string | - |
| `JWT_SECRET` | JWT signing secret | - |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:3000` |
| `MAX_FILE_SIZE` | Maximum upload size in bytes | `52428800` (50MB) |

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password

### Experiences
- `GET /api/experiences` - Get user's experiences
- `POST /api/experiences` - Create new experience
- `GET /api/experiences/:id` - Get experience by ID
- `PUT /api/experiences/:id` - Update experience
- `DELETE /api/experiences/:id` - Delete experience
- `GET /api/experiences/public` - Get public experiences
- `GET /api/experiences/share/:link` - Get experience by share link

### Admin (Admin Only)
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id/status` - Update user status
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/experiences` - Get all experiences
- `GET /api/admin/dashboard/stats` - Get dashboard statistics

## 🔒 Security Features

- **Rate Limiting**: Different limits for auth, upload, and general API endpoints
- **Input Validation**: Zod schemas for all inputs
- **Authentication**: JWT tokens with secure cookies
- **Authorization**: Role-based access control
- **File Upload Security**: Type and size validation
- **CORS**: Configurable cross-origin resource sharing
- **Helmet**: Security headers

## 📁 File Upload

The API supports uploading various file types:
- **Images**: JPEG, PNG, WebP, GIF
- **Videos**: MP4, WebM, QuickTime
- **Audio**: MP3, WAV, OGG
- **3D Models**: GLB, GLTF, OBJ, FBX

Files are automatically processed and optimized based on type.

## 🗄️ Database Schema

The application uses PostgreSQL with Drizzle ORM. Main tables:
- `users` - User accounts and profiles
- `experiences` - AR experiences
- `content_files` - Associated media files
- `models_library` - 3D model assets
- `images_library` - Image assets
- `videos_library` - Video assets
- `audio_library` - Audio assets

## 🚀 Deployment

1. **Build the application** (if using TypeScript)
2. **Set production environment variables**
3. **Run database migrations**
4. **Start the server**: `npm start`

## 🧪 Development

- **Dev server**: `npm run dev` (with nodemon)
- **Database push**: `npm run db:push`
- **Database migrate**: `npm run db:migrate`

## 📝 Logging

The application includes structured logging with different levels:
- **Info**: General information
- **Warn**: Warning messages
- **Error**: Error messages with stack traces (in development)
- **Debug**: Debug information (development only)

## 🤝 Contributing

1. Follow the existing code structure
2. Add proper error handling
3. Include input validation
4. Write descriptive commit messages
5. Test your changes thoroughly

## 📄 License

MIT License - see LICENSE file for details.
