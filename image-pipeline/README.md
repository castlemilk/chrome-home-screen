# Image Pipeline for Chrome Home Extension

A Go-based tool to optimize images to multiple sizes/formats and upload them to Google Cloud Storage (GCS).

## Features

- 🖼️ **Multi-size optimization**: Generates full, preview, and thumbnail versions
- 🎨 **Multi-format support**: Outputs JPG and WebP formats
- ☁️ **GCS Integration**: Direct upload to Google Cloud Storage
- 📋 **Manifest generation**: Creates JSON manifest for extension consumption
- ⚡ **Fast processing**: Concurrent image processing
- 🔧 **Configurable**: JSON-based configuration

## Prerequisites

- Go 1.21 or later
- Google Cloud Storage bucket
- GCS service account credentials (JSON file)

## Installation

```bash
# Clone and build
cd image-pipeline
make build

# Or install to GOPATH/bin
make install
```

## Quick Start

### 1. Initialize Configuration

```bash
make init
```

This creates a `config.json` file. Edit it to set:
- GCS bucket name
- GCS project ID  
- Path to GCS credentials JSON
- Source image directory

Example `config.json`:

```json
{
  "gcs": {
    "bucket_name": "chrome-home-images",
    "project_id": "your-project-id",
    "credentials_path": "./gcs-credentials.json",
    "base_url": "https://storage.googleapis.com/chrome-home-images",
    "public_read": true
  },
  "images": {
    "source_dir": "../images/jwst",
    "formats": ["jpg", "webp"],
    "quality": 85,
    "sizes": [
      {"name": "full", "max_width": 2560, "max_height": 1440, "quality": 90},
      {"name": "preview", "max_width": 1280, "max_height": 720, "quality": 85},
      {"name": "thumbnail", "max_width": 320, "max_height": 180, "quality": 80}
    ]
  },
  "output": {
    "local_dir": "./output",
    "manifest_path": "./output/manifest.json"
  }
}
```

### 2. Run Full Pipeline

```bash
make deploy
```

This will:
1. Optimize all images in the source directory
2. Upload optimized images to GCS
3. Generate and upload manifest.json

### Individual Commands

```bash
# Just optimize images locally
make optimize

# Just upload already-optimized images
make upload

# Show help
make help
```

## CLI Usage

```bash
# Initialize config
./bin/image-pipeline init

# Optimize images
./bin/image-pipeline optimize --config config.json

# Upload to GCS
./bin/image-pipeline upload --config config.json

# Full pipeline
./bin/image-pipeline deploy --config config.json
```

## Output Structure

```
output/
├── image1_full.jpg
├── image1_full.webp
├── image1_preview.jpg
├── image1_preview.webp
├── image1_thumbnail.jpg
├── image1_thumbnail.webp
└── manifest.json
```

## Manifest Format

The generated `manifest.json` provides image metadata for the Chrome extension:

```json
{
  "version": "1.0.0",
  "generated": "2024-01-15T10:30:00Z",
  "base_url": "https://storage.googleapis.com/chrome-home-images/images",
  "images": [
    {
      "id": "54565613170_7e8bef5479_o",
      "name": "JWST Image 54565613170",
      "variants": [
        {
          "size": "full",
          "format": "jpg",
          "url": "https://storage.googleapis.com/.../image_full.jpg",
          "width": 2560,
          "height": 1440,
          "file_size": 524288
        },
        {
          "size": "preview",
          "format": "webp",
          "url": "https://storage.googleapis.com/.../image_preview.webp",
          "width": 1280,
          "height": 720,
          "file_size": 131072
        }
      ],
      "metadata": {
        "original_size": 189000000
      }
    }
  ]
}
```

## GCS Setup

### 1. Create a GCS Bucket

```bash
gsutil mb gs://chrome-home-images
```

### 2. Make Bucket Public (Optional)

```bash
gsutil iam ch allUsers:objectViewer gs://chrome-home-images
```

### 3. Create Service Account

```bash
gcloud iam service-accounts create chrome-home-images \
    --display-name="Chrome Home Images Uploader"

gcloud iam service-accounts keys create gcs-credentials.json \
    --iam-account=chrome-home-images@your-project-id.iam.gserviceaccount.com

# Grant Storage Object Admin role
gcloud projects add-iam-policy-binding your-project-id \
    --member="serviceAccount:chrome-home-images@your-project-id.iam.gserviceaccount.com" \
    --role="roles/storage.objectAdmin"
```

## Chrome Extension Integration

Update your extension to fetch the manifest and images from GCS:

```javascript
// Fetch manifest
const manifest = await fetch('https://storage.googleapis.com/chrome-home-images/manifest.json')
  .then(res => res.json());

// Get a random image
const randomImage = manifest.images[Math.floor(Math.random() * manifest.images.length)];

// Get preview variant
const preview = randomImage.variants.find(v => v.size === 'preview' && v.format === 'webp');

// Use the image
document.body.style.backgroundImage = `url(${preview.url})`;
```

## Development

```bash
# Run tests
make test

# Format code
make fmt

# Run linter
make vet

# Run all checks
make verify
```

## Project Structure

```
image-pipeline/
├── cmd/
│   └── main.go              # CLI entrypoint
├── pkg/
│   ├── optimizer/           # Image optimization
│   ├── uploader/            # GCS upload logic
│   └── manifest/            # Manifest generation
├── config/
│   └── config.go            # Configuration management
├── Makefile                 # Build automation
├── go.mod                   # Go module definition
└── README.md               # This file
```

## Troubleshooting

### "Failed to create GCS client"
- Verify your `credentials_path` in `config.json` points to a valid service account JSON file
- Ensure the service account has Storage Object Admin role

### "Permission denied" on GCS upload
- Check service account has `storage.objects.create` permission
- Verify bucket name is correct in config

### Images too large/small
- Adjust `max_width` and `max_height` in the `sizes` configuration
- Modify `quality` settings (1-100) to control file size vs. quality

## License

MIT License - see LICENSE file for details

