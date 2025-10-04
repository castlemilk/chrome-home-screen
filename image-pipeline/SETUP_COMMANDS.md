# Quick Setup Commands for beautiful-home-screen Project

## GCS Setup Commands (Copy & Paste)

```bash
# Set project
gcloud config set project beautiful-home-screen

# Create bucket
gsutil mb gs://chrome-home-images

# Make bucket public
gsutil iam ch allUsers:objectViewer gs://chrome-home-images

# Enable uniform bucket-level access (recommended)
gsutil uniformbucketlevelaccess set on gs://chrome-home-images

# Create service account
gcloud iam service-accounts create chrome-home-images \
    --display-name="Chrome Home Images Uploader" \
    --project=beautiful-home-screen

# Create and download credentials
gcloud iam service-accounts keys create gcs-credentials.json \
    --iam-account=chrome-home-images@beautiful-home-screen.iam.gserviceaccount.com

# Grant Storage Object Admin role to service account
gcloud projects add-iam-policy-binding beautiful-home-screen \
    --member="serviceAccount:chrome-home-images@beautiful-home-screen.iam.gserviceaccount.com" \
    --role="roles/storage.objectAdmin"

# Verify setup
gsutil ls gs://chrome-home-images
gcloud iam service-accounts list --project=beautiful-home-screen
```

## Configuration

The `config.example.json` has been updated with:
- **Project ID**: `beautiful-home-screen`
- **Project Number**: `721754716567`
- **Account**: `ben.ebsworth@gmail.com`

## Deploy Images

```bash
cd image-pipeline

# Copy example config
cp config.example.json config.json

# (Optional) Edit config.json if needed
# vim config.json

# Run full deployment
make deploy
```

## Verify Deployment

```bash
# Check uploaded files
gsutil ls gs://chrome-home-images/images/

# View manifest
curl https://storage.googleapis.com/chrome-home-images/manifest.json

# Test image access
curl -I https://storage.googleapis.com/chrome-home-images/images/[IMAGE_NAME]
```

## Expected Bucket Structure

```
gs://chrome-home-images/
├── images/
│   ├── 53612916394_734d0e1e4a_o_full.jpg
│   ├── 53612916394_734d0e1e4a_o_full.webp
│   ├── 53612916394_734d0e1e4a_o_preview.jpg
│   ├── 53612916394_734d0e1e4a_o_preview.webp
│   ├── 53612916394_734d0e1e4a_o_thumbnail.jpg
│   ├── 53612916394_734d0e1e4a_o_thumbnail.webp
│   └── ... (all other optimized images)
└── manifest.json
```

## URLs

- **Manifest**: `https://storage.googleapis.com/chrome-home-images/manifest.json`
- **Images**: `https://storage.googleapis.com/chrome-home-images/images/[filename]`

## Troubleshooting

### If bucket name is taken
Edit `config.json` and change `bucket_name` to something unique like:
```json
"bucket_name": "chrome-home-images-721754716567"
```

Then update the base_url accordingly.

### If service account already exists
```bash
# List existing service accounts
gcloud iam service-accounts list --project=beautiful-home-screen

# Use existing one or delete and recreate
gcloud iam service-accounts delete chrome-home-images@beautiful-home-screen.iam.gserviceaccount.com
```

### Check costs
```bash
# View storage usage
gsutil du -s gs://chrome-home-images

# Expected: ~13-15 MB total
```

## Security Notes

⚠️ **Never commit `gcs-credentials.json`** - it's already in `.gitignore`

The credentials file gives full access to your GCS bucket. Keep it secure and rotate keys regularly:

```bash
# Delete old keys
gcloud iam service-accounts keys list \
    --iam-account=chrome-home-images@beautiful-home-screen.iam.gserviceaccount.com

gcloud iam service-accounts keys delete [KEY_ID] \
    --iam-account=chrome-home-images@beautiful-home-screen.iam.gserviceaccount.com
```

## Cost Estimate

With the **beautiful-home-screen** project:
- Storage: ~$0.026/month (13MB @ $0.002/GB/month)
- Bandwidth: ~$1.20/month (assuming 1000 daily users)
- Operations: ~$0.01/month
- **Total**: ~$1.25/month

Enable Cloud CDN for better performance and lower costs at scale.

