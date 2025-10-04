.PHONY: help build dev clean lint test reload-extension install

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies
	npm install

build: ## Build the extension for production
	npm run build

dev: ## Start development server
	npm run dev

clean: ## Clean build artifacts
	npm run clean

lint: ## Run linter
	npm run lint

lint-fix: ## Run linter and fix issues
	npm run lint:fix

test: ## Run tests
	npm run test

build-prod: ## Build and create zip for production
	npm run build:prod

reload-extension: build ## Build and show reload instructions
	@echo ""
	@echo "✅ Extension built successfully!"
	@echo ""
	@echo "📦 Extension location: $(CURDIR)/dist"
	@echo ""
	@echo "🔄 To reload in Chrome:"
	@echo "   1. Go to chrome://extensions/"
	@echo "   2. Enable 'Developer mode' (top right)"
	@echo "   3. Click 'Load unpacked' and select: $(CURDIR)/dist"
	@echo "   OR if already loaded: Click the reload icon ↻ on the extension card"
	@echo ""

watch: ## Watch for changes and rebuild (useful for development)
	@echo "Watching for changes... Press Ctrl+C to stop"
	@while true; do \
		make build; \
		echo "Waiting for changes..."; \
		sleep 2; \
	done

