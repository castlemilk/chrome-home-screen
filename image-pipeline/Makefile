.PHONY: help build install clean init optimize upload deploy test fmt vet setup-gcs check-gcs verify-setup

# Configuration
PROJECT_ID := beautiful-home-screen
BUCKET_NAME := chrome-home-images
SERVICE_ACCOUNT := chrome-home-images
SERVICE_ACCOUNT_EMAIL := $(SERVICE_ACCOUNT)@$(PROJECT_ID).iam.gserviceaccount.com
CREDENTIALS_FILE := gcs-credentials.json

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

## Build targets
build: ## Build the image-pipeline binary
	@echo "🔨 Building image-pipeline..."
	go build -o bin/image-pipeline ./cmd

install: build ## Install the binary to GOPATH/bin
	@echo "📦 Installing image-pipeline..."
	go install ./cmd

clean: ## Clean build artifacts and output
	@echo "🧹 Cleaning..."
	rm -rf bin/
	rm -rf output/
	@echo "✅ Cleaned"

## Configuration targets
init: build ## Initialize configuration file
	@echo "⚙️  Initializing configuration..."
	./bin/image-pipeline init

config: ## Copy example config to config.json
	@if [ ! -f config.json ]; then \
		echo "📝 Creating config.json from example..."; \
		cp config.example.json config.json; \
		echo "✅ Created config.json"; \
	else \
		echo "⚠️  config.json already exists"; \
	fi

## GCS Setup targets
check-gcloud: ## Check if gcloud is installed and authenticated
	@echo "🔍 Checking gcloud setup..."
	@command -v gcloud >/dev/null 2>&1 || { echo "❌ gcloud not found. Install from https://cloud.google.com/sdk"; exit 1; }
	@command -v gsutil >/dev/null 2>&1 || { echo "❌ gsutil not found. Install from https://cloud.google.com/sdk"; exit 1; }
	@gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q . || { echo "❌ Not authenticated. Run: gcloud auth login"; exit 1; }
	@echo "✅ gcloud is installed and authenticated"

set-project: check-gcloud ## Set the GCP project
	@echo "🎯 Setting project to $(PROJECT_ID)..."
	gcloud config set project $(PROJECT_ID)
	@echo "✅ Project set to $(PROJECT_ID)"

create-bucket: set-project ## Create GCS bucket
	@echo "🪣 Creating bucket gs://$(BUCKET_NAME)..."
	@gsutil ls gs://$(BUCKET_NAME) >/dev/null 2>&1 && { \
		echo "✅ Bucket already exists"; \
	} || { \
		gsutil mb gs://$(BUCKET_NAME) && \
		echo "✅ Bucket created"; \
	}

configure-bucket: ## Configure bucket (public access, uniform access, CORS)
	@echo "⚙️  Configuring bucket..."
	gsutil uniformbucketlevelaccess set on gs://$(BUCKET_NAME)
	gsutil iam ch allUsers:objectViewer gs://$(BUCKET_NAME)
	gsutil cors set cors.json gs://$(BUCKET_NAME)
	@echo "✅ Bucket configured (public + CORS enabled)"

create-service-account: set-project ## Create service account
	@echo "👤 Creating service account $(SERVICE_ACCOUNT)..."
	@gcloud iam service-accounts describe $(SERVICE_ACCOUNT_EMAIL) >/dev/null 2>&1 && { \
		echo "✅ Service account already exists"; \
	} || { \
		gcloud iam service-accounts create $(SERVICE_ACCOUNT) \
			--display-name="Chrome Home Images Uploader" \
			--project=$(PROJECT_ID) && \
		echo "✅ Service account created"; \
	}

grant-permissions: ## Grant storage permissions to service account
	@echo "🔐 Granting storage permissions..."
	gcloud projects add-iam-policy-binding $(PROJECT_ID) \
		--member="serviceAccount:$(SERVICE_ACCOUNT_EMAIL)" \
		--role="roles/storage.objectAdmin" \
		--condition=None
	@echo "✅ Permissions granted"

create-credentials: ## Create and download service account credentials
	@echo "🔑 Creating credentials..."
	@if [ -f $(CREDENTIALS_FILE) ]; then \
		echo "⚠️  Credentials file already exists at $(CREDENTIALS_FILE)"; \
		read -p "Overwrite? (y/N): " confirm; \
		if [ "$$confirm" = "y" ] || [ "$$confirm" = "Y" ]; then \
			rm $(CREDENTIALS_FILE); \
			gcloud iam service-accounts keys create $(CREDENTIALS_FILE) \
				--iam-account=$(SERVICE_ACCOUNT_EMAIL); \
			echo "✅ New credentials created"; \
		else \
			echo "⏭️  Skipping credential creation"; \
		fi \
	else \
		gcloud iam service-accounts keys create $(CREDENTIALS_FILE) \
			--iam-account=$(SERVICE_ACCOUNT_EMAIL); \
		echo "✅ Credentials created at $(CREDENTIALS_FILE)"; \
	fi

setup-gcs: check-gcloud set-project create-bucket configure-bucket create-service-account grant-permissions create-credentials ## Full GCS setup (run once)
	@echo ""
	@echo "🎉 GCS Setup Complete!"
	@echo ""
	@echo "Next steps:"
	@echo "  1. make config      # Create config.json"
	@echo "  2. make deploy      # Deploy images"

check-gcs: ## Check if GCS is properly set up
	@echo "🔍 Checking GCS setup..."
	@echo ""
	@echo "1. Checking project..."
	@gcloud config get-value project | grep -q $(PROJECT_ID) && echo "  ✅ Project: $(PROJECT_ID)" || echo "  ❌ Wrong project"
	@echo ""
	@echo "2. Checking bucket..."
	@gsutil ls gs://$(BUCKET_NAME) >/dev/null 2>&1 && echo "  ✅ Bucket exists: gs://$(BUCKET_NAME)" || echo "  ❌ Bucket not found"
	@echo ""
	@echo "3. Checking service account..."
	@gcloud iam service-accounts describe $(SERVICE_ACCOUNT_EMAIL) >/dev/null 2>&1 && echo "  ✅ Service account exists" || echo "  ❌ Service account not found"
	@echo ""
	@echo "4. Checking credentials..."
	@test -f $(CREDENTIALS_FILE) && echo "  ✅ Credentials file exists" || echo "  ❌ Credentials file not found"
	@echo ""
	@echo "5. Checking config..."
	@test -f config.json && echo "  ✅ config.json exists" || echo "  ❌ config.json not found"
	@echo ""

## Pipeline targets
optimize: build ## Optimize images
	@echo "🖼️  Optimizing images..."
	./bin/image-pipeline optimize

upload: build ## Upload optimized images to GCS
	@echo "☁️  Uploading to GCS..."
	./bin/image-pipeline upload

deploy: build config ## Run full pipeline (optimize + upload + manifest)
	@echo "🚀 Running full deployment..."
	./bin/image-pipeline deploy

## Testing and validation
test: ## Run tests
	@echo "🧪 Running tests..."
	go test -v ./...

fmt: ## Format Go code
	@echo "🎨 Formatting code..."
	go fmt ./...

vet: ## Run go vet
	@echo "🔍 Running go vet..."
	go vet ./...

lint: fmt vet ## Run formatters and linters

deps: ## Download dependencies
	@echo "📥 Downloading dependencies..."
	go mod download
	go mod tidy

verify: fmt vet test ## Run all checks

## Utility targets
list-images: ## List images in GCS bucket
	@echo "📋 Images in gs://$(BUCKET_NAME):"
	@gsutil ls gs://$(BUCKET_NAME)/images/ || echo "No images found"

view-manifest: ## View the deployed manifest
	@echo "📄 Manifest:"
	@curl -s https://storage.googleapis.com/$(BUCKET_NAME)/manifest.json | jq . || curl -s https://storage.googleapis.com/$(BUCKET_NAME)/manifest.json

bucket-size: ## Show bucket size
	@echo "💾 Bucket size:"
	@gsutil du -sh gs://$(BUCKET_NAME)

delete-all-images: ## Delete all images from GCS (CAREFUL!)
	@echo "⚠️  WARNING: This will delete all images from gs://$(BUCKET_NAME)"
	@read -p "Are you sure? Type 'yes' to confirm: " confirm; \
	if [ "$$confirm" = "yes" ]; then \
		gsutil -m rm -r gs://$(BUCKET_NAME)/images/** || true; \
		gsutil rm gs://$(BUCKET_NAME)/manifest.json || true; \
		echo "🗑️  All images deleted"; \
	else \
		echo "⏭️  Cancelled"; \
	fi

## Quick start targets
quickstart: setup-gcs config deploy ## Complete setup and deployment (run this first!)
	@echo ""
	@echo "🎉 Quickstart Complete!"
	@echo ""
	@echo "Your images are now available at:"
	@echo "  https://storage.googleapis.com/$(BUCKET_NAME)/manifest.json"
	@echo ""
	@echo "Test with:"
	@echo "  make view-manifest"

.DEFAULT_GOAL := help
