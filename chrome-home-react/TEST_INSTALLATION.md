# Testing Extension Installation

## 🚨 The Problem

**"Load unpacked"** (development mode) is more permissive than actual installation:
- ✅ Allows SVG icons (shouldn't, but does)
- ✅ Skips some manifest validation
- ✅ Doesn't compress/optimize files
- ❌ **Not representative of Chrome Web Store installation**

## ✅ Proper Testing Workflow

### Method 1: Test with Packed Extension (.crx)

This is the **closest to actual CWS installation**:

```bash
# 1. Build the extension
make build

# 2. Create a packed extension
# Go to chrome://extensions/
# Enable "Developer mode"
# Click "Pack extension"
#   Root directory: /path/to/chrome-home-react/dist
#   Private key: (leave empty for first time)
# Click "Pack Extension"

# 3. Install the .crx file
# Drag and drop the generated .crx file into chrome://extensions/
```

**Automated version:**
```bash
# Create packed extension via command line
make pack-extension
```

### Method 2: Test from ZIP (Mimics CWS)

```bash
# 1. Build and create zip
make package

# 2. Unzip to a temporary location
mkdir -p /tmp/test-extension
unzip -o chrome-home-extension-v*.zip -d /tmp/test-extension

# 3. Load from temporary location
# chrome://extensions/
# Load unpacked → select /tmp/test-extension

# 4. Clean up
rm -rf /tmp/test-extension
```

**Automated version:**
```bash
make test-install
```

### Method 3: Full Installation Simulation

```bash
# Complete workflow that catches issues
make test-package
```

## 🛠️ New Make Targets

I'll add these to your Makefile:

### `make pack-extension`
Creates a .crx file (Chrome's packed format)

### `make test-install`
Simulates Chrome Web Store installation from ZIP

### `make test-package`
Full test including manifest validation, icon checks, and package integrity

### `make verify-icons`
Specifically checks that all icons are valid PNG files

## 📋 Pre-Release Test Checklist

Before uploading to Chrome Web Store, run:

```bash
# 1. Verify icons are PNG
make verify-icons

# 2. Validate manifest
make validate

# 3. Test packed extension
make pack-extension
# Then drag .crx to chrome://extensions/

# 4. Test from ZIP
make test-install

# 5. Full package test
make test-package
```

## 🔍 What to Check

### Icon Validation
```bash
# Check file types
file dist/icons/icon*.png
# Should show: PNG image data

# Check dimensions
sips -g pixelWidth -g pixelHeight dist/icons/icon16.png
sips -g pixelWidth -g pixelHeight dist/icons/icon48.png
sips -g pixelWidth -g pixelHeight dist/icons/icon128.png
```

### Manifest Validation
```bash
# Check manifest references only .png icons
grep -E "icon.*\.svg" dist/manifest.json
# Should return nothing

grep -E "icon.*\.png" dist/manifest.json
# Should show all icon references
```

## 🚀 Automated Testing Workflow

### Quick Test (30 seconds)
```bash
make test-install
```

### Full Test (2 minutes)
```bash
make test-package
```

### Manual Verification
1. Build: `make build`
2. Go to: `chrome://extensions/`
3. Remove existing unpacked version
4. Pack extension: Click "Pack extension" → Select `dist` folder
5. Install .crx: Drag the .crx file into Chrome
6. Verify: Icons load, extension works

## 🎯 Best Practice: Test Before Each Release

```bash
# Your release workflow should include:
make bump-patch              # Bump version
make tag                     # Create tag
make test-package           # TEST BEFORE RELEASING! ⚠️
git push && git push --tags
make release
```

## 📊 Differences: Unpacked vs Packed vs CWS

| Feature | Unpacked | Packed (.crx) | Chrome Web Store |
|---------|----------|---------------|------------------|
| Icon validation | Lenient | Strict | Strictest |
| Manifest check | Basic | Full | Full + Security |
| Permissions | Dev mode | Normal | User consent |
| CSP enforcement | Relaxed | Strict | Strict |
| Auto-updates | No | No | Yes |

## 💡 Tips

1. **Always test packed extension** before uploading to CWS
2. **Use temporary location** for testing to avoid conflicts
3. **Clear extension data** between tests
4. **Check console errors** in chrome://extensions/
5. **Test on fresh Chrome profile** to catch permission issues

## 🐛 Common Issues Caught by Packed Testing

- ✅ SVG icons (not supported)
- ✅ Invalid manifest references
- ✅ Missing files
- ✅ Incorrect permissions
- ✅ CSP violations
- ✅ File size issues
