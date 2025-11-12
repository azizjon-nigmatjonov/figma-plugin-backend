import multer from 'multer';
import admin from 'firebase-admin';
import { uploadImageToImageBB } from './imagebb.js';

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter to accept only images
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'), false);
    }
};

// Multer configuration
export const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    }
});

// Get Firebase Storage bucket
const getBucket = () => {
    return admin.storage().bucket(); // Uses bucket from Firebase app initialization
};

// Image upload function moved to imagebb.js

/**
 * Delete image from Firebase Storage
 * @param {String} imageUrl - The public URL of the image
 * @returns {Promise<Boolean>}
 */
export const deleteImageFromFirebase = async (imageUrl) => {
    try {
        const bucket = getBucket();
        
        // Extract filename from URL
        const urlParts = imageUrl.split('/');
        const fileName = decodeURIComponent(urlParts.slice(4).join('/'));
        
        // Delete the file
        await bucket.file(fileName).delete();
        
        return true;
    } catch (error) {
        console.error('Error deleting image from Firebase:', error);
        throw new Error('Failed to delete image');
    }
};

/**
 * Express route handler for single image upload
 * Now also saves metadata to MongoDB for tracking
 */
export const handleImageUpload = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        const folder = req.body.folder || 'images';
        
        const imageUrl = await uploadImageToImageBB(
            req.file.buffer,
            req.file.originalname,
            req.file.mimetype,
            folder
        );
        
        // Save image metadata to MongoDB if portfolioAPI is available
        if (req.portfolioAPI) {
            try {
                await req.portfolioAPI.saveImageMetadata(imageUrl, req.file.originalname, folder);
            } catch (dbError) {
                console.error('Failed to save image metadata to DB:', dbError);
                // Continue even if DB save fails
            }
        }
        
        res.json({
            success: true,
            imageUrl: imageUrl,
            message: 'Image uploaded successfully'
        });
        
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ 
            error: error.message || 'Failed to upload image' 
        });
    }
};

/**
 * Express route handler for multiple images upload
 */
export const handleMultipleImagesUpload = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }
        
        const folder = 'images';
        
        // Upload all images in parallel
        const uploadPromises = req.files.map(file => 
            uploadImageToImageBB(
                file.buffer,
                file.originalname,
                file.mimetype,
                folder
            )
        );
        
        const imageUrls = await Promise.all(uploadPromises);
        
        res.json({
            success: true,
            imageUrls: imageUrls,
            count: imageUrls.length,
            message: 'Images uploaded successfully'
        });
        
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ 
            error: error.message || 'Failed to upload images' 
        });
    }
};

/**
 * Express route handler for deleting an image
 */
export const handleImageDelete = async (req, res) => {
    try {
        const { imageUrl } = req.body;
        
        if (!imageUrl) {
            return res.status(400).json({ error: 'Image URL is required' });
        }
        
        await deleteImageFromFirebase(imageUrl);
        
        res.json({
            success: true,
            message: 'Image deleted successfully'
        });
        
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ 
            error: error.message || 'Failed to delete image' 
        });
    }
};

/**
 * List all images from a specific folder in Firebase Storage
 * @param {String} folder - Folder path (e.g., 'images', 'portfolios')
 * @param {Number} maxResults - Maximum number of results (default: 100)
 * @returns {Promise<Array>} - Array of image objects with name, url, and metadata
 */
export const listImagesFromFirebase = async (folder = 'images', maxResults = 100) => {
    try {
        const bucket = getBucket();
        
        // Get all files from the specified folder
        const [files] = await bucket.getFiles({
            prefix: folder + '/',
            maxResults: maxResults,
        });
        
        // Map files to useful information
        const imageList = files.map(file => {
            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${file.name}`;
            return {
                name: file.name,
                url: publicUrl,
                size: file.metadata.size,
                contentType: file.metadata.contentType,
                created: file.metadata.timeCreated,
                updated: file.metadata.updated,
            };
        });
        
        return imageList;
        
    } catch (error) {
        console.error('Error listing images from Firebase:', error);
        throw new Error('Failed to list images');
    }
};

/**
 * Express route handler for listing images
 * Now fetches from MongoDB instead of Firebase Storage
 */
export const handleImagesList = async (req, res) => {
    try {
        const folder = req.query.folder || null;
        
        // Get images from MongoDB if portfolioAPI is available
        if (req.portfolioAPI) {
            const images = await req.portfolioAPI.getAllImages(folder);
            
            res.json({
                success: true,
                folder: folder || 'all',
                count: images.length,
                images: images
            });
        } else {
            // Fallback response if portfolioAPI is not available
            res.json({
                success: true,
                message: 'Image listing requires MongoDB connection',
                images: [],
                count: 0
            });
        }
        
    } catch (error) {
        console.error('List error:', error);
        res.status(500).json({ 
            error: error.message || 'Failed to list images' 
        });
    }
};

