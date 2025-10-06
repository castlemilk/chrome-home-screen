# Version & Package Management System

## 🎯 Overview

This extension uses **git tags with semantic versioning** for version management and package naming.

### Key Benefits
- ✅ Git tags are the single source of truth
- ✅ Package names automatically include version
- ✅ Semantic versioning enforced (MAJOR.MINOR.PATCH)
- ✅ One-command version bumping
- ✅ Automated tagging and releasing

## 📦 Package Naming

Packages are automatically named based on the **current git tag**:

```
chrome-home-extension-v0.1.0.zip  ← from git tag v0.1.0
chrome-home-extension-v1.0.0.zip  ← from git tag v1.0.0
chrome-home-extension-v2.1.3.zip  ← from git tag v2.1.3
```

No manual naming required! The Makefile extracts the version from `git describe --tags`.

## 🚀 Common Workflows

### 1. Check Current Version
```bash
make version
# Shows:
# - Current version: v0.1.0
# - Git tag: v0.1.0
# - Package.json: 1.0.0
```

### 2. Release a Bug Fix (Patch)
```bash
make bump-patch   # 1.0.0 → 1.0.1
make tag         # Create git tag v1.0.1
git push --tags  # Push to remote
make release     # Build & create chrome-home-extension-v1.0.1.zip
```

### 3. Release a New Feature (Minor)
```bash
make bump-minor  # 1.0.0 → 1.1.0
make tag         # Create git tag v1.1.0
git push --tags  # Push to remote
make release     # Build & create chrome-home-extension-v1.1.0.zip
```

### 4. Release Breaking Changes (Major)
```bash
make bump-major  # 1.0.0 → 2.0.0
make tag         # Create git tag v2.0.0
git push --tags  # Push to remote
make release     # Build & create chrome-home-extension-v2.0.0.zip
```

## 🛠️ Available Commands

### Version Management
```bash
make version      # Show current version info
make bump-patch   # Bump patch version (x.x.X)
make bump-minor   # Bump minor version (x.X.0)
make bump-major   # Bump major version (X.0.0)
make tag          # Create git tag for current version
```

### Build & Package
```bash
make icons        # Generate PNG icons from SVG
make build        # Build extension (auto-generates icons)
make package      # Build + create versioned zip
make release      # Clean + build + zip (full release)
```

### Development
```bash
make dev          # Start dev server
make clean        # Clean build artifacts
make lint         # Run linter
make test         # Run tests
```

## 📋 Complete Release Checklist

Use this checklist for every release:

```bash
# 1. Ensure everything is committed
git status

# 2. Run tests and linter
make lint
npm test -- --run

# 3. Bump version (choose appropriate level)
make bump-patch   # or bump-minor, or bump-major

# 4. Review version changes
git diff package.json public/manifest.json

# 5. Create git tag
make tag

# 6. Push to remote
git push origin main
git push --tags

# 7. Build release package
make release

# 8. Verify package
ls -lh chrome-home-extension-v*.zip
unzip -l chrome-home-extension-v*.zip | head -20

# 9. Upload to Chrome Web Store
open https://chrome.google.com/webstore/devconsole
```

## 🔧 How It Works

### Version Sources
1. **Git Tags** (primary) - Used for package naming
   ```bash
   git describe --tags --abbrev=0  # Returns: v1.0.0
   ```

2. **package.json** (fallback) - Used if no git tags exist
   ```json
   { "version": "1.0.0" }
   ```

### Makefile Logic
```makefile
# Extract version from git tag, strip 'v' prefix
VERSION := $(shell git describe --tags --abbrev=0 2>/dev/null | sed 's/^v//' || node -p "require('./package.json').version")

# Use in package name
PACKAGE_NAME := chrome-home-extension-v$(VERSION).zip
```

### Scripts
- `scripts/get-version.js` - Get version from git tag
- `scripts/bump-version.js` - Bump version in files
- `scripts/convert-icons-to-png.js` - Convert SVG icons to PNG

## 📝 Semantic Versioning Rules

Follow [semver](https://semver.org/) strictly:

### MAJOR version (X.0.0)
Breaking changes that require user action:
- Removed features
- Changed API
- Incompatible updates

### MINOR version (x.X.0)
New features, backward compatible:
- New widgets
- New settings
- Enhanced functionality

### PATCH version (x.x.X)
Bug fixes, backward compatible:
- Fixed bugs
- Performance improvements
- Small tweaks

## 🎓 Examples

### Example 1: Your First Official Release
Currently at v0.1.0, ready for v1.0.0:

```bash
# Bump to 1.0.0 (first official release)
make bump-major

# Create tag
make tag

# Push
git push && git push --tags

# Build and package
make release

# Result: chrome-home-extension-v1.0.0.zip
```

### Example 2: Adding Weather Widget
At v1.0.0, adding a new feature:

```bash
# Develop feature
git checkout -b feature/weather-widget
# ... code ...
git commit -am "Add weather widget"
git checkout main
git merge feature/weather-widget

# Bump minor (new feature)
make bump-minor  # 1.0.0 → 1.1.0
make tag
git push && git push --tags
make release

# Result: chrome-home-extension-v1.1.0.zip
```

### Example 3: Fixing a Bug
At v1.1.0, fixing a critical bug:

```bash
# Fix bug
git commit -am "Fix weather widget crash"

# Bump patch (bug fix)
make bump-patch  # 1.1.0 → 1.1.1
make tag
git push && git push --tags
make release

# Result: chrome-home-extension-v1.1.1.zip
```

## 🚨 Troubleshooting

### Package has wrong version?
```bash
# Check version sources
make version

# If git tag is wrong, delete and recreate
git tag -d v1.0.0
make bump-major  # or appropriate version
make tag
```

### Need to redo a release?
```bash
# Delete local tag
git tag -d v1.1.0

# Delete remote tag (BE CAREFUL!)
git push origin :refs/tags/v1.1.0

# Recreate
make bump-minor  # or appropriate version
make tag
git push --tags
```

### Files not updating?
```bash
# Manually sync if needed
node scripts/bump-version.js patch
make tag
```

## 📚 Related Documentation

- `VERSIONING.md` - Detailed versioning guide
- `RELEASE_WORKFLOW.md` - Step-by-step release process
- `ICON_GENERATION.md` - Icon generation process
- `BUILD_AND_RELEASE.md` - Build instructions

## 🎉 Summary

With this system:
1. **No manual version editing** - Scripts handle it
2. **No manual package naming** - Git tags control it
3. **Clear history** - Git tags show all releases
4. **Professional workflow** - Industry-standard semver

Just run:
```bash
make bump-patch && make tag && git push --tags && make release
```

And you're done! 🚀
