import express from 'express';
import { MongoClient } from 'mongodb';
import cors from 'cors';
import admin from 'firebase-admin'
import fs from 'fs'
import { fileURLToPath } from 'url';
import path from 'path';
import { UsersAPI } from './users.js';
import { upload, handleImageUpload, handleMultipleImagesUpload, handleImageDelete, handleImagesList } from './upload.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MONGO_URL = !process.env.MONGODB_USERNAME ? 'mongodb://localhost:27017' : `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@cluster0.tnwx56b.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const DB_NAME = 'fullstack-app';
let db;
let usersAPI;

const app = express();
const PORT = process.env.PORT || 8888;

let credentials;
if (process.env.FIREBASE_CREDENTIALS) {
    // Use environment variable in production
    credentials = JSON.parse(process.env.FIREBASE_CREDENTIALS);
} else {
    // Use local file in development
    credentials = JSON.parse(fs.readFileSync('./credentials.json'));
}
admin.initializeApp({
  credential: admin.credential.cert(credentials),
  storageBucket: credentials.project_id + '.appspot.com' // Add storage bucket
});


app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001', 'https://myportfolio-q88t.vercel.app', 'https://myportfolio-pied-eta-vykkrihxyw.vercel.app','https://portfolio-admin-panel-brown.vercel.app'], // Multiple frontend URLs
    credentials: true, // Allow cookies/credentials
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'authtoken'],
    optionsSuccessStatus: 200 // For legacy browser support
}));

app.use(express.json());

async function connectToMongo() {
    try {
        const client = new MongoClient(MONGO_URL);
        await client.connect();
        db = client.db(DB_NAME);
        usersAPI = new UsersAPI(db);
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        throw error;
    }
}

app.use(express.static(path.join(__dirname, 'dist')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get(/^(?!\/api).+/, (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.get('/api/users', async (req, res) => {
    try {
        const users = await usersAPI.getAllUsers();
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/users/:uid', async (req, res) => {

    try {
        const user = await usersAPI.getUserByUid(req.params.uid);
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// Public image listing endpoint (no auth required)
app.get('/api/images', (req, res, next) => {
    req.portfolioAPI = portfolioAPI;
    next();
}, handleImagesList);

// Protected portfolio routes
app.use(async function(req, res, next) {
    const {authtoken} = req.headers;
    if (authtoken) {
        const user = await admin.auth().verifyIdToken(authtoken);
        req.user = user;
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
}) 

// Image upload routes (protected by authentication middleware above)
app.post('/api/upload-image', (req, res, next) => {
    req.portfolioAPI = portfolioAPI;
    next();
}, upload.single('image'), handleImageUpload);

app.post('/api/upload-images', (req, res, next) => {
    req.portfolioAPI = portfolioAPI;
    next();
}, upload.array('images', 10), handleMultipleImagesUpload);

app.delete('/api/delete-image', handleImageDelete);


async function startServer() {
    await connectToMongo();
    await usersAPI.initializeUsers();

    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}

startServer().catch(console.error);