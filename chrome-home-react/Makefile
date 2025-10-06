.PHONY: help build dev clean lint test reload-extension install zip package release version bump-major bump-minor bump-patch tag

# Get version from git tag, fallback to package.json
VERSION := $(shell git describe --tags --abbrev=0 2>/dev/null | sed 's/^v//' || node -p "require('./package.json').version")
PACKAGE_NAME := chrome-home-extension-v$(VERSION).zip

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies
	npm install

icons: ## Generate PNG icons from SVG
	@echo "🎨 Converting SVG icons to PNG..."
	node scripts/convert-icons-to-png.js
	@echo "✅ Icons ready!"

build: icons ## Build the extension for production
	npm run build

dev: ## Start development server
	npm run dev

clean: ## Clean build artifacts
	npm run clean
	rm -f chrome-home-extension-v*.zip

lint: ## Run linter
	npm run lint

lint-fix: ## Run linter and fix issues
	npm run lint:fix

test: ## Run tests
	npm run test

zip: ## Create zip package from dist folder
	@echo "📦 Creating zip package..."
	@cd dist && zip -r ../$(PACKAGE_NAME) . -x "*.DS_Store" && cd ..
	@echo "✅ Package created: $(PACKAGE_NAME)"
	@ls -lh $(PACKAGE_NAME)

package: build zip ## Build and create zip package
	@echo ""
	@echo "✅ Package ready for Chrome Web Store!"
	@echo "📦 File: $(PACKAGE_NAME)"
	@echo "📍 Location: $(CURDIR)/$(PACKAGE_NAME)"

release: clean package ## Clean, build, and create release package
	@echo ""
	@echo "🎉 Release package ready!"
	@echo "📦 $(PACKAGE_NAME)"
	@echo ""
	@echo "Next steps:"
	@echo "  1. Go to: https://chrome.google.com/webstore/devconsole"
	@echo "  2. Upload: $(CURDIR)/$(PACKAGE_NAME)"
	@echo "  3. Submit for review"

build-prod: release ## Alias for release (build + zip)

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

validate: ## Validate manifest and run checks
	@echo "🔍 Validating extension..."
	node scripts/validate-manifest.js
	@echo ""
	@echo "Running linter..."
	npm run lint
	@echo ""
	@echo "Running tests..."
	npm run test -- --run
	@echo ""
	@echo "✅ All validations passed!"

verify-package: package ## Create package and show contents
	@echo ""
	@echo "📋 Package contents:"
	@unzip -l $(PACKAGE_NAME) | head -30
	@echo ""
	@echo "📦 Package size:"
	@ls -lh $(PACKAGE_NAME)

version: ## Show current version from git tag
	@echo "Current version: v$(VERSION)"
	@echo "Git tag: $$(git describe --tags --abbrev=0 2>/dev/null || echo 'No tags found')"
	@echo "Package.json: $$(node -p "require('./package.json').version")"

bump-patch: ## Bump patch version (x.x.X)
	@echo "🔼 Bumping patch version..."
	@node scripts/bump-version.js patch

bump-minor: ## Bump minor version (x.X.0)
	@echo "🔼 Bumping minor version..."
	@node scripts/bump-version.js minor

bump-major: ## Bump major version (X.0.0)
	@echo "🔼 Bumping major version..."
	@node scripts/bump-version.js major

tag: ## Create git tag for current version
	@VERSION=$$(node scripts/get-version.js); \
	echo "🏷️  Creating tag v$$VERSION..."; \
	git add package.json public/manifest.json package-lock.json; \
	git commit -m "Bump version to $$VERSION" || true; \
	git tag -a "v$$VERSION" -m "Release v$$VERSION"; \
	echo "✅ Created tag v$$VERSION"; \
	echo ""; \
	echo "📤 To push:"; \
	echo "   git push && git push --tags"

.DEFAULT_GOAL := help
