/**
 * ImageBB Integration - Free Image Hosting Service
 * No registration required for basic usage
 */

/**
 * Upload image to ImageBB (Free image hosting)
 * @param {Buffer} fileBuffer - The file buffer from multer
 * @param {String} originalName - Original filename
 * @param {String} mimetype - File mimetype
 * @returns {Promise<String>} - Public URL of uploaded image
 */
export const uploadImageToImageBB = async (fileBuffer, originalName, mimetype) => {
    try {
        // For now, let's use a working free service
        // You can get a free API key from https://imgbb.com/
        
        console.log('Uploading image:', originalName);
        
        // Convert buffer to base64
        const base64Image = fileBuffer.toString('base64');
        
        // Create form data
        const formData = new URLSearchParams();
        formData.append('image', base64Image);
        formData.append('name', `${Date.now()}-${originalName.replace(/\s+/g, '-')}`);
        
        // Try ImageBB with a demo key (you should get your own free key)
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${process.env.IMAGEBB_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString()
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error?.message || 'ImageBB upload failed');
        }
        
        const imageUrl = data.data.url;
        console.log('ImageBB upload successful. URL:', imageUrl);
        return imageUrl;
        
    } catch (error) {
        console.error('Error uploading image to ImageBB:', error);
        console.error('Error details:', error.message);
        
        // Fallback: Return a placeholder image URL
        const fallbackUrl = '';
        console.log('Using fallback URL:', fallbackUrl);
        return fallbackUrl;
    }
};

/**
 * Alternative: Upload to Imgur (requires API key but more reliable)
 * @param {Buffer} fileBuffer - The file buffer from multer
 * @param {String} originalName - Original filename
 * @returns {Promise<String>} - Public URL of uploaded image
 */
export const uploadImageToImgur = async (fileBuffer, originalName) => {
    try {
        // Convert buffer to base64
        const base64Image = fileBuffer.toString('base64');
        
        console.log('Uploading to Imgur:', originalName);
        
        // Imgur API (requires client ID)
        const response = await fetch('https://api.imgur.com/3/image', {
            method: 'POST',
            headers: {
                'Authorization': 'Client-ID YOUR_CLIENT_ID', // You need to get this from Imgur
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                image: base64Image,
                title: originalName,
                description: `Uploaded image: ${originalName}`
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.data?.error || 'Imgur upload failed');
        }
        
        const imageUrl = data.data.link;
        console.log('Imgur upload successful. URL:', imageUrl);
        return imageUrl;
        
    } catch (error) {
        console.error('Error uploading image to Imgur:', error);
        throw new Error(`Failed to upload image: ${error.message}`);
    }
};

/**
 * Simple local file storage (for development)
 * @param {Buffer} fileBuffer - The file buffer from multer
 * @param {String} originalName - Original filename
 * @param {String} folder - Folder name
 * @returns {Promise<String>} - Local URL of uploaded image
 */
export const uploadImageLocally = async (fileBuffer, originalName, folder = 'images') => {
    try {
        const fs = await import('fs');
        const path = await import('path');
        
        // Create uploads directory if it doesn't exist
        const uploadsDir = path.join(process.cwd(), 'uploads', folder);
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        
        // Generate unique filename
        const timestamp = Date.now();
        const fileName = `${timestamp}-${originalName.replace(/\s+/g, '-')}`;
        const filePath = path.join(uploadsDir, fileName);
        
        // Write file
        fs.writeFileSync(filePath, fileBuffer);
        
        // Return local URL
        const imageUrl = `http://localhost:8888/uploads/${folder}/${fileName}`;
        console.log('Local upload successful. URL:', imageUrl);
        return imageUrl;
        
    } catch (error) {
        console.error('Error uploading image locally:', error);
        throw new Error(`Failed to upload image: ${error.message}`);
    }
};
