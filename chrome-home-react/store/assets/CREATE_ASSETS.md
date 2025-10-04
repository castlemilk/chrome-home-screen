# Chrome Web Store Asset Requirements

## Required Assets

### 1. Store Icon (128x128px)
- High-quality PNG
- No transparency in main area
- Clear, recognizable design
- Already created: `public/icons/icon128.svg` (convert to PNG)

### 2. Screenshots (1280x800px or 640x400px)
**Required: Minimum 1, Maximum 5**

#### Screenshot 1: Hero Shot
- Full interface with widgets
- Beautiful NASA background
- All widgets visible
- Title overlay: "Transform Your New Tab"

#### Screenshot 2: Widget Showcase
- Close-up of weather, stocks, and todo widgets
- Show real data
- Title overlay: "Powerful Widgets"

#### Screenshot 3: Customization
- Edit mode active
- Dragging a widget
- Title overlay: "Drag & Drop Customization"

#### Screenshot 4: Background Options
- Settings panel open
- Background gallery visible
- Title overlay: "Stunning Backgrounds"

#### Screenshot 5: Search Features
- Search bar focused
- AI chat mode
- Title overlay: "Smart Search & AI Chat"

### 3. Promotional Images

#### Small Promo Tile (440x280px)
- Logo centered
- Tagline: "Beautiful New Tab & Widgets"
- Gradient background
- Call-to-action

#### Large Promo Tile (920x680px) [Optional]
- Split view showing before/after
- Multiple features highlighted
- Professional design

#### Marquee Promo Tile (1400x560px) [Optional]
- Panoramic view of the extension
- Feature list on the side
- Premium feel

## Screenshot Creation Script

```bash
# Take screenshots using Chrome DevTools
1. Open extension in Chrome
2. Open DevTools (F12)
3. Toggle device toolbar (Ctrl+Shift+M)
4. Set dimensions to 1280x800
5. Take screenshots in different states
6. Add text overlays in image editor
```

## Color Palette for Marketing
- Primary: #667eea (Purple)
- Secondary: #764ba2 (Deep Purple)
- Accent: #f5576c (Pink)
- Text: #ffffff (White)
- Dark: #1a1a2e (Navy)

## Text Overlay Guidelines
- Font: System UI or Inter
- Size: 48-72px for titles
- Add subtle shadow for readability
- Position in top-left or bottom-left
- Keep text minimal and impactful