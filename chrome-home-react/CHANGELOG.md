# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-01-07

### Added
- Initial release of Chrome Home Extension
- Beautiful background options (NASA Webb images, Unsplash photos, gradients)
- Customizable widget system with drag-and-drop layout
- Available widgets:
  - Weather (current conditions and forecast)
  - Stock tracker with charts
  - World clock with multiple timezones
  - Todo list with persistent storage
  - Calendar view
  - News feed
  - Search history
- Smart search bar with multiple search engines
- AI chat mode integration
- Settings panel for customization
- Responsive design for all screen sizes
- Edit mode for arranging widgets
- Chrome storage API integration for persistence
- Modern React-based architecture
- Comprehensive testing setup
- CI/CD pipelines with GitHub Actions

### Technical Features
- Built with React 19 and Vite
- Chrome Manifest V3 compliant
- ESLint and Prettier for code quality
- Vitest for testing
- Automated release process
- Optimized bundle size
- Security-focused with local storage only

### Known Issues
- Stock API may have rate limits
- Weather requires location permission for automatic detection

## [Unreleased]

### Planned
- More widget types (notes, bookmarks, crypto tracker)
- Widget size presets
- Export/import settings
- Dark/light theme toggle
- Keyboard shortcuts
- Multi-language support
- Chrome sync support for settings