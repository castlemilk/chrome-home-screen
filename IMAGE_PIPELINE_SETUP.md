# Image Pipeline Setup Guide

This guide shows you how to use the image-pipeline tool to optimize and deploy images to Google Cloud Storage.

## 🎯 What It Does

The image pipeline tool:
- ✅ Optimizes 566MB of images down to ~13MB
- ✅ Generates multiple sizes (full: 2560x1440, preview: 1280x720, thumbnail: 320x180)
- ✅ Outputs multiple formats (JPG, WebP)
- ✅ Uploads to Google Cloud Storage
- ✅ Generates a manifest.json for the extension to consume
- ✅ Makes images publicly accessible via CDN

## 📋 Prerequisites

1. **Google Cloud Storage** bucket
2. **Service account** with Storage Object Admin role
3. **Credentials JSON** file from GCP

## 🚀 Quick Start

### Step 1: Set Up GCS

```bash
# Set correct project
gcloud config set project beautiful-home-screen

# Create a bucket
gsutil mb gs://chrome-home-images

# Make it public
gsutil iam ch allUsers:objectViewer gs://chrome-home-images

# Enable uniform bucket-level access
gsutil uniformbucketlevelaccess set on gs://chrome-home-images

# Create service account
gcloud iam service-accounts create chrome-home-images \
    --display-name="Chrome Home Images Uploader" \
    --project=beautiful-home-screen

# Create credentials
gcloud iam service-accounts keys create image-pipeline/gcs-credentials.json \
    --iam-account=chrome-home-images@beautiful-home-screen.iam.gserviceaccount.com

# Grant permissions
gcloud projects add-iam-policy-binding beautiful-home-screen \
    --member="serviceAccount:chrome-home-images@beautiful-home-screen.iam.gserviceaccount.com" \
    --role="roles/storage.objectAdmin"
```

> 📝 See `image-pipeline/SETUP_COMMANDS.md` for ready-to-copy commands

### Step 2: Configure the Pipeline

```bash
cd image-pipeline

# Create config from template
./bin/image-pipeline init

# Edit config.json with your settings:
# - bucket_name: "chrome-home-images"
# - project_id: "your-project-id"
# - credentials_path: "./gcs-credentials.json"
# - source_dir: "../images/jwst"
```

### Step 3: Run the Pipeline

```bash
# Full pipeline (optimize + upload + manifest)
make deploy

# Or run steps individually:
make optimize  # Just optimize locally
make upload    # Just upload to GCS
```

## 📊 Expected Results

```
=== Optimization Summary ===
Source images processed: 16
Output files generated: 96 (16 images × 3 sizes × 2 formats)
Total original size: 566 MB
Total optimized size: 13 MB
Space saved: 97.7%
===========================

=== Upload Summary ===
Files uploaded: 97 (96 images + 1 manifest)
Total size: 13 MB
======================

=== Manifest Summary ===
Version: 1.0.0
Base URL: https://storage.googleapis.com/chrome-home-images/images
Total images: 16
Total variants: 96
========================
```

## 📦 Output Structure

```
output/
├── 53612916394_734d0e1e4a_o_full.jpg
├── 53612916394_734d0e1e4a_o_full.webp
├── 53612916394_734d0e1e4a_o_preview.jpg
├── 53612916394_734d0e1e4a_o_preview.webp
├── 53612916394_734d0e1e4a_o_thumbnail.jpg
├── 53612916394_734d0e1e4a_o_thumbnail.webp
└── ... (16 images × 6 variants each)
```

## 🔗 Integration with Chrome Extension

### Update Background Image Source

Edit `chrome-home-react/src/App.jsx` or create a new service:

```javascript
// src/services/imageService.js
export class ImageService {
  constructor() {
    this.manifestUrl = 'https://storage.googleapis.com/chrome-home-images/manifest.json';
    this.manifest = null;
  }

  async loadManifest() {
    if (this.manifest) return this.manifest;
    
    try {
      const response = await fetch(this.manifestUrl);
      this.manifest = await response.json();
      return this.manifest;
    } catch (error) {
      console.error('Failed to load image manifest:', error);
      // Fallback to local images
      return null;
    }
  }

  async getRandomImage(size = 'preview', format = 'webp') {
    const manifest = await this.loadManifest();
    if (!manifest) return null;

    const images = manifest.images;
    const randomImage = images[Math.floor(Math.random() * images.length)];
    
    // Find the requested variant
    const variant = randomImage.variants.find(
      v => v.size === size && v.format === format
    );

    return variant || randomImage.variants[0];
  }

  async preloadImages(count = 5) {
    const manifest = await this.loadManifest();
    if (!manifest) return [];

    const images = [];
    const shuffled = [...manifest.images].sort(() => Math.random() - 0.5);

    for (let i = 0; i < Math.min(count, shuffled.length); i++) {
      const image = shuffled[i];
      const preview = image.variants.find(v => v.size === 'preview' && v.format === 'webp');
      if (preview) {
        images.push(preview);
        // Preload
        const img = new Image();
        img.src = preview.url;
      }
    }

    return images;
  }
}

// Usage
const imageService = new ImageService();
const image = await imageService.getRandomImage('preview', 'webp');
document.body.style.backgroundImage = `url(${image.url})`;
```

### Lazy Loading with Thumbnails

```javascript
async function setBackgroundWithPlaceholder() {
  const imageService = new ImageService();
  
  // Load thumbnail first (fast)
  const thumbnail = await imageService.getRandomImage('thumbnail', 'jpg');
  document.body.style.backgroundImage = `url(${thumbnail.url})`;
  document.body.style.filter = 'blur(10px)';
  
  // Load full image in background
  const full = await imageService.getRandomImage('full', 'webp');
  const img = new Image();
  img.onload = () => {
    document.body.style.backgroundImage = `url(${full.url})`;
    document.body.style.filter = 'none';
  };
  img.src = full.url;
}
```

## 🔧 Configuration Options

### Image Sizes

Edit `config.json`:

```json
{
  "images": {
    "sizes": [
      {
        "name": "full",
        "max_width": 2560,
        "max_height": 1440,
        "quality": 90
      },
      {
        "name": "preview",
        "max_width": 1280,
        "max_height": 720,
        "quality": 85
      },
      {
        "name": "thumbnail",
        "max_width": 320,
        "max_height": 180,
        "quality": 80
      }
    ]
  }
}
```

### Custom Sizes

Add additional size presets:

```json
{
  "name": "mobile",
  "max_width": 1080,
  "max_height": 1920,
  "quality": 85
}
```

## 🔄 Updating Images

When you add new images to `images/jwst-optimized/`:

```bash
cd image-pipeline
make deploy
```

This will:
1. Process new images
2. Upload to GCS
3. Update manifest.json
4. Chrome extension will automatically use new images

## 💰 Cost Estimation (GCS)

For 13MB of images with ~1000 daily users:

- **Storage**: $0.026/month (~13MB × $0.002/GB)
- **Bandwidth**: $1.20/month (~13MB × 1000 users × $0.09/GB)
- **Operations**: ~$0.01/month
- **Total**: ~$1.25/month

Use Cloud CDN for better performance and lower costs at scale.

## 🧹 Maintenance

### Delete Old Images

```bash
# List objects
gsutil ls gs://chrome-home-images/images/

# Delete specific image
gsutil rm gs://chrome-home-images/images/old-image*.jpg

# Re-run deploy to update manifest
make deploy
```

### Update All Images

```bash
# Clean local output
make clean

# Run full pipeline
make deploy
```

## 🐛 Troubleshooting

### "Permission denied" uploading to GCS
- Verify service account has `storage.objects.create` permission
- Check credentials path in config.json

### Images not appearing in extension
- Verify manifest URL is accessible: `curl https://storage.googleapis.com/your-bucket/manifest.json`
- Check browser console for CORS errors
- Ensure bucket has public read access

### Out of memory during optimization
- Reduce `max_width` and `max_height` in config
- Process images in smaller batches
- Increase system memory

## 📚 Further Reading

- [GCS Documentation](https://cloud.google.com/storage/docs)
- [Image Optimization Best Practices](https://web.dev/fast/)
- [WebP Format Guide](https://developers.google.com/speed/webp)

---

**Need Help?** Check the [README.md](image-pipeline/README.md) in the image-pipeline directory for detailed API documentation.

