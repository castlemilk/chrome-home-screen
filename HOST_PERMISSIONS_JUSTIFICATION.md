# Host Permissions Justification for Chrome Web Store Review

## Required Permissions

### 1. `https://weather-service-*.run.app/*`
**Purpose**: Weather Widget Functionality
**Justification**: 
- This is our own backend service hosted on Google Cloud Run
- Required to fetch weather data and forecasts for the weather widget
- The service acts as a proxy to aggregate weather data from multiple sources
- Handles authentication and rate limiting to protect API keys
- No user data is collected or stored

### 2. `https://openrouter.ai/api/*` (if included)
**Purpose**: AI Chat Assistant
**Justification**:
- Enables the built-in AI chat feature
- Allows users to get instant answers without leaving their new tab
- API calls are only made when user explicitly uses the chat feature
- No automatic or background requests
- Chat history is stored locally only

### 3. `https://maps.googleapis.com/*` (if included)
**Purpose**: Location Services for Weather
**Justification**:
- Used only for geocoding user-entered locations for weather widget
- Converts city names to coordinates for weather API
- Only triggered when user searches for a new location
- No automatic location detection or tracking

## Why These Permissions Are Essential

1. **Core Functionality**: The weather widget is a primary feature advertised in our extension. Without these permissions, the widget cannot function.

2. **User Experience**: Users expect real-time weather data. Using our backend service ensures:
   - Fast, reliable data delivery
   - No API key exposure in client code
   - Protection against rate limiting
   - Consistent data format

3. **Privacy Protection**: By using our own backend service:
   - We don't inject scripts into web pages
   - We don't track browsing history
   - We only make API calls for specific widget features
   - All requests are scoped to our new tab page only

## Security Measures

1. **Minimal Permission Scope**: We only request access to our own backend service and specific API endpoints needed for features

2. **No Broad Host Permissions**: We do NOT request:
   - `<all_urls>`
   - `*://*/*`
   - Access to user's browsing data
   - Access to other websites

3. **User-Initiated Actions**: API calls are only made when:
   - User opens a new tab (weather update)
   - User clicks refresh on weather widget
   - User interacts with AI chat
   - User searches for a location

4. **Transparent Code**: 
   - All network requests are clearly visible in our source code
   - No obfuscated or minified request logic
   - Clear function names indicating purpose

## Alternative Considerations

We considered alternatives but they compromise user experience:

1. **Embedding API Keys**: Would expose keys to users and risk abuse
2. **Making Users Provide Keys**: Too complex for average users
3. **Using only client-side APIs**: Limited data and CORS issues
4. **Static Data**: Would defeat the purpose of real-time widgets

## Data Handling

- **No Personal Data Collection**: We don't collect, store, or transmit personal information
- **No Analytics**: No Google Analytics, tracking pixels, or telemetry
- **Local Storage Only**: User preferences stored in Chrome's local storage
- **No External Sharing**: Data fetched is only displayed to the user

## Review Notes

1. The extension works primarily on the new tab page only
2. All network requests are for widget data, not user tracking
3. The backend service code can be reviewed at: [GitHub repo link]
4. We're happy to provide additional documentation or clarification
5. We can demonstrate that the service only returns weather/location data

## Contact for Review

If you need any clarification during review:
- Email: [your email]
- GitHub: [repo link]
- Documentation: [docs link]

We're committed to maintaining user privacy and following Chrome Web Store policies. The host permissions requested are the minimum required to deliver the core features our users expect.

---

## Sample Response for Reduced Permissions

If requested to reduce permissions, we can:
1. Make the weather widget optional (enable via settings)
2. Add a fallback to require users to input API keys
3. Remove AI chat feature if necessary
4. Provide a "lite" version without external API features

However, this would significantly impact the user experience and the core value proposition of the extension.