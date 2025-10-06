# Release Workflow

Quick reference for creating releases with semantic versioning.

## 🎯 Quick Commands

### Check Status
```bash
make version           # Show current version from git tag
git status            # Check uncommitted changes
git tag -l | tail -5  # List recent tags
```

### Release a Patch (Bug Fix)
```bash
make bump-patch    # 1.0.0 → 1.0.1
make tag          # Create git tag
git push --tags   # Push to remote
make release      # Build & package
```

### Release a Minor (New Feature)
```bash
make bump-minor   # 1.0.0 → 1.1.0
make tag          # Create git tag
git push --tags   # Push to remote
make release      # Build & package
```

### Release a Major (Breaking Change)
```bash
make bump-major   # 1.0.0 → 2.0.0
make tag          # Create git tag
git push --tags   # Push to remote
make release      # Build & package
```

## 📦 Package Output

Your package will be named based on the **git tag**:
```
chrome-home-extension-v1.0.0.zip
chrome-home-extension-v1.1.0.zip
chrome-home-extension-v2.0.0.zip
```

## 🔄 Complete Workflow Example

Starting from version `v1.0.0`, releasing a feature:

```bash
# 1. Work on your feature
git checkout -b feature/weather-widget
# ... make changes ...
git commit -am "Add advanced weather widget"
git checkout main
git merge feature/weather-widget

# 2. Bump version (new feature = minor)
make bump-minor
# Output: 📦 Bumping version: 1.0.0 → 1.1.0

# 3. Review changes
git diff package.json public/manifest.json

# 4. Create tag
make tag
# Output: 🏷️ Creating tag v1.1.0...

# 5. Push to remote
git push origin main
git push --tags

# 6. Build release package
make release
# Output: chrome-home-extension-v1.1.0.zip

# 7. Upload to Chrome Web Store
open https://chrome.google.com/webstore/devconsole
# Upload: chrome-home-extension-v1.1.0.zip
```

## 🏷️ Git Tag Best Practices

1. **Always use annotated tags** (automatically done by `make tag`)
2. **Include release notes** in tag message
3. **Follow semver strictly**:
   - `patch`: Bug fixes only
   - `minor`: New features (backward compatible)
   - `major`: Breaking changes

## 🚨 Troubleshooting

### Wrong version in package name?
```bash
# Check what version is being used
make version

# If git tag is wrong, delete and recreate
git tag -d v1.0.0
make tag
```

### Need to redo a release?
```bash
# Delete local tag
git tag -d v1.1.0

# Delete remote tag (careful!)
git push origin :refs/tags/v1.1.0

# Recreate
make bump-minor
make tag
git push --tags
```

### Package.json and git tag out of sync?
```bash
# Git tag is the source of truth
# Update package.json to match
node scripts/bump-version.js patch  # or minor/major
```

## 📋 Pre-Release Checklist

Before running `make release`:

- [ ] All tests pass: `npm test -- --run`
- [ ] Linter clean: `make lint`
- [ ] Changes committed
- [ ] Version bumped correctly
- [ ] Git tag created
- [ ] Tags pushed to remote

## 🎉 After Publishing

1. Create GitHub release (optional)
2. Update changelog
3. Announce to users
4. Monitor Chrome Web Store reviews
