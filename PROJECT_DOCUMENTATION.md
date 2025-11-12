# Portfolio Backend API - Project Documentation

## 📋 Table of Contents
- [Project Overview](#project-overview)
- [Technology Stack](#technology-stack)
- [Project Architecture](#project-architecture)
- [Database Structure](#database-structure)
- [API Endpoints](#api-endpoints)
- [Authentication & Security](#authentication--security)
- [Image Upload System](#image-upload-system)
- [Setup & Installation](#setup--installation)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Development Scripts](#development-scripts)

---

## 🎯 Project Overview

This is a **full-stack portfolio backend application** built with Node.js and Express. It provides a RESTful API for managing:
- User profiles and authentication
- Portfolio projects with CRUD operations
- Image uploads and management
- Article system with comments and upvotes
- Admin panel integration

The application serves both as a backend API and a static file server for the frontend build.

---

## 🛠 Technology Stack

### Core Technologies
- **Node.js** - Runtime environment
- **Express.js** (v5.1.0) - Web application framework
- **MongoDB** (v6.20.0) - NoSQL database for data storage
- **Firebase Admin SDK** (v13.5.0) - Authentication and cloud storage

### Key Dependencies
- **CORS** (v2.8.5) - Cross-Origin Resource Sharing
- **Multer** (v2.0.2) - Multipart/form-data handling for file uploads
- **Nodemon** (v3.1.10) - Development auto-restart

### Database Options
- **Local MongoDB** - For development (via Homebrew)
- **MongoDB Atlas** - For production (cloud-hosted)

---

## 🏗 Project Architecture

### File Structure
```
back-end/
├── src/
│   ├── server.js          # Main server file & routing
│   ├── owner.js           # Article management API
│   ├── users.js           # User management API
│   ├── me.js              # Profile management API
│   ├── portfolio.js       # Portfolio CRUD API
│   ├── upload.js          # Image upload handlers
│   ├── imagebb.js         # ImageBB integration
│   └── dist/              # Frontend build files
├── credentials.json       # Firebase credentials (gitignored)
├── package.json           # Project dependencies
├── app.yaml               # Google Cloud deployment config
└── prod-env.yaml          # Production environment variables
```

### API Layer Architecture

The application follows a **modular class-based architecture** with separate API classes:

1. **OwnerAPI** - Manages articles (blog posts)
2. **UsersAPI** - Handles user operations
3. **MeAPI** - Manages the main profile/owner data
4. **PortfolioAPI** - CRUD operations for portfolio items

Each API class:
- Receives the database connection in its constructor
- Implements initialization methods to seed default data
- Provides domain-specific CRUD operations
- Handles error logging and exception handling

---

## 💾 Database Structure

### MongoDB Collections

#### 1. **articles** Collection
Stores blog articles with engagement metrics.
```javascript
{
  articleName: String,      // Unique identifier
  upvotes: Number,          // Total upvotes count
  upvodIds: [String],       // Array of user IDs who upvoted
  comments: [Object]        // Array of comment objects
}
```

#### 2. **users** Collection
Stores registered user information.
```javascript
{
  uid: String,              // Firebase user ID
  // Additional user fields as needed
}
```

#### 3. **me** Collection
Single document storing the portfolio owner's profile.
```javascript
{
  name: String,             // Full name
  email: String,            // Contact email
  uid: String,              // User ID
  role: String,             // User role (e.g., 'admin')
  status: String,           // Account status
  profilePicture: String,   // URL to profile image
  bio: String,              // Biography
  phone: String,            // Contact number
  createdAt: Date,          // Account creation date
  updatedAt: Date           // Last update timestamp
}
```

#### 4. **portfolios** Collection
Stores portfolio projects.
```javascript
{
  _id: ObjectId,            // MongoDB ID
  title: String,            // Project title
  slug: String,             // URL-friendly identifier
  description: String,      // Project description
  images: [String],         // Array of image URLs
  technologies: [String],   // Tech stack used
  // Additional project fields
}
```

#### 5. **images** Collection
Tracks uploaded images for management.
```javascript
{
  url: String,              // Public image URL
  originalName: String,     // Original filename
  folder: String,           // Storage folder/category
  uploadedAt: Date          // Upload timestamp
}
```

---

## 🔌 API Endpoints

### Public Endpoints (No Authentication Required)

#### User & Profile
```
GET  /api/me               # Get owner profile
GET  /api/users            # Get all users
GET  /api/users/:uid       # Get specific user by UID
GET  /api/images           # List all uploaded images
                           # Query params: ?folder=images
```

#### Portfolio
```
GET  /api/portfolios       # Get all portfolio items (sorted by newest)
GET  /api/portfolios/:id   # Get specific portfolio by ID/slug
```

### Protected Endpoints (Authentication Required)

All endpoints below require the `authtoken` header with a valid Firebase JWT token.

#### Profile Management
```
PUT  /api/me               # Update owner profile
                           # Body: { name, email, bio, phone, ... }
```

#### Portfolio Management
```
POST   /api/portfolios     # Create new portfolio item
                           # Body: { title, description, images, ... }

PUT    /api/portfolios/:id # Update portfolio item
                           # Body: { title, description, ... }

DELETE /api/portfolios/:id # Delete portfolio item
```

#### Image Upload
```
POST   /api/upload-image   # Upload single image
                           # Form-data: image (file), folder (string)

POST   /api/upload-images  # Upload multiple images (max 10)
                           # Form-data: images[] (files)

DELETE /api/delete-image   # Delete an image
                           # Body: { imageUrl }
```

### Static File Serving
```
GET  /*                    # Serves frontend build (React/Vite app)
GET  /uploads/*            # Serves uploaded files
```

---

## 🔐 Authentication & Security

### Firebase Authentication
- Uses **Firebase Admin SDK** for token verification
- JWT tokens are validated on protected routes
- Tokens passed via `authtoken` header

### Authentication Middleware
Protected routes use middleware that:
1. Extracts `authtoken` from request headers
2. Verifies token using Firebase Admin
3. Attaches user info to `req.user`
4. Returns 401 if unauthorized

```javascript
// Example middleware flow
if (authtoken) {
    const user = await admin.auth().verifyIdToken(authtoken);
    req.user = user;
    next();
} else {
    res.status(401).json({ error: 'Unauthorized' });
}
```

### CORS Configuration
Configured to accept requests from:
- Local development: `localhost:3000`, `localhost:3001`
- Production frontend: Vercel deployments
- Credentials support enabled for cookies/auth headers

---

## 📸 Image Upload System

### Current Implementation: ImageBB

The application uses **ImageBB** as the primary image hosting service.

#### Features
- **File Type Validation**: Only JPEG, PNG, GIF, WebP allowed
- **Size Limit**: 5MB per image
- **Memory Storage**: Uses `multer.memoryStorage()` for efficient handling
- **Metadata Tracking**: Saves image info to MongoDB
- **Folder Organization**: Images categorized by folder parameter

#### Upload Flow
1. Client sends image via multipart/form-data
2. Multer validates and buffers the file
3. Image uploaded to ImageBB via API
4. Public URL returned and saved to MongoDB
5. URL sent back to client

#### File: `imagebb.js`
Contains the ImageBB API integration for uploading images to their cloud service.

### Alternative: Firebase Storage

The codebase includes Firebase Storage functions but currently uses ImageBB:
- `deleteImageFromFirebase()` - Delete from Firebase Storage
- `listImagesFromFirebase()` - List Firebase Storage images
- Can be switched back if needed

---

## ⚙️ Setup & Installation

### Prerequisites
- **Node.js** (v18+ recommended)
- **MongoDB** (local or Atlas account)
- **Firebase Project** with Admin SDK credentials
- **ImageBB API Key** (if using image uploads)

### Local Development Setup

#### 1. Clone and Install
```bash
cd back-end
npm install
```

#### 2. MongoDB Setup (macOS)
```bash
# Install MongoDB via Homebrew
brew install mongodb-community

# Start MongoDB service
npm run start:mongodb

# Check status
npm run check:mongodb

# Stop when done
npm run stop:mongodb
```

#### 3. Firebase Credentials
Create a `credentials.json` file in the project root:
```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "...",
  "private_key": "...",
  "client_email": "...",
  "client_id": "...",
  "auth_uri": "...",
  "token_uri": "...",
  "auth_provider_x509_cert_url": "...",
  "client_x509_cert_url": "..."
}
```

**⚠️ Important**: Add `credentials.json` to `.gitignore`!

#### 4. Start Development Server
```bash
npm run dev
```

Server runs on `http://localhost:8888`

---

## 🌍 Environment Variables

### Development
No environment variables required for local MongoDB.

### Production (MongoDB Atlas)
Set these environment variables:
```bash
MONGODB_USERNAME=your_atlas_username
MONGODB_PASSWORD=your_atlas_password
FIREBASE_CREDENTIALS='{...}'  # JSON string of credentials
PORT=8888                      # Optional, defaults to 8888
```

### MongoDB Connection Logic
```javascript
const MONGO_URL = !process.env.MONGODB_USERNAME 
  ? 'mongodb://localhost:27017'  // Local development
  : `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@cluster0.tnwx56b.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
```

---

## 🚀 Deployment

### Google Cloud Platform (App Engine)

The project includes `app.yaml` configuration for Google Cloud deployment:

```yaml
runtime: nodejs24
includes: 
  - prod-env.yaml
```

#### Deployment Steps
1. Ensure `prod-env.yaml` contains production environment variables
2. Install Google Cloud CLI
3. Deploy:
```bash
gcloud app deploy
```

### Alternative Deployment Platforms

#### Heroku
```bash
heroku create your-app-name
git push heroku main
heroku config:set MONGODB_USERNAME=...
heroku config:set MONGODB_PASSWORD=...
heroku config:set FIREBASE_CREDENTIALS='...'
```

#### Vercel/Netlify
- Not ideal due to serverless nature
- Better suited for traditional Node.js hosting (GCP, AWS, DigitalOcean)

---

## 📜 Development Scripts

```bash
# Start production server
npm start

# Start development server with auto-reload
npm run dev

# MongoDB management (macOS/Homebrew)
npm run start:mongodb    # Start MongoDB service
npm run stop:mongodb     # Stop MongoDB service
npm run check:mongodb    # Check MongoDB status

# Testing
npm test                 # Currently not implemented
```

---

## 🏃 Getting Started Workflow

### First Time Setup
1. Clone the repository
2. Run `npm install`
3. Start MongoDB: `npm run start:mongodb`
4. Add `credentials.json` from Firebase Console
5. Start dev server: `npm run dev`
6. Access API at `http://localhost:8888/api/`

### Daily Development
1. Ensure MongoDB is running
2. Run `npm run dev`
3. Make changes (server auto-restarts via nodemon)
4. Test endpoints using Postman/Thunder Client/curl

### Before Deployment
1. Test all endpoints in production-like environment
2. Ensure `prod-env.yaml` has correct credentials
3. Update CORS origins if frontend URL changes
4. Verify MongoDB Atlas connection
5. Deploy using `gcloud app deploy`

---

## 📝 Additional Notes

### Frontend Integration
- Frontend build placed in `src/dist/`
- Server serves frontend on all non-API routes
- Ensures SPA routing works correctly

### Error Handling
- All API methods include try-catch blocks
- Errors logged to console
- User-friendly error messages returned in responses

### Data Initialization
On server start, the following collections are initialized with default data if empty:
- `articles` - 3 default articles
- `users` - Empty array placeholder
- `me` - Default owner profile
- `portfolios` - Empty (no defaults)

### Image Management
- Images stored on ImageBB cloud service
- Metadata tracked in MongoDB for easier management
- Supports folder-based organization
- Public URLs returned for easy frontend integration

---

## 🤝 Contributing

This is a portfolio project. For major changes, please document your modifications in this file.

---

## 📄 License

ISC License

---

## 👤 Author

**Azizjon Nigmatjonov**
- Email: azizjonnigmatjonov@gmail.com
- Phone: +998994912830

---

**Last Updated**: November 6, 2025

