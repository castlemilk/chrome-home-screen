# Chrome Home Extension

A beautiful, customizable Chrome new tab extension with widgets, stunning backgrounds, and a clean interface.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Chrome](https://img.shields.io/badge/Chrome-Extension-yellow)

## Features

- 🎨 **Beautiful Backgrounds**: Choose from NASA Webb telescope images, Unsplash photos, or gradient backgrounds
- 🧩 **Customizable Widgets**: Add weather, stocks, world clock, todo lists, calendar, news, and more
- 🔍 **Smart Search Bar**: Integrated search with multiple search engines and AI chat mode
- 📱 **Responsive Design**: Works beautifully on all screen sizes
- 🎯 **Drag & Drop Layout**: Arrange widgets exactly how you want them
- 🌙 **Clean Interface**: Minimalist design that doesn't get in your way
- 💾 **Persistent Storage**: Your settings and widgets are saved automatically

## Installation

### From Source (Development)

1. Clone the repository:
```bash
git clone https://github.com/yourusername/chrome-home-extension.git
cd chrome-home-extension/chrome-home-react
```

2. Install dependencies:
```bash
npm install --legacy-peer-deps
```

3. Build the extension:
```bash
npm run build
```

4. Load in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked"
   - Select the `dist` folder

### From Release

1. Download the latest release from [Releases](https://github.com/yourusername/chrome-home-extension/releases)
2. Extract the ZIP file
3. Follow step 4 from above

## Development

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Chrome browser

### Setup

```bash
# Install dependencies
npm install --legacy-peer-deps

# Start development server
npm run dev

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format
```

### Building

```bash
# Development build
npm run build

# Production build with zip
npm run build:prod

# Create release package
npm run release
```

### Project Structure

```
chrome-home-react/
├── src/
│   ├── components/       # React components
│   ├── contexts/         # React contexts
│   ├── hooks/           # Custom hooks
│   ├── utils/           # Utility functions
│   ├── widgets/         # Widget components
│   ├── App.jsx          # Main app component
│   ├── main.jsx         # Entry point
│   └── index.css        # Global styles
├── public/
│   ├── images/          # Background images
│   └── manifest.json    # Extension manifest
├── scripts/             # Build and release scripts
├── dist/               # Build output
└── package.json        # Dependencies and scripts
```

## Available Widgets

### Weather Widget
- Current conditions and forecast
- Location-based or custom location
- Celsius/Fahrenheit toggle

### Stock Tracker
- Real-time stock prices
- Multiple symbols support
- Interactive charts

### World Clock
- Multiple timezone support
- Customizable cities
- 12/24 hour format

### Todo List
- Multiple lists
- Persistent storage
- Drag to reorder

### Calendar
- Monthly/weekly view
- Event integration
- Clean design

### News Feed
- Multiple news sources
- Category filtering
- Latest headlines

### Search History
- Recent searches with favicons
- Quick access
- Privacy-focused (local storage only)

## Configuration

### Customizing Backgrounds

1. Click the Settings button (⚙️) in the top right
2. Navigate to the "Appearance" tab
3. Choose from:
   - Gradient backgrounds
   - NASA Webb telescope images
   - Unsplash photos (various categories)

### Managing Widgets

1. Click the Settings button
2. Go to the "Widgets" tab
3. Click on any widget to add it to your home screen
4. Use Edit Mode (grid icon) to rearrange widgets

### Personalization

1. Open Settings → General
2. Set your name for personalized greetings
3. Choose your default search engine

## Testing

```bash
# Run tests
npm test

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Style

- We use ESLint and Prettier for code formatting
- Run `npm run lint:fix` to auto-fix issues
- Run `npm run format` to format code

## Deployment

### Manual Release

1. Update version in `manifest.json`
2. Run `npm run release`
3. Upload the generated ZIP to Chrome Web Store

### Automated Release

Push a tag to trigger automatic release:

```bash
git tag v1.0.1
git push origin v1.0.1
```

## Privacy

This extension:
- ✅ Stores all data locally using Chrome's storage API
- ✅ Does not collect any personal information
- ✅ Does not track user behavior
- ✅ Makes API calls only for weather and stock data
- ✅ All settings remain on your device

## License

MIT License - see [LICENSE](LICENSE) file for details

## Support

- 🐛 [Report bugs](https://github.com/yourusername/chrome-home-extension/issues)
- 💡 [Request features](https://github.com/yourusername/chrome-home-extension/issues)
- 📧 Contact: your.email@example.com

## Acknowledgments

- NASA/ESA/CSA James Webb Space Telescope images
- Unsplash for beautiful photography
- All open source contributors

---

Made with ❤️ by Ben Ebsworth