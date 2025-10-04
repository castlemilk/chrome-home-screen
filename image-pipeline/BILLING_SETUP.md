# Billing Setup for beautiful-home-screen

## Issue
The project `beautiful-home-screen` needs a billing account enabled to create GCS buckets.

## Option 1: Enable Billing (Recommended)

### Step 1: Link Billing Account

```bash
# List available billing accounts
gcloud beta billing accounts list

# Link billing account to project
gcloud beta billing projects link beautiful-home-screen \
    --billing-account=YOUR-BILLING-ACCOUNT-ID
```

### Step 2: Verify Billing

```bash
# Check if billing is enabled
gcloud beta billing projects describe beautiful-home-screen
```

### Step 3: Continue Setup

```bash
cd image-pipeline
make quickstart
```

## Option 2: Use Existing Bucket

If you already have a GCS bucket in another project with billing:

### Update Config

Edit `config.json`:

```json
{
  "gcs": {
    "bucket_name": "your-existing-bucket-name",
    "project_id": "your-project-with-billing",
    "credentials_path": "./gcs-credentials.json",
    "base_url": "https://storage.googleapis.com/your-existing-bucket-name",
    "public_read": true
  }
}
```

### Update Makefile Variables

Edit the Makefile:

```makefile
PROJECT_ID := your-project-with-billing
BUCKET_NAME := your-existing-bucket-name
```

## Option 3: Create Bucket in Console

1. Go to: https://console.cloud.google.com/storage/create-bucket
2. Select a project with billing enabled
3. Create bucket named: `chrome-home-images`
4. Set location: `us` (or your preferred region)
5. Set access control: `Fine-grained`
6. Click "Create"

Then run:

```bash
cd image-pipeline
make config
make deploy
```

## Costs Estimate

For ~13MB of images:
- **Storage**: $0.026/month
- **Bandwidth** (1000 daily users): $1.20/month
- **Operations**: $0.01/month
- **Total**: ~$1.25/month

## Enable Billing via Console

1. Go to: https://console.cloud.google.com/billing/linkedaccount?project=beautiful-home-screen
2. Click "Link a billing account"
3. Select or create a billing account
4. Click "Set account"

## Troubleshooting

### "Billing account is disabled"
Your billing account may be disabled. Check:
- Payment method is valid
- No outstanding balance
- Account is active

### "No billing accounts found"
Create one at: https://console.cloud.google.com/billing

### "Permission denied"
You need `billing.accounts.list` and `resourcemanager.projects.createBillingAssignment` permissions.

