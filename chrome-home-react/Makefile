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

verify-icons: ## Verify all icons are valid PNG files
	@echo "🔍 Verifying icon files..."
	@if [ ! -f dist/icons/icon16.png ]; then echo "❌ icon16.png missing"; exit 1; fi
	@if [ ! -f dist/icons/icon48.png ]; then echo "❌ icon48.png missing"; exit 1; fi
	@if [ ! -f dist/icons/icon128.png ]; then echo "❌ icon128.png missing"; exit 1; fi
	@echo "Checking file types..."
	@file dist/icons/icon16.png | grep -q "PNG image" || (echo "❌ icon16.png is not a PNG"; exit 1)
	@file dist/icons/icon48.png | grep -q "PNG image" || (echo "❌ icon48.png is not a PNG"; exit 1)
	@file dist/icons/icon128.png | grep -q "PNG image" || (echo "❌ icon128.png is not a PNG"; exit 1)
	@echo "Checking dimensions..."
	@sips -g pixelWidth -g pixelHeight dist/icons/icon16.png 2>&1 | grep -q "pixelWidth: 16" || (echo "❌ icon16.png wrong size"; exit 1)
	@sips -g pixelWidth -g pixelHeight dist/icons/icon48.png 2>&1 | grep -q "pixelWidth: 48" || (echo "❌ icon48.png wrong size"; exit 1)
	@sips -g pixelWidth -g pixelHeight dist/icons/icon128.png 2>&1 | grep -q "pixelWidth: 128" || (echo "❌ icon128.png wrong size"; exit 1)
	@echo "Checking manifest references..."
	@grep -q "icon16.png" dist/manifest.json || (echo "❌ manifest doesn't reference icon16.png"; exit 1)
	@grep -q "icon48.png" dist/manifest.json || (echo "❌ manifest doesn't reference icon48.png"; exit 1)
	@grep -q "icon128.png" dist/manifest.json || (echo "❌ manifest doesn't reference icon128.png"; exit 1)
	@if grep -q "\.svg" dist/manifest.json; then echo "⚠️  Warning: manifest still references .svg files"; exit 1; fi
	@echo "✅ All icon checks passed!"

test-install: build verify-icons ## Test installation from ZIP (mimics Chrome Web Store)
	@echo ""
	@echo "🧪 Testing installation process..."
	@echo ""
	@echo "Creating test installation..."
	@rm -rf /tmp/chrome-home-test
	@mkdir -p /tmp/chrome-home-test
	@cd dist && cp -r . /tmp/chrome-home-test/
	@echo "✅ Test package created at: /tmp/chrome-home-test"
	@echo ""
	@echo "📦 To test in Chrome:"
	@echo "   1. Go to: chrome://extensions/"
	@echo "   2. Enable 'Developer mode'"
	@echo "   3. Click 'Load unpacked'"
	@echo "   4. Select: /tmp/chrome-home-test"
	@echo "   5. Verify extension loads without errors"
	@echo ""
	@echo "🧹 To clean up after testing:"
	@echo "   rm -rf /tmp/chrome-home-test"

pack-extension: build verify-icons ## Create packed extension (.crx) for testing
	@echo ""
	@echo "📦 To create a packed extension (.crx):"
	@echo ""
	@echo "   1. Go to: chrome://extensions/"
	@echo "   2. Enable 'Developer mode'"
	@echo "   3. Click 'Pack extension'"
	@echo "   4. Root directory: $(CURDIR)/dist"
	@echo "   5. Private key: (leave empty)"
	@echo "   6. Click 'Pack Extension'"
	@echo ""
	@echo "   This will create: dist.crx and dist.pem"
	@echo ""
	@echo "📥 To install the packed extension:"
	@echo "   - Drag dist.crx into chrome://extensions/"
	@echo ""
	@echo "⚠️  Note: Packed extensions catch issues that 'Load unpacked' misses!"

test-package: clean build verify-icons ## Full package test (comprehensive)
	@echo ""
	@echo "🧪 Running comprehensive package tests..."
	@echo ""
	@echo "✅ Build successful"
	@echo "✅ Icons verified"
	@echo ""
	@echo "Checking package contents..."
	@test -f dist/manifest.json || (echo "❌ manifest.json missing"; exit 1)
	@test -f dist/index.html || (echo "❌ index.html missing"; exit 1)
	@test -f dist/background.js || (echo "❌ background.js missing"; exit 1)
	@test -d dist/assets || (echo "❌ assets directory missing"; exit 1)
	@echo "✅ Required files present"
	@echo ""
	@echo "Checking manifest validity..."
	@node scripts/validate-manifest.js
	@echo ""
	@echo "Creating test package..."
	@rm -f test-$(PACKAGE_NAME)
	@cd dist && zip -rq ../test-$(PACKAGE_NAME) . -x "*.DS_Store"
	@echo "✅ Test package created: test-$(PACKAGE_NAME)"
	@ls -lh test-$(PACKAGE_NAME)
	@echo ""
	@echo "🎉 All tests passed! Ready for release."
	@echo ""
	@echo "Next steps:"
	@echo "   1. Test packed extension: make pack-extension"
	@echo "   2. If all good, create release: make release"
	@rm -f test-$(PACKAGE_NAME)

pre-release: test-package ## Pre-release checks before publishing
	@echo ""
	@echo "📋 Pre-release checklist:"
	@echo "   ✅ Build successful"
	@echo "   ✅ Icons verified (PNG format)"
	@echo "   ✅ Manifest valid"
	@echo "   ✅ Package created"
	@echo ""
	@echo "⚠️  Manual checks required:"
	@echo "   [ ] Test packed extension (make pack-extension)"
	@echo "   [ ] Test in fresh Chrome profile"
	@echo "   [ ] All features working"
	@echo "   [ ] No console errors"
	@echo "   [ ] Version number correct"
	@echo ""
	@echo "When ready: make release"

.DEFAULT_GOAL := help
