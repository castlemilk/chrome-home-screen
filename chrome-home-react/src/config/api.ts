// API Configuration
interface ApiEndpoints {
  currentWeather: string
  forecast: string
  geocode: string
  weather: string
}

interface ApiConfig {
  WEATHER_SERVICE_URL: string
  endpoints: ApiEndpoints
}

export const API_CONFIG: ApiConfig = {
  // Weather service URL - update this after deploying to Cloud Run
  // For local development: http://localhost:8080
  // For production: https://weather-service-[hash]-uc.a.run.app
  WEATHER_SERVICE_URL: import.meta.env.VITE_WEATHER_SERVICE_URL || 'https://weather-service-fws6uj4tlq-uc.a.run.app',
  
  // API endpoints
  endpoints: {
    currentWeather: '/api/current',
    forecast: '/api/forecast',
    geocode: '/api/geocode',
    weather: '/api/weather', // Combined endpoint
  }
}

// Helper function to build API URLs
export const buildApiUrl = (
  endpoint: keyof ApiEndpoints, 
  params: Record<string, string | number | boolean | null | undefined> = {}
): string => {
  const url = new URL(`${API_CONFIG.WEATHER_SERVICE_URL}${API_CONFIG.endpoints[endpoint]}`)
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      url.searchParams.append(key, String(value))
    }
  })
  return url.toString()
}