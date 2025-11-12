import express from 'express';
import { MongoClient } from 'mongodb';
import cors from 'cors';
import admin from 'firebase-admin'
import fs from 'fs'
import { fileURLToPath } from 'url';
import path from 'path';
import { UsersAPI } from './users.js';
import { CardsAPI } from './cards.js';
import { CategoriesAPI } from './categories.js';
import { upload, handleImageUpload, handleMultipleImagesUpload, handleImageDelete, handleImagesList } from './upload.js';
import { MeAPI } from './me.js';
import { PortfolioAPI } from './portfolio.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MONGO_URL = !process.env.MONGODB_USERNAME ? 'mongodb://localhost:27017' : `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@cluster0.tnwx56b.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const DB_NAME = 'fullstack-app';
let db;
let usersAPI;
let cardsAPI;
let categoriesAPI;
let meAPI;
let portfolioAPI;
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


// CORS configuration - allow Figma plugin and other origins
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = [
            'http://localhost:3000', 
            'http://localhost:3001', 
            'http://127.0.0.1:3000', 
            'http://127.0.0.1:3001',
            'https://www.figma.com',
            'https://figma.com',
            'https://myportfolio-q88t.vercel.app', 
            'https://myportfolio-pied-eta-vykkrihxyw.vercel.app',
            'https://portfolio-admin-panel-brown.vercel.app'
        ];
        
        // Allow requests with no origin (like Figma plugins, mobile apps, curl, Postman)
        if (!origin) return callback(null, true);
        
        // Check if origin is in allowed list or starts with figma
        if (allowedOrigins.indexOf(origin) !== -1 || origin.includes('figma.com')) {
            callback(null, true);
        } else {
            // For development on localhost, allow all localhost origins
            if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
                callback(null, true);
            } else {
                console.log('CORS blocked origin:', origin);
                callback(new Error('Not allowed by CORS'));
            }
        }
    },
    credentials: true, // Allow cookies/credentials
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'authtoken'],
    optionsSuccessStatus: 200 // For legacy browser support
};

app.use(cors(corsOptions));

app.use(express.json());

async function connectToMongo() {
    try {
        const client = new MongoClient(MONGO_URL);
        await client.connect();
        db = client.db(DB_NAME);
        usersAPI = new UsersAPI(db);
        cardsAPI = new CardsAPI(db);
        categoriesAPI = new CategoriesAPI(db);
        meAPI = new MeAPI(db);
        portfolioAPI = new PortfolioAPI(db);
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

app.get('/api/me', async (req, res) => {
    try {
        const user = await meAPI.getMe();
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/cards', async (req, res) => {
    try {
        const cards = await cardsAPI.getAllCards();
        res.json(cards);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/me', async (req, res) => {
    try {
        const updatedUser = await meAPI.updateMe(req.body);
        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
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

// Cards API routes
app.get('/api/cards/:id', async (req, res) => {
    try {
        const card = await cardsAPI.getCardById(req.params.id);
        if (!card) {
            res.status(404).json({ error: 'Card not found' });
        } else {
            res.json(card);
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/cards', async (req, res) => {
    try {
        const result = await cardsAPI.createCard(req.body);
        res.status(201).json({ 
            message: 'Card created successfully',
            insertedId: result.insertedId 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/cards/:id', async (req, res) => {
    try {
        const result = await cardsAPI.updateCard(req.params.id, req.body);
        if (result.matchedCount === 0) {
            res.status(404).json({ error: 'Card not found' });
        } else {
            res.json({ 
                message: 'Card updated successfully',
                modifiedCount: result.modifiedCount 
            });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/cards/:id', async (req, res) => {
    try {
        const result = await cardsAPI.deleteCard(req.params.id);
        if (result.deletedCount === 0) {
            res.status(404).json({ error: 'Card not found' });
        } else {
            res.json({ 
                message: 'Card deleted successfully',
                deletedCount: result.deletedCount 
            });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Categories API routes
app.get('/api/categories', async (req, res) => {
    try {
        const categories = await categoriesAPI.getAllCategories();
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/categories', async (req, res) => {
    try {
        const result = await categoriesAPI.createCategory(req.body);
        res.status(201).json({ 
            message: 'Category created successfully',
            insertedId: result.insertedId 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/categories/:id', async (req, res) => {
    try {
        const result = await categoriesAPI.updateCategory(req.params.id, req.body);
        if (result.matchedCount === 0) {
            res.status(404).json({ error: 'Category not found' });
        } else {
            res.json({ 
                message: 'Category updated successfully',
                modifiedCount: result.modifiedCount 
            });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/categories/:id', async (req, res) => {
    try {
        const result = await categoriesAPI.deleteCategory(req.params.id);
        if (result.deletedCount === 0) {
            res.status(404).json({ error: 'Category not found' });
        } else {
            res.json({ 
                message: 'Category deleted successfully',
                deletedCount: result.deletedCount 
            });
        }
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
    await cardsAPI.initializeCards();
    await categoriesAPI.initializeCategories();
    await portfolioAPI.initializePortfolios();

    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}

startServer().catch(console.error);