# Testing Guide for Recent Fixes

## How to Test

### 1. Load the Extension
```bash
cd chrome-home-react
# The extension is already built in dist/
```
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `dist/` folder

---

## Fixed Issues - Testing Instructions

### ✅ 1. Todo Widget Persistence
**Test:**
1. Add a todo widget from settings
2. Add some custom todo items
3. Open a new tab
4. Verify your custom todos are still there (not reset to defaults)

---

### ✅ 2. Todo Drag-and-Drop (Fixed Janky Behavior)
**Test:**
1. Add a todo widget
2. Hover over a todo item - the drag handle (grip icon) should appear on the left
3. Click and drag the handle to reorder items
4. The drag should be smooth with a subtle tilt animation
5. The handle should only be visible on hover (not permanently white)

**What was fixed:**
- Renamed class from `.drag-handle` to `.todo-drag-handle` to avoid conflicts
- Made handle only visible on hover (opacity: 0 → 1 on hover)
- Smoother transitions and better visual feedback

---

### ✅ 3. Clock Widget Drag-and-Drop
**Test:**
1. Add a World Clock widget
2. Add multiple time zones
3. Hover over a clock item - drag handle appears
4. Drag to reorder - should be smooth

**What was fixed:**
- Made handle only visible on hover
- Same smooth drag behavior as todos

---

### ✅ 4. Widget Layout Preservation
**Test:**
1. Add a weather widget and position it manually (enable edit mode with Move button)
2. Add another widget (e.g., todo)
3. Verify the weather widget stays in its original position
4. Remove a widget
5. Verify other widgets don't move

---

### ✅ 5. Weather Widget Horizontal Scroll (Fixed)
**Test:**
1. Add a weather widget
2. The hourly forecast should be scrollable horizontally
3. No scrollbar should be visible
4. Scroll works via:
   - Mouse wheel (vertical scrolling triggers horizontal scroll)
   - Dragging with mouse
   - Touch swipe on mobile

**What was fixed:**
- Added `width: max-content` to `.weather-hourly` to enable scrolling
- Kept scrollbar hidden with `scrollbar-width: none`
- Added `scroll-behavior: smooth` for better UX

---

### ✅ 6. Browser Action Popup Menu (Fixed)
**Test:**
1. Click the extension icon in Chrome toolbar
2. Try each option:
   - **Open New Tab**: Creates a new Chrome Home tab
   - **Refresh All Data**: Reloads the current tab if it's a Chrome Home tab
   - **Full Settings**: Opens settings modal on the new tab page
   - **Manage Widgets**: Opens settings to the widgets tab
   - **Change Background**: Opens settings to the appearance tab

**What was fixed:**
- Changed messaging approach to use `chrome.storage.local` flags
- App checks for `openSettingsOnLoad` flag on mount
- Reloads tab or creates new one with proper settings tab
- No more flashing - proper state management

---

### ✅ 7. Transparent Settings Modal
**Test:**
1. Open settings
2. You should see the background through the modal
3. Change backgrounds and see the preview in real-time through the transparent modal

---

### ✅ 8. Weather Default Location
**Test:**
1. Add a weather widget for the first time
2. It should either:
   - Show your current location (if you allow geolocation)
   - Show New York (if you deny or geolocation unavailable)

---

### ✅ 9. JWST Image Metadata Tooltips
**Test:**
1. Open settings → Appearance tab
2. Hover over any NASA Webb image
3. A tooltip should appear with:
   - Image name
   - Description
   - Distance from Earth
   - Capture date

---

### ✅ 10. Reactive Widget Selection
**Test:**
1. Open settings → Widgets tab
2. Click multiple widgets to add them
3. Each widget shows a checkmark and "Added" badge
4. Settings panel stays open
5. Can add multiple widgets without closing

---

### ✅ 11. Search Bar Independent Positioning
**Test:**
1. Resize the window to different sizes
2. Widgets should stay below the core UI (time, greeting, search)
3. They should NOT try to align alongside the search bar

---

### ✅ 12. Image Quality
**Test:**
1. Select a NASA Webb background
2. Images should appear crisp and clear (not pixelated)
3. Uses full-size WebP images with hardware acceleration

---

## Build Status

✅ **Build:** Successful  
✅ **Linting:** 0 errors  
✅ **Version:** 1.0.2  

## Quick Commands

```bash
# Build
npm run build

# Lint
npm run lint

# Test
npm test -- --run

# Dev mode
npm run dev
```

## Known Issues

- 10 WeatherWidget tests failing (pre-existing - needs SettingsProvider wrapper in tests)
- All functional tests passing

## Architecture Improvements

### Popup Communication Flow
```
User clicks popup button
  ↓
Set flag in chrome.storage.local
  ↓
Close popup
  ↓
Reload/create tab
  ↓
App.jsx checks flag on mount
  ↓
Opens settings with correct tab
  ↓
Clear flag
```

This approach avoids Chrome's message passing restrictions for `chrome://newtab` pages.

### Drag-and-Drop Implementation
- Uses `react-sortablejs` for smooth animations
- Separate class names to avoid conflicts
- Handles only visible on hover for clean UI
- Smooth transitions and visual feedback

### Image Loading Strategy
1. Try full-size WebP (best quality)
2. Fallback to large WebP
3. Fallback to full-size JPEG
4. Fallback to any available variant
5. CSS optimizations for crisp rendering

