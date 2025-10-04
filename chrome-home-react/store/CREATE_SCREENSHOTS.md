# Screenshot Creation Guide

## Required Screenshots (1280x800px)

### Screenshot 1: Hero Shot
1. Open the extension in Chrome
2. Set a NASA background (preferably Tarantula Nebula - most colorful)
3. Add these widgets in view:
   - Weather (top left)
   - Stocks (top right)
   - Todo (bottom left)
   - World Clock (bottom right)
4. Make sure time display and search bar are centered
5. Take screenshot at 1280x800

### Screenshot 2: Widget Close-up
1. Zoom in on 2-3 widgets
2. Show real data (weather with forecast, stocks with charts)
3. Ensure high contrast and readability

### Screenshot 3: Edit Mode
1. Enable edit mode
2. Show a widget being dragged
3. Make the grid lines visible
4. Show the drag handles

### Screenshot 4: Settings Panel
1. Open settings
2. Show the Widgets tab
3. Display all available widgets
4. Ensure the UI is clean and visible

### Screenshot 5: Background Gallery
1. Open settings
2. Go to Appearance tab
3. Show the NASA images or gradient selection
4. Make the variety visible

## How to Take Screenshots

### Method 1: Chrome DevTools (Recommended)
```bash
1. Open your extension in Chrome
2. Press F12 to open DevTools
3. Press Ctrl+Shift+P (Cmd+Shift+P on Mac)
4. Type "Capture screenshot"
5. Choose "Capture full size screenshot"
6. Resize in image editor to exactly 1280x800
```

### Method 2: Browser Window
```bash
1. Set browser window to 1280x800
2. Use Chrome extension: "Window Resizer"
3. Or use: window.resizeTo(1280, 800) in console
4. Take screenshot with OS tool
```

### Method 3: Using Playwright (Automated)
```javascript
// We can automate this with Playwright
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 }
  });
  
  await page.goto('chrome-extension://YOUR_EXTENSION_ID/index.html');
  await page.screenshot({ 
    path: 'screenshot1.png',
    fullPage: false 
  });
  
  await browser.close();
})();
```

## Adding Text Overlays

Use any image editor (or online tool like Canva):

### For each screenshot add:
- **Top left**: Feature callout (e.g., "Stunning NASA Backgrounds")
- **Font**: Inter or system font, 32-48px, white with shadow
- **Style**: Minimal, clean, professional

### Text for each screenshot:
1. "Transform Your New Tab"
2. "Powerful Widgets"  
3. "Drag & Drop Customization"
4. "Add Widgets Instantly"
5. "Beautiful Backgrounds"

## Quick Terminal Commands

```bash
# Install screenshot tool if needed (Mac)
brew install --cask shottr

# Or use built-in Mac screenshot
cmd + shift + 4, then space to capture window

# Resize images with ImageMagick
convert input.png -resize 1280x800! screenshot1.png

# Add text overlay with ImageMagick
convert screenshot1.png \
  -pointsize 48 \
  -fill white \
  -stroke black \
  -strokewidth 2 \
  -font Inter-Bold \
  -gravity northwest \
  -annotate +50+50 "Transform Your New Tab" \
  screenshot1-final.png
```