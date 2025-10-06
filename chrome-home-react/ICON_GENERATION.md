# Icon Generation

## Overview
Chrome extensions require PNG icons, not SVG. This project uses SVG as source files and converts them to PNG during the build process.

## Files
- **Source Icons (SVG)**: `public/icons/icon16.svg`, `icon48.svg`, `icon128.svg`
- **Generated Icons (PNG)**: Auto-generated during build

## Generation

### Automatic (Recommended)
PNG icons are automatically generated during the build process:
```bash
make build
# or
npm run build
```

### Manual
Generate PNG icons only:
```bash
make icons
# or
npm run icons
```

## How It Works
1. SVG source icons are stored in `public/icons/`
2. During build, `scripts/convert-icons-to-png.js` converts them to PNG
3. Both SVG and PNG files are copied to `dist/icons/`
4. `manifest.json` references the PNG files

## Updating Icons
1. Edit the SVG files in `public/icons/` or update `scripts/generate-icons.js`
2. Run `make icons` to regenerate PNG files
3. Rebuild: `make build`

## Technical Details
- Conversion uses `sharp` library
- Maintains exact dimensions (16x16, 48x48, 128x128)
- PNG format with transparency (RGBA)
