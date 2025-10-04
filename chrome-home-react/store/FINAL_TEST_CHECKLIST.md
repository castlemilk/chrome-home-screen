# Final Testing Checklist Before Publishing

## Load Extension for Final Test

1. **Open Chrome Extensions Page**
   ```
   chrome://extensions/
   ```

2. **Remove Previous Version** (if any)
   - Find old version
   - Click Remove

3. **Load New Build**
   - Enable Developer Mode (top right)
   - Click "Load unpacked"
   - Select the `dist` folder
   - Note the Extension ID for screenshots

4. **Test Critical Paths**
   - [ ] Open new tab - loads without errors
   - [ ] All widgets load properly
   - [ ] Drag and drop works
   - [ ] Settings save correctly
   - [ ] Search works with all engines
   - [ ] Background changes work
   - [ ] No console errors in DevTools

5. **Performance Check**
   - [ ] Open 5+ tabs simultaneously
   - [ ] Check memory usage in Task Manager
   - [ ] Verify cache is working (Network tab)

## Take Screenshots

Now with extension loaded, take your 5 screenshots:

1. **Screenshot 1: Full Dashboard**
   - Beautiful NASA background
   - Multiple widgets visible
   - Clean, professional look

2. **Screenshot 2: Widgets Close-up**
   - Weather with real data
   - Stock with charts
   - Todo with items

3. **Screenshot 3: Customization**
   - Edit mode active
   - Widget being dragged

4. **Screenshot 4: Widget Gallery**
   - Settings open
   - Widgets tab selected
   - All options visible

5. **Screenshot 5: Backgrounds**
   - Settings open
   - Appearance tab
   - NASA images visible

## Quick Screenshot Commands

```bash
# Mac: Window screenshot
Cmd + Shift + 4, then Space, click window

# Windows: Snipping Tool
Win + Shift + S

# Chrome DevTools method
1. F12 to open DevTools
2. Ctrl/Cmd + Shift + P
3. Type "screenshot"
4. Choose "Capture screenshot"
```

## Ready to Submit?

You should now have:
- ✅ chrome-extension.zip (13MB)
- ✅ 5 screenshots (1280x800px each)
- ✅ Icons (16x16, 48x48, 128x128)
- ✅ Promotional tile (440x280 minimum)
- ✅ Store listing text ready
- ✅ Privacy policy URL
- ✅ Support email