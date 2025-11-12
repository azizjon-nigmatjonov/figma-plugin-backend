# Image Upload Setup Guide

## 🚀 Setup Instructions

### 1. Configure Firebase Storage Bucket

You need to update the Firebase Storage bucket URL in `src/upload.js`:

```javascript
const getBucket = () => {
    return admin.storage().bucket('gs://your-project-id.appspot.com');
};
```

**How to find your bucket URL:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Storage** in the left sidebar
4. Click **Get Started** if you haven't enabled Storage
5. Copy your bucket URL (format: `gs://your-project-id.appspot.com`)

**Or** simply replace with:
```javascript
return admin.storage().bucket(); // Uses default bucket
```

### 2. Enable Firebase Storage

If you haven't enabled Firebase Storage yet:
1. Go to Firebase Console → Storage
2. Click "Get Started"
3. Choose your storage location
4. Set up security rules (for now, you can use authenticated access)

### 3. Set Storage Rules (Optional but recommended)

In Firebase Console → Storage → Rules:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true; // Public read
      allow write: if request.auth != null; // Only authenticated users can upload
    }
  }
}
```

---

## 📡 API Endpoints

### Upload Single Image

**Endpoint:** `POST /api/upload-image`

**Headers:**
- `authtoken`: Your Firebase auth token (required)
- `Content-Type`: `multipart/form-data`

**Body (form-data):**
- `image`: The image file
- `folder`: (optional) Folder name in storage (default: 'images')

**Response:**
```json
{
  "success": true,
  "imageUrl": "https://storage.googleapis.com/your-bucket/images/1234567890-filename.jpg",
  "message": "Image uploaded successfully"
}
```

### Upload Multiple Images

**Endpoint:** `POST /api/upload-images`

**Headers:**
- `authtoken`: Your Firebase auth token (required)
- `Content-Type`: `multipart/form-data`

**Body (form-data):**
- `images`: Multiple image files (max 10)
- `folder`: (optional) Folder name in storage (default: 'images')

**Response:**
```json
{
  "success": true,
  "imageUrls": [
    "https://storage.googleapis.com/your-bucket/images/1234567890-file1.jpg",
    "https://storage.googleapis.com/your-bucket/images/1234567891-file2.jpg"
  ],
  "count": 2,
  "message": "Images uploaded successfully"
}
```

---

## 💻 Frontend Usage Examples

### React Example (using Fetch)

```javascript
const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('folder', 'portfolios'); // optional
  
  const authToken = await user.getIdToken(); // Get Firebase auth token
  
  try {
    const response = await fetch('http://localhost:8888/api/upload-image', {
      method: 'POST',
      headers: {
        'authtoken': authToken,
      },
      body: formData,
    });
    
    const data = await response.json();
    console.log('Uploaded image URL:', data.imageUrl);
    return data.imageUrl;
  } catch (error) {
    console.error('Upload failed:', error);
  }
};

// Usage in component
const handleFileChange = async (event) => {
  const file = event.target.files[0];
  if (file) {
    const imageUrl = await uploadImage(file);
    // Use imageUrl in your app
  }
};
```

### React Example (using Axios)

```javascript
import axios from 'axios';

const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('folder', 'portfolios');
  
  const authToken = await user.getIdToken();
  
  try {
    const response = await axios.post(
      'http://localhost:8888/api/upload-image',
      formData,
      {
        headers: {
          'authtoken': authToken,
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    return response.data.imageUrl;
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
};
```

### Upload Multiple Images

```javascript
const uploadMultipleImages = async (files) => {
  const formData = new FormData();
  
  // Append multiple files
  for (let i = 0; i < files.length; i++) {
    formData.append('images', files[i]);
  }
  formData.append('folder', 'portfolios');
  
  const authToken = await user.getIdToken();
  
  try {
    const response = await fetch('http://localhost:8888/api/upload-images', {
      method: 'POST',
      headers: {
        'authtoken': authToken,
      },
      body: formData,
    });
    
    const data = await response.json();
    console.log('Uploaded images:', data.imageUrls);
    return data.imageUrls;
  } catch (error) {
    console.error('Upload failed:', error);
  }
};
```

### Full React Component Example

```jsx
import { useState } from 'react';
import { useAuth } from './AuthContext'; // Your auth context

function ImageUploader() {
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const { user } = useAuth();
  
  const handleUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setUploading(true);
    
    const formData = new FormData();
    formData.append('image', file);
    formData.append('folder', 'portfolios');
    
    try {
      const authToken = await user.getIdToken();
      
      const response = await fetch('http://localhost:8888/api/upload-image', {
        method: 'POST',
        headers: {
          'authtoken': authToken,
        },
        body: formData,
      });
      
      const data = await response.json();
      setImageUrl(data.imageUrl);
      alert('Image uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={handleUpload}
        disabled={uploading}
      />
      {uploading && <p>Uploading...</p>}
      {imageUrl && (
        <div>
          <p>Uploaded image:</p>
          <img src={imageUrl} alt="Uploaded" style={{ maxWidth: '300px' }} />
        </div>
      )}
    </div>
  );
}

export default ImageUploader;
```

---

## 🔒 Security Features

✅ **Authentication Required** - All uploads require a valid Firebase auth token
✅ **File Type Validation** - Only image files (JPEG, PNG, GIF, WebP) are allowed
✅ **File Size Limit** - Maximum 5MB per image
✅ **Public Access** - Uploaded images are publicly accessible via URL
✅ **Unique Filenames** - Automatic timestamp-based naming to prevent conflicts

---

## 🛠️ Customization Options

### Change File Size Limit

In `src/upload.js`:
```javascript
limits: {
    fileSize: 10 * 1024 * 1024, // Change to 10MB
}
```

### Add More File Types

```javascript
const allowedTypes = [
    'image/jpeg', 
    'image/jpg', 
    'image/png', 
    'image/gif', 
    'image/webp',
    'image/svg+xml' // Add SVG support
];
```

### Change Default Folder

In your frontend request:
```javascript
formData.append('folder', 'my-custom-folder');
```

### Make Images Private (not public)

In `src/upload.js`, change:
```javascript
await file.save(fileBuffer, {
    metadata: {
        contentType: mimetype,
    },
    public: false, // Change to false
});

// Remove this line:
// await file.makePublic();
```

---

## 🧪 Testing with Postman/Thunder Client

1. **Set Method:** POST
2. **URL:** `http://localhost:8888/api/upload-image`
3. **Headers:**
   - `authtoken`: `your-firebase-auth-token`
4. **Body:**
   - Type: `form-data`
   - Key: `image` (Type: File)
   - Value: Select an image file

---

## 📝 Error Handling

Common errors and solutions:

| Error | Cause | Solution |
|-------|-------|----------|
| "No file uploaded" | No file in request | Ensure file is sent with key 'image' |
| "Invalid file type" | Wrong file format | Only use JPEG, PNG, GIF, WebP |
| "File too large" | Image > 5MB | Compress image or increase limit |
| "Unauthorized" | Missing/invalid auth token | Check Firebase auth token |
| "Failed to upload image" | Firebase Storage issue | Check bucket URL and permissions |

---

## 🎯 Next Steps

1. Update the bucket URL in `src/upload.js`
2. Test the upload endpoint
3. Integrate with your frontend
4. Consider adding a delete endpoint if needed
5. Set up proper Firebase Storage security rules

Need help? Check the comments in `src/upload.js` for more details!

