# Chrome Home Extension - Project Documentation

## Project Structure
```
chrome-home-extension/
├── chrome-home-react/         # React application source
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── contexts/         # React contexts
│   │   ├── hooks/           # Custom hooks
│   │   ├── utils/           # Utility functions
│   │   ├── widgets/         # Widget components
│   │   ├── App.jsx          # Main app component
│   │   ├── index.css        # Main styles
│   │   └── main.jsx         # Entry point
│   ├── dist/                # Built files (loaded by Chrome)
│   ├── public/              # Static assets
│   │   └── manifest.json    # Chrome extension manifest
│   └── package.json         # Dependencies and scripts
├── images/                  # Background images
└── manifest.json           # Extension manifest (root)
```

## Important Build Commands

### Development Workflow
```bash
cd chrome-home-react

# Install dependencies
npm install

# Build for production (REQUIRED for Chrome to see changes)
npm run build

# Development server (optional, for testing)
npm run dev
```

### Critical: After ANY changes to CSS or JS files
**You MUST run `npm run build` for changes to appear in the Chrome extension!**

The Chrome extension loads from `chrome-home-react/dist/` NOT from the source files.

## Chrome Extension Installation
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `chrome-home-extension` folder (root folder)
5. The extension will load files from `chrome-home-react/dist/`

## Development Workflow
1. Make changes to files in `chrome-home-react/src/`
2. Run `npm run build` in the `chrome-home-react` directory
3. Reload the Chrome extension:
   - Go to `chrome://extensions/`
   - Click the refresh icon on the extension card
   - OR press Cmd+R on the new tab page

## Key Files
- `chrome-home-react/src/index.css` - All styling
- `chrome-home-react/src/App.jsx` - Main app logic and layout
- `chrome-home-react/src/components/SearchBar.jsx` - Search functionality
- `chrome-home-react/src/widgets/*.jsx` - Individual widget components
- `chrome-home-react/public/manifest.json` - Chrome extension configuration

## Testing
Currently no tests are configured. To add tests:
```bash
cd chrome-home-react
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom
```

## Common Issues
1. **CSS changes not showing**: Always run `npm run build` after changes
2. **Extension not updating**: Reload extension in Chrome after building
3. **Search icon overlap**: Adjust padding in `.search-input` CSS class
4. **Widgets not saving**: Check Chrome storage permissions in manifest.json

## Lint and Type Checking
Before committing, run:
```bash
npm run lint      # If configured
npm run typecheck # If TypeScript is added
```

## Performance Notes
- The built JS bundle is >500KB - consider code splitting for better performance
- Background images are optimized in `images/jwst-optimized/`
- Widgets use React Grid Layout for responsive design

## CRITICAL DEVELOPMENT RULES

### TypeScript Only
**ALWAYS use TypeScript (.ts/.tsx) for ALL new files. NEVER create .js/.jsx files.**
- Services: `.ts` files only
- Components: `.tsx` files only  
- Configuration: `.ts` files only
- Utilities: `.ts` files only

This is non-negotiable. Convert existing .js files to .ts when editing them.