# Build and Release Guide

Complete guide for building and releasing the Chrome Home Extension.

## 🚀 Quick Commands

### Development
```bash
make dev              # Start development server
make build            # Build for production
make test             # Run all tests
make lint             # Check code quality
```

### Packaging
```bash
make package          # Build + create zip
make release          # Clean + build + zip (recommended)
make verify-package   # Show package contents
```

### Deployment
```bash
make reload-extension # Build + show reload instructions (for testing)
make validate         # Run all checks (manifest + lint + tests)
```

## 📦 Creating a Release Package

### One Command Release:

```bash
make release
```

This will:
1. ✅ Clean old builds
2. ✅ Build extension
3. ✅ Validate manifest
4. ✅ Create zip package
5. ✅ Show Chrome Web Store upload instructions

Output:
```
🎉 Release package ready!
📦 chrome-home-extension-v1.0.0.zip

Next steps:
  1. Go to: https://chrome.google.com/webstore/devconsole
  2. Upload: /path/to/chrome-home-extension-v1.0.0.zip
  3. Submit for review
```

## 📋 Pre-Release Checklist

```bash
# 1. Run all validations
make validate

# 2. Check package contents
make verify-package

# 3. Test locally
make reload-extension
# Then test in Chrome

# 4. Create release package
make release
```

## 🏪 Publishing to Chrome Web Store

### Step 1: Create Package

```bash
make release
```

This creates: `chrome-home-extension-v1.0.0.zip`

### Step 2: Upload to Chrome Web Store

1. Go to: https://chrome.google.com/webstore/devconsole
2. Click your extension (or "New Item" if first time)
3. Click "Package" tab
4. Click "Upload new package"
5. Select: `chrome-home-extension-v1.0.0.zip`
6. Click "Submit for review"

### Step 3: Fill in Store Listing

See `store/STORE_LISTING.md` for:
- Description
- Screenshots
- Promotional images
- Category selection
- Privacy policy link

## 🔄 Version Management

### Bump Version

Edit `package.json`:

```json
{
  "version": "1.0.1"  // Update this
}
```

Then:
```bash
make release  # Creates chrome-home-extension-v1.0.1.zip
```

### Version Naming

- `1.0.0` - Initial release
- `1.0.1` - Bug fixes
- `1.1.0` - New features
- `2.0.0` - Major changes

## 📊 Package Contents

The zip contains:
```
chrome-home-extension-v1.0.0.zip (13MB)
├── manifest.json                 # Extension manifest
├── index.html                    # Main HTML
├── background.js                 # Service worker
├── assets/
│   ├── main.js                   # App bundle (~730KB)
│   ├── main.css                  # Styles (~94KB)
│   └── index.js                  # Entry point
├── icons/
│   ├── icon16.svg               # 16×16 icon
│   ├── icon48.svg               # 48×48 icon
│   ├── icon128.svg              # 128×128 icon
│   └── icon-promo.svg           # Promo tile
└── images/jwst-optimized/       # Fallback images (13MB)
    └── [16 optimized images]
```

## 🎯 Build Targets Explained

### `make build`
- Compiles React app with Vite
- Outputs to `dist/` folder
- Validates manifest
- **Use for**: Development testing

### `make package`
- Runs `build`
- Creates zip from `dist/`
- Names: `chrome-home-extension-v{VERSION}.zip`
- **Use for**: Quick packaging

### `make release`
- Runs `clean` (removes old builds)
- Runs `package` (build + zip)
- Shows upload instructions
- **Use for**: Production releases

### `make verify-package`
- Creates package
- Lists all files in zip
- Shows package size
- **Use for**: Pre-release verification

## 🔍 Quality Checks

### Before Each Release:

```bash
# 1. Validate everything
make validate

# 2. Check package
make verify-package

# 3. Test locally
make reload-extension
# Test in Chrome thoroughly

# 4. Create release
make release
```

## 📂 Output Files

After running `make package` or `make release`:

```bash
chrome-home-react/
├── dist/                              # Built extension
│   ├── manifest.json
│   ├── index.html
│   ├── background.js
│   ├── assets/
│   ├── icons/
│   └── images/
└── chrome-home-extension-v1.0.0.zip   # Release package
```

## 🗑️ Cleaning Up

```bash
# Remove builds and packages
make clean

# This removes:
# - dist/
# - build/
# - *.zip files
```

## 🐛 Troubleshooting

### "Manifest validation failed"
```bash
node scripts/validate-manifest.js
# Fix any errors shown
```

### "Package too large" (>50MB limit for Chrome Web Store)
Current package: ~13MB ✅ (well under limit)

If you add more content:
- Use GCS for images (we already do this!)
- Remove unused dependencies
- Enable code splitting

### "Tests failing"
```bash
npm run test -- --run
# Fix failing tests
```

### Missing dependencies
```bash
make install  # or npm install
```

## 🎨 Customization

### Change Package Name

Edit Makefile:
```makefile
PACKAGE_NAME := my-custom-name-v$(VERSION).zip
```

### Add Pre-build Steps

Add before `build` target:
```makefile
prebuild:
	@echo "Running pre-build tasks..."
	# Your custom tasks

build: prebuild
	npm run build
```

## 📚 Related Documentation

- `PUBLISHING_CHECKLIST.md` - Full publishing checklist
- `STORE_LISTING.md` - Store listing content
- `CREATE_SCREENSHOTS.md` - Screenshot guide
- `FINAL_TEST_CHECKLIST.md` - Testing checklist

## ⚡ Quick Reference

| Command | What it does |
|---------|-------------|
| `make` | Show help |
| `make build` | Build extension |
| `make package` | Build + zip |
| `make release` | Clean + build + zip + instructions |
| `make test` | Run tests |
| `make validate` | Run all checks |
| `make clean` | Remove builds |
| `make reload-extension` | Build + show Chrome reload steps |

## 🎯 Recommended Workflow

### For Development:
```bash
make reload-extension  # Build + test locally
```

### For Release:
```bash
make release          # Create production package
```

### For Verification:
```bash
make validate         # Run all checks
make verify-package   # Inspect package
```

---

**Ready to release?** Run `make release` and follow the instructions! 🚀

