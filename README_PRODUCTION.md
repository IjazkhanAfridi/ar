# 🎯 AR Configurator - Production Ready

A complete AR (Augmented Reality) experience configurator built with React, Node.js, and MySQL. Create, customize, and share interactive AR experiences with 3D models, images, videos, and audio.

## 🚀 Features

- **AR Experience Creation**: Build interactive AR experiences with 3D models
- **Multi-Media Support**: Images, videos, audio, and 3D models
- **Mind AR Integration**: Advanced marker-based AR tracking
- **User Management**: Registration, authentication, and experience sharing
- **Library Management**: Organize and reuse media assets
- **Production Ready**: Optimized for deployment on Vercel with MySQL

## 🏗️ Tech Stack

### Frontend
- **React 18** with **Vite**
- **Three.js** for 3D rendering
- **MindAR** for AR tracking
- **Tailwind CSS** for styling
- **Lucide Icons** for UI icons

### Backend
- **Node.js** with **Express.js**
- **MySQL** database with **Drizzle ORM**
- **JWT** authentication
- **Multer** for file uploads
- **bcrypt** for password hashing

## 🚀 Quick Start

### Development
```bash
# Install dependencies
npm run install:all

# Start development servers
npm run dev
```

### Production Deployment
See [VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md) for complete deployment instructions.

## 📁 Project Structure

```
ar-configurator/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── utils/          # Utility functions
│   └── public/             # Static assets
├── backend/                 # Node.js backend API
│   ├── src/
│   │   ├── controllers/    # Route controllers
│   │   ├── models/         # Database models
│   │   ├── services/       # Business logic
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Custom middleware
│   │   └── utils/          # Utility functions
│   └── uploads/            # User uploaded files
└── vercel.json             # Vercel deployment config
```

## 🔧 Environment Variables

### Required for Production
```bash
DATABASE_URL=mysql://user:password@host:port/database
NODE_ENV=production
JWT_SECRET=your_secure_jwt_secret
CORS_ORIGIN=https://your-domain.com
```

See `.env.production` for complete configuration.

## 🎯 Key Features

### AR Experience Builder
- Drag-and-drop 3D model placement
- Real-time AR preview
- Marker-based tracking
- Multi-object scenes

### Media Library
- 3D models (.glb, .gltf)
- Images (jpg, png, gif)
- Videos (mp4, webm)
- Audio files (mp3, wav)

### User Management
- Secure registration/login
- JWT-based authentication
- Experience sharing
- Privacy controls

## 📱 Browser Support

- **Chrome**: Full support
- **Safari**: iOS 11.3+ (WebXR)
- **Firefox**: Limited AR support
- **Edge**: Full support

## 🔒 Security Features

- Password hashing with bcrypt
- JWT token authentication
- CORS protection
- Input validation
- File upload restrictions

## 📊 Database Schema

- **Users**: Authentication and profiles
- **Experiences**: AR experience configurations
- **Content Files**: Media asset metadata
- **Library Tables**: Organized media libraries

## 🚀 Deployment

This application is optimized for **Vercel** deployment with:
- Serverless functions for API
- Static site generation for frontend
- MySQL database integration
- Environment-based configuration

## 📄 License

This project is proprietary software developed for AR experience creation.

## 🤝 Contributing

This is a production application. For feature requests or bug reports, please contact the development team.

---

**Built with ❤️ for creating amazing AR experiences**