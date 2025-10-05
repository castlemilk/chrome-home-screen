import { useState, useEffect, useRef } from 'react'
import { 
  Sun, Cloud, CloudRain, CloudSnow, CloudLightning, CloudDrizzle, 
  CloudFog, Wind, Droplets, MapPin, Thermometer, Eye, Gauge,
  Sunrise, Sunset, Moon, CloudHail, Tornado, AlertTriangle,
  Umbrella, CloudOff
} from 'lucide-react'
import cacheService, { CacheConfig } from '../services/cache'
import { buildApiUrl } from '../config/api'
import { useSettings } from '../contexts/SettingsContext'
import authService from '../services/auth'
import '../weather-expandable.css'

const GoogleWeatherWidget = ({ config, onConfigUpdate, isConfigMode }) => {
  const { settings } = useSettings()
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(true)
  const [locationSearch, setLocationSearch] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [searchTimeout, setSearchTimeout] = useState(null)
  const [expandedView, setExpandedView] = useState(false)
  const [expandedDay, setExpandedDay] = useState(null) // Only one day can be expanded
  const [expandedHours, setExpandedHours] = useState(new Set())
  const [setLastRefresh] = useState(null)
  const hourlyScrollRef = useRef(null)
  const isGeocodingRef = useRef(false)
  const widgetContainerRef = useRef(null)
  
  // Save UI state to cache
  const saveUIState = async (newState) => {
    const stateToSave = {
      expandedView: newState.expandedView ?? expandedView,
      expandedDay: newState.expandedDay ?? expandedDay,
      expandedHours: newState.expandedHours ? Array.from(newState.expandedHours) : Array.from(expandedHours),
      locationId: config.placeId || `${config.lat},${config.lon}`
    }
    
    try {
      await cacheService.set(
        `${CacheConfig.WEATHER_UI_STATE.key}_${stateToSave.locationId}`, 
        stateToSave
      )
    } catch (error) {
      console.warn('Failed to save weather UI state:', error)
    }
  }

  // Load UI state from cache
  const loadUIState = async () => {
    if (!config.lat || !config.lon) return
    
    const locationId = config.placeId || `${config.lat},${config.lon}`
    try {
      const cachedState = await cacheService.get(
        `${CacheConfig.WEATHER_UI_STATE.key}_${locationId}`,
        CacheConfig.WEATHER_UI_STATE.maxAge
      )
      
      if (cachedState) {
        setExpandedView(cachedState.expandedView || false)
        setExpandedDay(cachedState.expandedDay || null)
        setExpandedHours(new Set(cachedState.expandedHours || []))
      }
    } catch (error) {
      console.warn('Failed to load weather UI state:', error)
    }
  }

  // Toggle expanded state for a specific day (only one at a time)
  const toggleDayExpanded = (dayIndex) => {
    const newExpandedDay = expandedDay === dayIndex ? null : dayIndex
    setExpandedDay(newExpandedDay)
    saveUIState({ expandedDay: newExpandedDay })
  }
  
  // Toggle expanded state for a specific hour
  const toggleHourExpanded = (hourIndex) => {
    setExpandedHours(prev => {
      const newSet = new Set(prev)
      if (newSet.has(hourIndex)) {
        newSet.delete(hourIndex)
      } else {
        newSet.add(hourIndex)
      }
      saveUIState({ expandedHours: newSet })
      return newSet
    })
  }

  // Toggle current weather expanded view
  const toggleExpandedView = () => {
    const newExpandedView = !expandedView
    setExpandedView(newExpandedView)
    saveUIState({ expandedView: newExpandedView })
  }
  // Handle horizontal scroll with mouse wheel
  useEffect(() => {
    const scrollContainer = hourlyScrollRef.current
    if (!scrollContainer) return
    
    const handleWheel = (e) => {
      // Only handle horizontal scrolling if not clicking
      if (e.deltaY !== 0 && !e.target.closest('.hourly-item')) {
        e.preventDefault()
        scrollContainer.scrollLeft += e.deltaY
      }
    }
    
    scrollContainer.addEventListener('wheel', handleWheel, { passive: false })
    return () => scrollContainer.removeEventListener('wheel', handleWheel)
  }, [weather])
  

  // Weather icon component - use Google's actual icons
  const WeatherIcon = ({ iconUri, condition, size = 48, className = '', isDark = false }) => {
    // If we have a Google icon URI, use it
    if (iconUri) {
      const theme = isDark ? '_dark' : ''
      const iconUrl = `${iconUri}${theme}.svg`
      return (
        <img 
          src={iconUrl} 
          alt={condition || 'Weather'}
          className={`weather-icon-img ${className}`}
          style={{ width: size, height: size }}
        />
      )
    }
    
    // Fallback to Lucide icons based on condition type
    const iconProps = { size, className: `weather-icon-svg ${className}` }
    
    if (!condition) return <Cloud {...iconProps} />
    
    switch(condition) {
      case 'CLEAR':
      case 'MOSTLY_CLEAR':
        return <Sun {...iconProps} />
      case 'PARTLY_CLOUDY':
        return <Cloud {...iconProps} />  // Using Cloud icon as fallback
      case 'MOSTLY_CLOUDY':
      case 'CLOUDY':
        return <Cloud {...iconProps} />
      case 'LIGHT_RAIN':
      case 'LIGHT_RAIN_SHOWERS':
      case 'RAIN_SHOWERS':
      case 'RAIN':
      case 'MODERATE_TO_HEAVY_RAIN':
      case 'HEAVY_RAIN':
        return <CloudRain {...iconProps} />
      case 'LIGHT_SNOW':
      case 'SNOW_SHOWERS':
      case 'SNOW':
      case 'HEAVY_SNOW':
        return <CloudSnow {...iconProps} />
      case 'HAIL':
      case 'HAIL_SHOWERS':
        return <CloudHail {...iconProps} />
      case 'THUNDERSTORM':
      case 'THUNDERSHOWER':
      case 'HEAVY_THUNDERSTORM':
        return <CloudLightning {...iconProps} />
      case 'WINDY':
        return <Wind {...iconProps} />
      default:
        return <Cloud {...iconProps} />
    }
  }

  // Search for locations using the microservice
  const searchLocations = async (query) => {
    if (query.length < 2) {
      setSuggestions([])
      return
    }

    try {
      const url = buildApiUrl('geocode', { address: query })
      const response = await authService.authenticatedFetch(url)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.results && data.results.length > 0) {
        setSuggestions(data.results.slice(0, 5).map(result => ({
          name: result.formatted_address,
          value: result.address_components[0]?.long_name || result.formatted_address,
          lat: result.geometry.location.lat,
          lon: result.geometry.location.lng,
          placeId: result.place_id
        })))
      } else {
        setSuggestions([])
      }
    } catch (error) {
      console.error('Location search error:', error)
      setSuggestions([])
    }
  }

  // Handle location search with debounce
  const handleLocationSearch = (value) => {
    setLocationSearch(value)
    
    if (searchTimeout) clearTimeout(searchTimeout)
    
    const timeout = setTimeout(() => {
      searchLocations(value)
    }, 300)
    
    setSearchTimeout(timeout)
  }

  // Select location
  const selectLocation = (location) => {
    onConfigUpdate({
      ...config,
      location: location.value,
      lat: location.lat,
      lon: location.lon,
      placeId: location.placeId
    })
    setLocationSearch('')
    setSuggestions([])
  }

  // Fetch weather data using the microservice with caching
  const fetchWeather = async (forceRefresh = false) => {
    if (!config.lat || !config.lon) {
      // If no coordinates, try to get them from location name
      if (config.location && !isGeocodingRef.current) {
        try {
          isGeocodingRef.current = true // Set flag to prevent multiple geocoding attempts
          const geoUrl = buildApiUrl('geocode', { address: config.location })
          const geoResponse = await authService.authenticatedFetch(geoUrl)
          const geoData = await geoResponse.json()
          if (geoData.results && geoData.results[0]) {
            onConfigUpdate({
              ...config,
              lat: geoData.results[0].geometry.location.lat,
              lon: geoData.results[0].geometry.location.lng
            })
            // Don't reset flag here - let the component unmount or location change reset it
            return // Will trigger re-fetch with coordinates
          }
          isGeocodingRef.current = false // Reset flag if geocoding failed
        } catch (error) {
          console.error('Geocoding error:', error)
          isGeocodingRef.current = false // Reset flag on error
        }
      }
      setLoading(false)
      return
    }
    
    // Reset geocoding flag when we have coordinates
    isGeocodingRef.current = false

    try {
      setLoading(true)
      
      // Check cache first - request only next 24 hours for hourly forecast
      const weatherUrl = buildApiUrl('weather', { 
        lat: config.lat, 
        lon: config.lon,
        hours: 24 // Limit hourly forecast to next 24 hours only
      })
      const cacheKey = cacheService.getCacheKey(weatherUrl)
      
      let data
      if (!forceRefresh) {
        data = await cacheService.get(cacheKey, CacheConfig.WEATHER.maxAge)
      }
      
      if (!data) {
        // Fetch fresh data with timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
        
        try {
          const response = await authService.authenticatedFetch(weatherUrl, {
            signal: controller.signal
          })
          clearTimeout(timeoutId)
          
          if (!response.ok) {
            const errorText = await response.text()
            console.error('Weather API error:', response.status, errorText)
            throw new Error(`Weather API error: ${response.status} - ${errorText}`)
          }
          data = await response.json()
        } catch (error) {
          clearTimeout(timeoutId)
          if (error.name === 'AbortError') {
            console.error('Weather API request timed out')
            throw new Error('Weather request timed out')
          }
          throw error
        }
        
        // Add timestamp to fresh data
        data.lastUpdated = new Date().toISOString()
        
        // Cache the data with timestamp
        await cacheService.set(cacheKey, data)
      }
      const currentData = data.current
      const forecastData = data.forecast
      
      // Process current weather from actual API response
      const current = currentData
      
      // Process hourly forecast (if available) - Next 24 hours from now
      let hourly = []
      if (forecastData && forecastData.hourly && Array.isArray(forecastData.hourly)) {
        const now = new Date()
        const currentTime = now.getTime()
        const next24Hours = currentTime + (24 * 60 * 60 * 1000) // 24 hours from now
        
        // Filter and process only future hours (from now to next 24 hours)
        const currentHour = now.getHours()
        const futureHours = forecastData.hourly
          .map((hour) => {
            const date = new Date(hour.timestamp || hour.time)
            return {
              ...hour,
              parsedDate: date,
              timestamp: date.getTime()
            }
          })
          .filter(hour => {
            // Include current hour and all future hours within next 24 hours
            return hour.timestamp >= currentTime - 3600000 && hour.timestamp <= next24Hours
          })
          .sort((a, b) => a.timestamp - b.timestamp) // Sort chronologically
          .slice(0, 24) // Limit to 24 items
        
        hourly = futureHours.map((hour, index) => {
          const date = hour.parsedDate
          const hours = date.getHours()
          
          // Show "Now" only for the actual current hour (not next hour)
          const isCurrentHour = hours === currentHour && index === 0
          
          return {
            timestamp: date.getTime(),
            time: isCurrentHour ? 'Now' : 
                  hours === 0 ? '12AM' : 
                  hours < 12 ? `${hours}AM` :
                  hours === 12 ? '12PM' :
                  `${hours - 12}PM`,
            temp: hour.temperature?.degrees ? Math.round(hour.temperature.degrees) : 0,
            feelsLike: hour.feelsLikeTemperature?.degrees ? Math.round(hour.feelsLikeTemperature.degrees) : null,
            condition: hour.weatherCondition?.type || 'CLEAR',
            iconUri: hour.weatherCondition?.iconBaseUri,
            description: hour.weatherCondition?.description?.text,
            precipitation: hour.precipitationProbability?.percent || 0,
            wind: hour.wind?.speed?.value ? Math.round(hour.wind.speed.value) : 0,
            humidity: hour.relativeHumidity || null,
            uvIndex: hour.uvIndex || 0,
            visibility: hour.visibility?.distance || null,
            windDirection: hour.wind?.direction?.cardinal || null,
            windGust: hour.wind?.gust?.value ? Math.round(hour.wind.gust.value) : 0,
            pressure: hour.airPressure?.meanSeaLevelMillibars ? Math.round(hour.airPressure.meanSeaLevelMillibars) : null,
            dewPoint: hour.dewPoint?.degrees ? Math.round(hour.dewPoint.degrees) : null,
            thunderstormProbability: hour.thunderstormProbability?.percent || 0,
            isNow: isCurrentHour
          }
        })
      }
      
      // Process daily forecast (if available)
      let daily = []
      if (forecastData && forecastData.daily && Array.isArray(forecastData.daily)) {
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        daily = forecastData.daily.slice(0, 5).map((day, index) => {
          const date = new Date(day.date || day.timestamp)
          const dayName = index === 0 ? 'Today' : 
                         index === 1 ? 'Tomorrow' : 
                         dayNames[date.getDay()]
          
          // Extract precipitation data (handle both old and new structure)
          let precipPercent = 0
          let precipAmount = 0
          if (day.precipitationProbability?.percent !== undefined) {
            precipPercent = day.precipitationProbability.percent
          } else if (day.precipitationProbability?.probability?.percent !== undefined) {
            precipPercent = day.precipitationProbability.probability.percent
          }
          if (day.precipitationProbability?.qpf?.quantity !== undefined) {
            precipAmount = day.precipitationProbability.qpf.quantity
          }
          
          // Extract sun/moon events
          let sunrise = null, sunset = null, moonPhase = null
          if (day.sunEvents) {
            sunrise = day.sunEvents.sunriseTime ? new Date(day.sunEvents.sunriseTime) : null
            sunset = day.sunEvents.sunsetTime ? new Date(day.sunEvents.sunsetTime) : null
          }
          if (day.moonEvents?.moonPhase) {
            moonPhase = day.moonEvents.moonPhase
          }
          
          return {
            name: dayName,
            date: date,
            high: day.maxTemperature?.degrees ? Math.round(day.maxTemperature.degrees) : 0,
            low: day.minTemperature?.degrees ? Math.round(day.minTemperature.degrees) : 0,
            feelsLikeHigh: day.feelsLikeMaxTemperature?.degrees ? Math.round(day.feelsLikeMaxTemperature.degrees) : null,
            feelsLikeLow: day.feelsLikeMinTemperature?.degrees ? Math.round(day.feelsLikeMinTemperature.degrees) : null,
            condition: day.weatherCondition?.type || 'CLEAR',
            iconUri: day.weatherCondition?.iconBaseUri,
            description: day.weatherCondition?.description?.text,
            precipitation: precipPercent,
            precipAmount: precipAmount,
            wind: day.wind?.speed?.value ? Math.round(day.wind.speed.value) : 0,
            windGust: day.wind?.gust?.value ? Math.round(day.wind.gust.value) : null,
            windDirection: day.wind?.direction?.cardinal || null,
            humidity: day.relativeHumidity || null,
            uvIndex: day.uvIndex || 0,
            sunrise: sunrise,
            sunset: sunset,
            moonPhase: moonPhase,
            daytime: day.daytimeForecast,
            nighttime: day.nighttimeForecast
          }
        })
      }
      
      // Set weather data from actual API structure
      setWeather({
        location: config.location || 'Unknown Location',
        lastUpdated: data.lastUpdated ? new Date(data.lastUpdated) : new Date(), // Handle cached timestamp
        current: {
          temp: current.temperature?.degrees ? Math.round(current.temperature.degrees) : 0,
          feelsLike: current.feelsLikeTemperature?.degrees ? Math.round(current.feelsLikeTemperature.degrees) : null,
          condition: current.weatherCondition?.type || 'CLEAR',
          iconUri: current.weatherCondition?.iconBaseUri,
          description: current.weatherCondition?.description?.text || getWeatherDescription(current.weatherCondition?.type),
          humidity: current.relativeHumidity || null,
          pressure: current.airPressure?.meanSeaLevelMillibars ? Math.round(current.airPressure.meanSeaLevelMillibars) : null,
          visibility: current.visibility?.distance || null,
          visibilityUnit: current.visibility?.unit || 'KILOMETERS',
          windSpeed: current.wind?.speed?.value ? Math.round(current.wind.speed.value) : null,
          windUnit: current.wind?.speed?.unit || 'KILOMETERS_PER_HOUR',
          windDirection: current.wind?.direction?.degrees || null,
          windCardinal: current.wind?.direction?.cardinal || null,
          windGust: current.wind?.gust?.value ? Math.round(current.wind.gust.value) : null,
          uvIndex: current.uvIndex || 0,
          cloudCover: current.cloudCover || null,
          dewPoint: current.dewPoint?.degrees ? Math.round(current.dewPoint.degrees) : null,
          precipitationProbability: current.precipitation?.probability?.percent || 0,
          precipitationType: current.precipitation?.probability?.type || 'RAIN',
          thunderstormProbability: current.thunderstormProbability || 0,
          isDaytime: current.isDaytime
        },
        hourly: hourly,
        daily: daily
      })
      
      setLoading(false)
    } catch (error) {
      console.error('Weather fetch error:', error)
      
      // Try fallback to simpler request
      try {
        const fallbackUrl = buildApiUrl('currentWeather', {
          lat: config.lat,
          lon: config.lon
        })
        const fallbackResponse = await authService.authenticatedFetch(fallbackUrl)
        
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json()
          setWeather({
            location: config.location || 'Unknown Location',
            lastUpdated: new Date(), // Fresh fallback data timestamp
            current: {
              temp: Math.round(fallbackData.temperature?.value || 0),
              condition: fallbackData.weatherCode || 'Clear',
              description: 'Current conditions',
              humidity: fallbackData.humidity ? Math.round(fallbackData.humidity.value * 100) : null
            },
            hourly: [],
            daily: [],
            error: 'Limited data available'
          })
        } else {
          throw new Error('Fallback failed')
        }
      } catch {
        setWeather({
          location: config.location || 'Unknown Location',
          lastUpdated: new Date(), // Error state timestamp
          current: {
            temp: 0,
            condition: 'Unknown',
            description: 'Weather data unavailable'
          },
          hourly: [],
          daily: [],
          error: true
        })
      }
      
      setLoading(false)
    }
  }

  // Get weather description from code
  const getWeatherDescription = (code) => {
    const descriptions = {
      'CLEAR': 'Clear',
      'MOSTLY_CLEAR': 'Mostly Clear',
      'PARTLY_CLOUDY': 'Partly Cloudy',
      'MOSTLY_CLOUDY': 'Mostly Cloudy',
      'CLOUDY': 'Cloudy',
      'WINDY': 'Windy',
      'WIND_AND_RAIN': 'Wind and Rain',
      'LIGHT_RAIN_SHOWERS': 'Light Rain Showers',
      'CHANCE_OF_SHOWERS': 'Chance of Showers',
      'SCATTERED_SHOWERS': 'Scattered Showers',
      'RAIN_SHOWERS': 'Rain Showers',
      'HEAVY_RAIN_SHOWERS': 'Heavy Rain Showers',
      'LIGHT_TO_MODERATE_RAIN': 'Light to Moderate Rain',
      'MODERATE_TO_HEAVY_RAIN': 'Moderate to Heavy Rain',
      'RAIN': 'Rain',
      'LIGHT_RAIN': 'Light Rain',
      'HEAVY_RAIN': 'Heavy Rain',
      'RAIN_PERIODICALLY_HEAVY': 'Rain Periodically Heavy',
      'LIGHT_SNOW_SHOWERS': 'Light Snow Showers',
      'CHANCE_OF_SNOW_SHOWERS': 'Chance of Snow Showers',
      'SCATTERED_SNOW_SHOWERS': 'Scattered Snow Showers',
      'SNOW_SHOWERS': 'Snow Showers',
      'HEAVY_SNOW_SHOWERS': 'Heavy Snow Showers',
      'LIGHT_TO_MODERATE_SNOW': 'Light to Moderate Snow',
      'MODERATE_TO_HEAVY_SNOW': 'Moderate to Heavy Snow',
      'SNOW': 'Snow',
      'LIGHT_SNOW': 'Light Snow',
      'HEAVY_SNOW': 'Heavy Snow',
      'SNOWSTORM': 'Snowstorm',
      'SNOW_PERIODICALLY_HEAVY': 'Snow Periodically Heavy',
      'HEAVY_SNOW_STORM': 'Heavy Snow Storm',
      'BLOWING_SNOW': 'Blowing Snow',
      'RAIN_AND_SNOW': 'Rain and Snow',
      'HAIL': 'Hail',
      'HAIL_SHOWERS': 'Hail Showers',
      'THUNDERSTORM': 'Thunderstorm',
      'THUNDERSHOWER': 'Thundershower',
      'LIGHT_THUNDERSTORM_RAIN': 'Light Thunderstorm Rain',
      'SCATTERED_THUNDERSTORMS': 'Scattered Thunderstorms',
      'HEAVY_THUNDERSTORM': 'Heavy Thunderstorm'
    }
    return descriptions[code] || code || 'Unknown'
  }

  // Get UV Index description
  const getUVDescription = (uvi) => {
    if (!uvi) return { text: 'N/A', color: '#999' }
    if (uvi <= 2) return { text: 'Low', color: '#00e400' }
    if (uvi <= 5) return { text: 'Moderate', color: '#ffff00' }
    if (uvi <= 7) return { text: 'High', color: '#ff7e00' }
    if (uvi <= 10) return { text: 'Very High', color: '#ff0000' }
    return { text: 'Extreme', color: '#8f3f97' }
  }

  // Get AQI description
  const getAQIDescription = (aqi) => {
    if (!aqi) return { text: 'N/A', color: '#999' }
    if (aqi <= 50) return { text: 'Good', color: '#00e400' }
    if (aqi <= 100) return { text: 'Moderate', color: '#ffff00' }
    if (aqi <= 150) return { text: 'Unhealthy for Sensitive', color: '#ff7e00' }
    if (aqi <= 200) return { text: 'Unhealthy', color: '#ff0000' }
    if (aqi <= 300) return { text: 'Very Unhealthy', color: '#8f3f97' }
    return { text: 'Hazardous', color: '#7e0023' }
  }

  // Format time
  const formatTime = (date) => {
    if (!date) return 'N/A'
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
  }

  // Force refresh weather data
  const refreshWeather = async () => {
    await fetchWeather(true)
    setLastRefresh(new Date())
  }

  useEffect(() => {
    // Only fetch weather if we have coordinates
    if (config.lat && config.lon) {
      fetchWeather()
      loadUIState()
    } else if (config.location && !config.lat && !config.lon) {
      // Only try to geocode if we have a location but no coordinates
      fetchWeather()
    }
  }, [config.lat, config.lon, config.location])

  if (isConfigMode) {
    return (
      <div className="widget-config-content">
        <div className="config-group">
          <label className="config-label">Location</label>
          <div className="location-search">
            <input
              type="text"
              className="config-input"
              placeholder="Search for a city..."
              value={locationSearch || config.location || ''}
              onChange={(e) => handleLocationSearch(e.target.value)}
            />
            {suggestions.length > 0 && (
              <div className="location-suggestions">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="location-suggestion"
                    onClick={() => selectLocation(suggestion)}
                  >
                    <MapPin size={14} />
                    {suggestion.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="config-group">
          <label className="config-label">
            <input
              type="checkbox"
              checked={config.showAdvanced || false}
              onChange={(e) => onConfigUpdate({ ...config, showAdvanced: e.target.checked })}
            />
            Show Advanced Weather Data
          </label>
        </div>
        
        <div className="config-group">
          <label className="config-label">
            <input
              type="checkbox"
              checked={config.showHourly !== false}
              onChange={(e) => onConfigUpdate({ ...config, showHourly: e.target.checked })}
            />
            Show Hourly Forecast
          </label>
        </div>
        
        <div className="config-group">
          <label className="config-label">
            <input
              type="checkbox"
              checked={config.showDaily !== false}
              onChange={(e) => onConfigUpdate({ ...config, showDaily: e.target.checked })}
            />
            Show Daily Forecast
          </label>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="weather-widget-advanced">
        <div className="weather-loading">Loading weather...</div>
      </div>
    )
  }

  if (!weather) {
    return (
      <div className="weather-widget-advanced">
        <div className="weather-empty">Please configure location in settings</div>
      </div>
    )
  }

  if (weather.error === true) {
    return (
      <div className="weather-widget-advanced">
        <div className="weather-current">
          <div className="weather-location">{weather.location}</div>
          <div className="weather-main">
            <div className="weather-temp">--°</div>
            <WeatherIcon condition="CLOUDY" size={48} />
          </div>
          <div className="weather-description">Weather data unavailable</div>
        </div>
      </div>
    )
  }

  return (
    <div ref={widgetContainerRef} className={`weather-widget-advanced ${expandedView ? 'expanded' : ''}`}>
      {/* Current Weather */}
      <div className="weather-current">
        <div className="weather-header">
          <div className="weather-location">
            <MapPin size={14} />
            {weather.location}
          </div>
          <div className="weather-header-actions">
            <button 
              className="refresh-toggle"
              onClick={refreshWeather}
              title="Refresh weather data"
              disabled={loading}
            >
              ↻
            </button>
            <button 
              className="expand-toggle"
              onClick={toggleExpandedView}
              title={expandedView ? 'Show less' : 'Show more'}
            >
              {expandedView ? '−' : '+'}
            </button>
          </div>
        </div>
        
        <div className="weather-main">
          <div className="weather-temp-group">
            <div className="weather-temp">{weather.current.temp}°</div>
            {weather.current.feelsLike && weather.current.feelsLike !== weather.current.temp && (
              <div className="weather-feels-like">Feels {weather.current.feelsLike}°</div>
            )}
          </div>
          <WeatherIcon 
            iconUri={weather.current.iconUri} 
            condition={weather.current.condition} 
            size={56} 
            isDark={false}
          />
        </div>
        
        <div className="weather-description">{weather.current.description}</div>
        
        {/* Primary Stats - Always Visible */}
        <div className="weather-primary-stats">
          {/* UV Index - Prominently displayed */}
          {weather.current.uvIndex !== null && weather.current.uvIndex !== undefined && (
            <div className="weather-uv-badge" style={{ 
              backgroundColor: getUVDescription(weather.current.uvIndex).color,
              color: weather.current.uvIndex > 5 ? 'white' : 'black'
            }}>
              <Sun size={14} />
              <span>UV {weather.current.uvIndex}</span>
            </div>
          )}
          
          {/* Precipitation */}
          {weather.current.precipitationProbability > 0 && (
            <div className="weather-precip-badge">
              <Umbrella size={14} />
              <span>{weather.current.precipitationProbability}%</span>
            </div>
          )}
          
          {/* Wind */}
          {weather.current.windSpeed !== null && (
            <div className="weather-wind-badge">
              <Wind size={14} />
              <span>{weather.current.windSpeed}</span>
              {weather.current.windCardinal && (
                <span className="wind-dir">{weather.current.windCardinal}</span>
              )}
            </div>
          )}
          
          {/* Humidity */}
          {weather.current.humidity !== null && (
            <div className="weather-humid-badge">
              <Droplets size={14} />
              <span>{weather.current.humidity}%</span>
            </div>
          )}
        </div>
        
        {/* Expandable Details */}
        {expandedView && (
          <div className="weather-details-expanded">
            <div className="weather-detail-grid">
              {weather.current.pressure !== null && (
                <div className="weather-detail">
                  <Gauge size={14} />
                  <span className="detail-label">Pressure</span>
                  <span className="detail-value">{weather.current.pressure} hPa</span>
                </div>
              )}
              
              {weather.current.visibility !== null && (
                <div className="weather-detail">
                  <Eye size={14} />
                  <span className="detail-label">Visibility</span>
                  <span className="detail-value">
                    {weather.current.visibility} {weather.current.visibilityUnit === 'MILES' ? 'mi' : 'km'}
                  </span>
                </div>
              )}
              
              {weather.current.dewPoint !== null && (
                <div className="weather-detail">
                  <Thermometer size={14} />
                  <span className="detail-label">Dew Point</span>
                  <span className="detail-value">{weather.current.dewPoint}°</span>
                </div>
              )}
              
              {weather.current.cloudCover !== null && (
                <div className="weather-detail">
                  <Cloud size={14} />
                  <span className="detail-label">Cloud Cover</span>
                  <span className="detail-value">{weather.current.cloudCover}%</span>
                </div>
              )}
              
              {weather.current.windGust !== null && (
                <div className="weather-detail">
                  <Wind size={14} />
                  <span className="detail-label">Wind Gust</span>
                  <span className="detail-value">{weather.current.windGust} km/h</span>
                </div>
              )}
              
              {weather.current.thunderstormProbability > 0 && (
                <div className="weather-detail">
                  <CloudLightning size={14} />
                  <span className="detail-label">T-Storm</span>
                  <span className="detail-value">{weather.current.thunderstormProbability}%</span>
                </div>
              )}
            </div>
            
            {weather.current.airQuality && (
              <div className="weather-air-quality">
                <div className="air-quality-label">Air Quality</div>
                <div 
                  className="air-quality-value" 
                  style={{ color: getAQIDescription(weather.current.airQuality.aqi).color }}
                >
                  {getAQIDescription(weather.current.airQuality.aqi).text}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Last Updated */}
        {weather.lastUpdated && (
          <div className="weather-updated">
            Last updated: {formatTime(weather.lastUpdated)}
          </div>
        )}
      </div>

      {/* Hourly Forecast */}
      {settings.weatherShowHourly !== false && weather.hourly.length > 0 && (
        <div className="weather-forecast">
          <div className="weather-section" data-section="hourly">
            <div className="section-title">24-Hour Forecast</div>
            <div className="weather-hourly-container">
              <div className="weather-hourly-scroll" ref={hourlyScrollRef}>
                <div className="weather-hourly">
                  {weather.hourly.map((hour, index) => {
                    const isExpanded = expandedHours.has(index)
                    return (
                      <div 
                        key={index} 
                        className={`hourly-item ${hour.isNow ? 'hourly-now' : ''} ${isExpanded ? 'expanded' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleHourExpanded(index)
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="hourly-time">{hour.time}</div>
                        <WeatherIcon 
                          iconUri={hour.iconUri}
                          condition={hour.condition} 
                          size={32} 
                          isDark={false}
                        />
                        <div className="hourly-temp">{hour.temp}°</div>
                        {hour.feelsLike !== null && hour.feelsLike !== hour.temp && (
                          <div className="hourly-feels" style={{ fontSize: '10px', opacity: 0.8 }}>
                            {hour.feelsLike}°
                          </div>
                        )}
                        
                        {/* Basic info always visible */}
                        {hour.precipitation > 0 && (
                          <div className="hourly-rain">
                            <Umbrella size={12} />
                            <span>{hour.precipitation}%</span>
                          </div>
                        )}
                        
                        {/* Expandable details */}
                        {isExpanded && (
                          <div className="hourly-details-expanded">
                            {hour.wind > 0 && (
                              <div className="hourly-detail-item">
                                <Wind size={11} />
                                <span className="detail-label">Wind</span>
                                <span className="detail-value">
                                  {hour.wind} {hour.windDirection || ''}
                                </span>
                              </div>
                            )}
                            
                            {hour.uvIndex !== undefined && hour.uvIndex !== null && (
                              <div className="hourly-detail-item">
                                <Sun size={11} />
                                <span className="detail-label">UV</span>
                                <span 
                                  className="detail-value"
                                  style={{ 
                                    color: getUVDescription(hour.uvIndex).color,
                                    fontWeight: 600
                                  }}
                                >
                                  {hour.uvIndex}
                                </span>
                              </div>
                            )}
                            
                            {hour.humidity !== null && (
                              <div className="hourly-detail-item">
                                <Droplets size={11} />
                                <span className="detail-label">Humidity</span>
                                <span className="detail-value">{hour.humidity}%</span>
                              </div>
                            )}
                            
                            {hour.cloudCover !== undefined && (
                              <div className="hourly-detail-item">
                                <Cloud size={11} />
                                <span className="detail-label">Clouds</span>
                                <span className="detail-value">{hour.cloudCover}%</span>
                              </div>
                            )}
                            
                            {hour.visibility !== null && hour.visibility !== undefined && (
                              <div className="hourly-detail-item">
                                <Eye size={11} />
                                <span className="detail-label">Visibility</span>
                                <span className="detail-value">
                                  {hour.visibility} {hour.visibilityUnit === 'MILES' ? 'mi' : 'km'}
                                </span>
                              </div>
                            )}
                            
                            {hour.pressure !== null && hour.pressure !== undefined && (
                              <div className="hourly-detail-item">
                                <Gauge size={11} />
                                <span className="detail-label">Pressure</span>
                                <span className="detail-value">{hour.pressure} hPa</span>
                              </div>
                            )}
                            
                            {hour.dewPoint !== null && hour.dewPoint !== undefined && (
                              <div className="hourly-detail-item">
                                <Thermometer size={11} />
                                <span className="detail-label">Dew Point</span>
                                <span className="detail-value">{hour.dewPoint}°</span>
                              </div>
                            )}
                            
                            {hour.windGust > 0 && (
                              <div className="hourly-detail-item">
                                <Wind size={11} />
                                <span className="detail-label">Gust</span>
                                <span className="detail-value">{hour.windGust} km/h</span>
                              </div>
                            )}
                            
                            {hour.thunderstormProbability > 0 && (
                              <div className="hourly-detail-item">
                                <CloudLightning size={11} />
                                <span className="detail-label">T-Storm</span>
                                <span className="detail-value">{hour.thunderstormProbability}%</span>
                              </div>
                            )}
                            
                            {hour.description && (
                              <div className="hourly-description">
                                {hour.description}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Daily Forecast */}
      {settings.weatherShowDaily !== false && weather.daily.length > 0 && (
        <div className="weather-forecast">
          <div className="weather-section" data-section="daily">
            <div className="section-title">5-Day Forecast</div>
            <div className="weather-daily-grid">
              {weather.daily.slice(0, 5).map((day, index) => {
                const isExpanded = expandedDay === index
                return (
                  <div 
                    key={index} 
                    className={`weather-day-column ${isExpanded ? 'expanded' : ''}`}
                    onClick={() => toggleDayExpanded(index)}
                  >
                    {/* Day header */}
                    <div className="day-name">{day.name}</div>
                    
                    {/* Weather icon */}
                    <WeatherIcon 
                      iconUri={day.iconUri}
                      condition={day.condition} 
                      size={isExpanded ? 40 : 32} 
                      isDark={false}
                    />
                    
                    {/* Temperature */}
                    <div className="day-temps">
                      <span className="temp-high">{day.high}°</span>
                      <span className="temp-low">{day.low}°</span>
                    </div>
                    
                    {/* Basic info always visible */}
                    {day.precipitation > 0 && (
                      <div className="day-rain">
                        <Umbrella size={12} />
                        <span>{day.precipitation}%</span>
                      </div>
                    )}
                    
                    {/* Expanded details - smoothly animate in */}
                    {isExpanded && (
                      <div className="day-details-expanded">
                        {/* UV Index */}
                        {day.uvIndex > 0 && (
                          <div className="detail-row">
                            <Sun size={11} />
                            <span className="detail-label">UV</span>
                            <span className="detail-value" style={{ 
                              color: getUVDescription(day.uvIndex).color,
                              fontWeight: 600
                            }}>
                              {day.uvIndex}
                            </span>
                          </div>
                        )}
                        
                        {/* Wind */}
                        {day.wind > 0 && (
                          <div className="detail-row">
                            <Wind size={11} />
                            <span className="detail-label">Wind</span>
                            <span className="detail-value">
                              {day.wind} {day.windDirection || ''}
                            </span>
                          </div>
                        )}
                        
                        {/* Humidity */}
                        {day.humidity !== null && (
                          <div className="detail-row">
                            <Droplets size={11} />
                            <span className="detail-label">Humidity</span>
                            <span className="detail-value">{day.humidity}%</span>
                          </div>
                        )}
                        
                        {/* Feels Like */}
                        {(day.feelsLikeHigh !== null || day.feelsLikeLow !== null) && (
                          <div className="detail-row">
                            <Thermometer size={11} />
                            <span className="detail-label">Feels</span>
                            <span className="detail-value">
                              {day.feelsLikeHigh}°/{day.feelsLikeLow}°
                            </span>
                          </div>
                        )}
                        
                        {/* Sun times */}
                        {day.sunrise && day.sunset && (
                          <>
                            <div className="detail-row">
                              <Sunrise size={11} />
                              <span className="detail-label">Rise</span>
                              <span className="detail-value">{formatTime(day.sunrise)}</span>
                            </div>
                            <div className="detail-row">
                              <Sunset size={11} />
                              <span className="detail-label">Set</span>
                              <span className="detail-value">{formatTime(day.sunset)}</span>
                            </div>
                          </>
                        )}
                        
                        {/* Description if available */}
                        {day.description && (
                          <div className="detail-description">
                            <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>
                              {day.description}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default GoogleWeatherWidget