# GCS Image Integration Guide

Your images are now live on Google Cloud Storage! Here's how to use them in your Chrome extension.

## 🔗 URLs

- **Manifest**: https://storage.googleapis.com/chrome-home-images/manifest.json
- **Images**: https://storage.googleapis.com/chrome-home-images/images/[filename]

## 📦 Image Service Created

I've created `chrome-home-react/src/services/imageService.js` that handles:
- ✅ Fetching manifest from GCS
- ✅ Local caching (24-hour cache)
- ✅ Random image selection
- ✅ Image preloading
- ✅ Fallback to cache if network fails

## 🚀 Quick Integration

### Option 1: Background Image (Recommended)

Update your `App.jsx` to use GCS images:

```javascript
import { useEffect, useState } from 'react';
import imageService from './services/imageService';

function App() {
  const [backgroundImage, setBackgroundImage] = useState(null);
  
  useEffect(() => {
    loadBackgroundImage();
  }, []);
  
  const loadBackgroundImage = async () => {
    try {
      // Get a random preview image in WebP format
      const image = await imageService.getRandomImage('preview', 'webp');
      if (image) {
        setBackgroundImage(image.url);
      }
    } catch (error) {
      console.error('Failed to load background:', error);
      // Fallback to local images
    }
  };
  
  return (
    <div 
      className="app"
      style={{
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Your app content */}
    </div>
  );
}
```

### Option 2: Progressive Loading (Better UX)

Load thumbnail first, then full image:

```javascript
const loadProgressiveBackground = async () => {
  try {
    // Load thumbnail first (fast)
    const thumbnail = await imageService.getRandomImage('thumbnail', 'jpg');
    if (thumbnail) {
      setBackgroundImage(thumbnail.url);
      setBlur(true);
    }
    
    // Load full image in background
    const preview = await imageService.getRandomImage('preview', 'webp');
    if (preview) {
      // Preload
      const img = new Image();
      img.onload = () => {
        setBackgroundImage(preview.url);
        setBlur(false);
      };
      img.src = preview.url;
    }
  } catch (error) {
    console.error('Failed to load background:', error);
  }
};
```

### Option 3: Background Carousel

Rotate through multiple images:

```javascript
const [images, setImages] = useState([]);
const [currentIndex, setCurrentIndex] = useState(0);

useEffect(() => {
  loadImages();
}, []);

useEffect(() => {
  if (images.length === 0) return;
  
  // Change image every 30 seconds
  const interval = setInterval(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, 30000);
  
  return () => clearInterval(interval);
}, [images]);

const loadImages = async () => {
  try {
    const imageList = await imageService.getRandomImages(10, 'preview', 'webp');
    setImages(imageList);
  } catch (error) {
    console.error('Failed to load images:', error);
  }
};

return (
  <div 
    className="app"
    style={{
      backgroundImage: images[currentIndex] 
        ? `url(${images[currentIndex].url})` 
        : undefined,
    }}
  >
    {/* Your content */}
  </div>
);
```

## 🎨 Image Sizes Available

- **full**: 2560×1440 (best quality, larger file)
- **preview**: 1280×720 (recommended for backgrounds)
- **thumbnail**: 320×180 (fast loading, blur preview)

## 📁 Available Formats

- **webp**: Smaller file size, modern browsers
- **jpg**: Universal compatibility

## 💡 Example: BackgroundSelector Integration

Update your `BackgroundSelector` component to include GCS option:

```javascript
import imageService from '../services/imageService';

const BackgroundSelector = () => {
  const [source, setSource] = useState('gcs'); // 'local', 'gcs', 'gradient'
  
  const handleSourceChange = async (newSource) => {
    setSource(newSource);
    
    if (newSource === 'gcs') {
      const image = await imageService.getRandomImage('preview', 'webp');
      if (image) {
        // Apply background
        applyBackground(image.url);
      }
    }
  };
  
  return (
    <div className="background-selector">
      <button onClick={() => handleSourceChange('local')}>Local Images</button>
      <button onClick={() => handleSourceChange('gcs')}>Cloud Images (GCS)</button>
      <button onClick={() => handleSourceChange('gradient')}>Gradient</button>
    </div>
  );
};
```

## 🔄 Updating Images

When you add new images:

```bash
cd image-pipeline
make deploy
```

The extension will automatically fetch the new manifest within 24 hours, or users can clear cache:

```javascript
// Add a "Refresh Images" button
const handleRefresh = async () => {
  imageService.clearCache();
  const image = await imageService.getRandomImage('preview', 'webp');
  setBackgroundImage(image?.url);
};
```

## 🐛 Debugging

### Check if images are accessible:

```javascript
// In browser console
import imageService from './services/imageService';

// Test manifest fetch
const manifest = await imageService.loadManifest();
console.log('Manifest:', manifest);

// Test image fetch
const image = await imageService.getRandomImage('preview', 'webp');
console.log('Random image:', image);
```

### View manifest directly:

Open: https://storage.googleapis.com/chrome-home-images/manifest.json

### Test an image:

Open: https://storage.googleapis.com/chrome-home-images/images/54565613170_7e8bef5479_o_preview.jpg

## 📊 Performance

- **Manifest size**: ~12KB (cached for 24 hours)
- **Thumbnail**: ~4-13KB (instant load)
- **Preview**: ~66-208KB (recommended)
- **Full**: ~200-1083KB (highest quality)

## 🔒 Security

Images are publicly accessible (required for Chrome extension). No authentication needed.

## 🎯 Recommended Implementation

1. **Default to GCS images** - faster, no extension size increase
2. **Keep local images as fallback** - for offline or if GCS fails
3. **Use preview size** - best balance of quality and speed
4. **Prefer WebP format** - smaller files, better compression
5. **Cache manifest** - reduce API calls

## 📝 Next Steps

1. Update `App.jsx` to use imageService
2. Test with: `npm run dev`
3. Build extension: `cd chrome-home-react && make build`
4. Reload extension in Chrome
5. Enjoy cloud-hosted space images! 🚀

---

**Questions?** Check the imageService.js JSDoc comments for full API documentation.

