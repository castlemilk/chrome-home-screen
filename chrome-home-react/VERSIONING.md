# Versioning & Release Guide

This project uses **Git tags** with semantic versioning (semver) for releases.

## Version Format
`MAJOR.MINOR.PATCH` (e.g., `1.2.3`)

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

## Quick Start

### Check Current Version
```bash
make version
# Shows: git tag version, package.json version, and current version used for builds
```

### Bump Version

#### Patch Release (bug fixes)
```bash
make bump-patch
# 1.0.0 → 1.0.1
```

#### Minor Release (new features)
```bash
make bump-minor
# 1.0.0 → 1.1.0
```

#### Major Release (breaking changes)
```bash
make bump-major
# 1.0.0 → 2.0.0
```

### Create Git Tag
After bumping, create the git tag:
```bash
make tag
# Creates tag and commits version changes
```

### Full Release Workflow
```bash
# 1. Bump version (choose one)
make bump-patch   # or bump-minor, or bump-major

# 2. Create tag and commit
make tag

# 3. Push to remote
git push && git push --tags

# 4. Build and package
make release

# Result: chrome-home-extension-vX.Y.Z.zip
```

## Package Naming

The build system automatically uses the **git tag version** for package names:
```
chrome-home-extension-v0.1.0.zip  (from git tag v0.1.0)
chrome-home-extension-v1.0.0.zip  (from git tag v1.0.0)
```

## Version Priority

1. **Git Tag** (primary) - Used for package naming
2. **package.json** (fallback) - Used if no git tags exist

## Example: Complete Release

```bash
# Starting at v1.0.0, adding new features

# 1. Make your changes and commit
git add .
git commit -m "Add weather widget"

# 2. Bump version to 1.1.0 (minor - new feature)
make bump-minor
# Updates: package.json, manifest.json

# 3. Create tag
make tag
# Creates: v1.1.0 tag
# Commits: version file changes

# 4. Push everything
git push && git push --tags

# 5. Build release package
make release
# Creates: chrome-home-extension-v1.1.0.zip

# 6. Upload to Chrome Web Store
open https://chrome.google.com/webstore/devconsole
```

## Available Make Commands

```bash
make version      # Show current version info
make bump-patch   # Bump patch version
make bump-minor   # Bump minor version  
make bump-major   # Bump major version
make tag          # Create git tag
make build        # Build extension
make package      # Build + create zip
make release      # Clean + build + zip
```

## NPM Scripts

```bash
npm run version        # Get version from git tag
npm run bump:patch     # Bump patch version
npm run bump:minor     # Bump minor version
npm run bump:major     # Bump major version
```

## Notes

- Always use `make tag` or `git tag -a` (annotated tags)
- Tags should always start with `v` (e.g., `v1.0.0`)
- The Makefile automatically strips the `v` prefix for package names
- After tagging, always push tags: `git push --tags`
