# Weather Service API

A Go microservice that proxies Google Weather API requests for the Chrome Home Extension.

## Features

- CORS-enabled for Chrome extension access
- Proxies Google Weather API endpoints
- Geocoding support for location search
- Combined weather endpoint for efficient data fetching
- Ready for Google Cloud Run deployment

## API Endpoints

- `GET /health` - Health check
- `GET /api/current?lat=<latitude>&lon=<longitude>` - Current weather conditions
- `GET /api/forecast?lat=<latitude>&lon=<longitude>&days=<days>` - Weather forecast
- `GET /api/geocode?address=<address>` - Geocode location
- `GET /api/weather?lat=<latitude>&lon=<longitude>` - Combined current + forecast

## Local Development

1. Set environment variable:
```bash
export GOOGLE_API_KEY="your-api-key"
```

2. Run the service:
```bash
go run main.go
```

The service will start on port 8080 by default.

## Deployment to Google Cloud Run

### Prerequisites
- Google Cloud Project with billing enabled
- `gcloud` CLI installed and configured
- Enable required APIs:
```bash
gcloud services enable run.googleapis.com containerregistry.googleapis.com cloudbuild.googleapis.com
```

### Deploy using GitHub Actions

1. Set up GitHub secrets in your repository:
   - `GCP_PROJECT_ID` - Your Google Cloud project ID
   - `GCP_SA_KEY` - Service account key JSON (with Cloud Run Admin, Storage Admin permissions)
   - `GOOGLE_API_KEY` - Your Google Maps Platform API key

2. Create a service account for deployment:
```bash
# Create service account
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions Deploy"

# Grant necessary permissions
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:github-actions@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:github-actions@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:github-actions@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

# Create and download key
gcloud iam service-accounts keys create github-actions-key.json \
  --iam-account=github-actions@PROJECT_ID.iam.gserviceaccount.com
```

3. Add the key to GitHub secrets as `GCP_SA_KEY`

4. Push to main branch or manually trigger the workflow

### Deploy manually

1. Build and push container:
```bash
# Configure Docker for Google Container Registry
gcloud auth configure-docker

# Build the container
docker build -t gcr.io/PROJECT_ID/weather-service .

# Push to GCR
docker push gcr.io/PROJECT_ID/weather-service
```

2. Deploy to Cloud Run:
```bash
gcloud run deploy weather-service \
  --image gcr.io/PROJECT_ID/weather-service \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GOOGLE_API_KEY="your-api-key"
```

## Environment Variables

- `PORT` - Server port (default: 8080, set automatically by Cloud Run)
- `GOOGLE_API_KEY` - Google Maps Platform API key with Weather API enabled

## CORS Configuration

The service allows all origins by default to support Chrome extensions. For production, you may want to restrict this to specific origins.

## Response Format

All endpoints return JSON responses with appropriate HTTP status codes.

### Example Response (combined weather endpoint):
```json
{
  "current": {
    "temperature": {
      "degrees": 20,
      "unit": "CELSIUS"
    },
    "weatherCondition": {
      "type": "CLEAR",
      "description": {
        "text": "Clear"
      }
    }
  },
  "forecast": {
    "daily": [...],
    "hourly": [...]
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```