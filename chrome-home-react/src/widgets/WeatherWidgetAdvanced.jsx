import { useState, useEffect, useRef } from 'react'
import { 
  Sun, Cloud, CloudRain, CloudSnow, CloudLightning, CloudDrizzle, 
  CloudFog, Wind, Droplets, MapPin, Thermometer, Eye, Gauge,
  Sunrise, Sunset, Moon, CloudHail, Tornado, AlertTriangle
} from 'lucide-react'
import cacheService, { CacheConfig } from '../services/cache'

// Google Weather API configuration (via Maps Platform)
const GOOGLE_API_KEY = 'AIzaSyD4ouBdO60pETckUXcFoCKSpvj60vKRJQg'
const GOOGLE_WEATHER_URL = 'https://weather.googleapis.com/v1'
const GOOGLE_GEOCODING_URL = 'https://maps.googleapis.com/maps/api/geocode/json'
const GOOGLE_PLACES_URL = 'https://maps.googleapis.com/maps/api/place/autocomplete/json'

const WeatherWidgetAdvanced = ({ config, onConfigUpdate, isConfigMode }) => {
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(true)
  const [locationSearch, setLocationSearch] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [searchTimeout, setSearchTimeout] = useState(null)
  const [expandedView, setExpandedView] = useState(false)
  const hourlyScrollRef = useRef(null)
  
  // Handle horizontal scroll with mouse wheel
  useEffect(() => {
    const scrollContainer = hourlyScrollRef.current
    if (!scrollContainer) return
    
    const handleWheel = (e) => {
      if (e.deltaY !== 0) {
        e.preventDefault()
        scrollContainer.scrollLeft += e.deltaY
      }
    }
    
    scrollContainer.addEventListener('wheel', handleWheel, { passive: false })
    return () => scrollContainer.removeEventListener('wheel', handleWheel)
  }, [weather])

  // Enhanced Weather icon component with OpenWeatherMap icon codes
  const WeatherIcon = ({ iconCode, description, size = 48, className = '' }) => {
    const iconProps = { size, className: `weather-icon-svg ${className}` }
    
    // Map OpenWeatherMap icon codes to Lucide icons
    if (!iconCode) return <Cloud {...iconProps} />
    
    switch(iconCode) {
      case '01d': return <Sun {...iconProps} />
      case '01n': return <Moon {...iconProps} />
      case '02d':
      case '02n': return <CloudSun {...iconProps} />
      case '03d':
      case '03n':
      case '04d':
      case '04n': return <Cloud {...iconProps} />
      case '09d':
      case '09n': return <CloudDrizzle {...iconProps} />
      case '10d':
      case '10n': return <CloudRain {...iconProps} />
      case '11d':
      case '11n': return <CloudLightning {...iconProps} />
      case '13d':
      case '13n': return <CloudSnow {...iconProps} />
      case '50d':
      case '50n': return <CloudFog {...iconProps} />
      default: return <Cloud {...iconProps} />
    }
  }

  // Search for locations using OpenWeatherMap Geocoding API
  const searchLocations = async (query) => {
    if (query.length < 2) {
      setSuggestions([])
      return
    }

    try {
      const response = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${OPENWEATHER_API_KEY}`
      )
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data && Array.isArray(data) && data.length > 0) {
        setSuggestions(data.map(loc => ({
          name: `${loc.name}${loc.state ? ', ' + loc.state : ''}${loc.country ? ', ' + loc.country : ''}`,
          value: loc.name,
          lat: loc.lat,
          lon: loc.lon,
          country: loc.country
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
      country: location.country
    })
    setLocationSearch('')
    setSuggestions([])
  }

  // Fetch weather data using OpenWeatherMap One Call API
  const fetchWeather = async () => {
    if (!config.lat || !config.lon) {
      // If no coordinates, try to get them from location name
      if (config.location) {
        try {
          const geoResponse = await fetch(
            `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(config.location)}&limit=1&appid=${OPENWEATHER_API_KEY}`
          )
          const geoData = await geoResponse.json()
          if (geoData && geoData[0]) {
            onConfigUpdate({
              ...config,
              lat: geoData[0].lat,
              lon: geoData[0].lon
            })
            return // Will trigger re-fetch with coordinates
          }
        } catch (error) {
          console.error('Geocoding error:', error)
        }
      }
      setLoading(false)
      return
    }

    try {
      // Use One Call API 2.5 (free tier) for comprehensive weather data
      const response = await fetch(
        `${OPENWEATHER_2_5_URL}/onecall?lat=${config.lat}&lon=${config.lon}&exclude=minutely&units=${config.units || 'metric'}&appid=${OPENWEATHER_API_KEY}`
      )
      
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`)
      }
      
      const data = await response.json()
      
      // Also fetch air quality data
      let airQuality = null
      try {
        const airResponse = await fetch(
          `${OPENWEATHER_2_5_URL}/air_pollution?lat=${config.lat}&lon=${config.lon}&appid=${OPENWEATHER_API_KEY}`
        )
        if (airResponse.ok) {
          const airData = await airResponse.json()
          if (airData.list && airData.list[0]) {
            airQuality = {
              aqi: airData.list[0].main.aqi,
              components: airData.list[0].components
            }
          }
        }
      } catch (error) {
        console.error('Air quality fetch error:', error)
      }
      
      // Process current weather
      const current = data.current
      const today = data.daily[0]
      
      // Process hourly forecast (next 48 hours)
      const hourly = data.hourly.slice(0, 24).map((hour, index) => {
        const date = new Date(hour.dt * 1000)
        const hours = date.getHours()
        return {
          time: index === 0 ? 'Now' : 
                hours === 0 ? '12AM' : 
                hours < 12 ? `${hours}AM` :
                hours === 12 ? '12PM' :
                `${hours - 12}PM`,
          temp: Math.round(hour.temp),
          feelsLike: Math.round(hour.feels_like),
          description: hour.weather[0].description,
          icon: hour.weather[0].icon,
          rain: hour.pop ? Math.round(hour.pop * 100) : 0,
          wind: Math.round(hour.wind_speed),
          humidity: hour.humidity,
          uvi: hour.uvi,
          isNow: index === 0
        }
      })
      
      // Process daily forecast (8 days)
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      const daily = data.daily.map((day, index) => {
        const date = new Date(day.dt * 1000)
        const dayName = index === 0 ? 'Today' : 
                       index === 1 ? 'Tomorrow' : 
                       dayNames[date.getDay()]
        
        return {
          name: dayName,
          high: Math.round(day.temp.max),
          low: Math.round(day.temp.min),
          description: day.weather[0].description,
          icon: day.weather[0].icon,
          rain: day.pop ? Math.round(day.pop * 100) : 0,
          wind: Math.round(day.wind_speed),
          humidity: day.humidity,
          uvi: day.uvi,
          sunrise: new Date(day.sunrise * 1000),
          sunset: new Date(day.sunset * 1000),
          moonPhase: day.moon_phase,
          date: date
        }
      })
      
      // Process weather alerts if any
      const alerts = data.alerts ? data.alerts.map(alert => ({
        event: alert.event,
        description: alert.description,
        start: new Date(alert.start * 1000),
        end: new Date(alert.end * 1000),
        tags: alert.tags
      })) : []
      
      setWeather({
        location: config.location || 'Unknown Location',
        country: config.country,
        temp: Math.round(current.temp),
        feelsLike: Math.round(current.feels_like),
        description: current.weather[0].description,
        icon: current.weather[0].icon,
        high: Math.round(today.temp.max),
        low: Math.round(today.temp.min),
        humidity: current.humidity,
        pressure: current.pressure,
        visibility: current.visibility ? (current.visibility / 1000).toFixed(1) : null,
        windSpeed: Math.round(current.wind_speed),
        windDeg: current.wind_deg,
        windGust: current.wind_gust ? Math.round(current.wind_gust) : null,
        clouds: current.clouds,
        uvi: current.uvi,
        dewPoint: Math.round(current.dew_point),
        sunrise: new Date(current.sunrise * 1000),
        sunset: new Date(current.sunset * 1000),
        moonPhase: today.moon_phase,
        hourly,
        daily,
        alerts,
        airQuality,
        timezone: data.timezone,
        timezoneOffset: data.timezone_offset
      })
      setLoading(false)
    } catch (error) {
      console.error('Weather fetch error:', error)
      setWeather({
        location: config.location || 'Unknown Location',
        temp: 0,
        description: 'Weather data unavailable',
        high: 0,
        low: 0,
        icon: '01d',
        hourly: [],
        daily: [],
        alerts: [],
        error: true
      })
      setLoading(false)
    }
  }

  useEffect(() => {
    if (OPENWEATHER_API_KEY === 'YOUR_API_KEY_HERE') {
      console.error('Please add your OpenWeatherMap API key to WeatherWidgetAdvanced.jsx')
      setWeather({
        location: 'API Key Required',
        temp: 0,
        description: 'Please configure API key',
        high: 0,
        low: 0,
        icon: '01d',
        hourly: [],
        daily: [],
        alerts: [],
        error: true
      })
      setLoading(false)
      return
    }

    fetchWeather()
    const interval = setInterval(fetchWeather, 600000) // Update every 10 minutes
    return () => clearInterval(interval)
  }, [config.lat, config.lon, config.units])

  // Format time
  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
  }

  // Get moon phase icon
  const getMoonPhaseIcon = (phase) => {
    if (phase === 0 || phase === 1) return '🌑' // New Moon
    if (phase < 0.25) return '🌒' // Waxing Crescent
    if (phase === 0.25) return '🌓' // First Quarter
    if (phase < 0.5) return '🌔' // Waxing Gibbous
    if (phase === 0.5) return '🌕' // Full Moon
    if (phase < 0.75) return '🌖' // Waning Gibbous
    if (phase === 0.75) return '🌗' // Last Quarter
    return '🌘' // Waning Crescent
  }

  // Get AQI description
  const getAQIDescription = (aqi) => {
    switch(aqi) {
      case 1: return { text: 'Good', color: '#00e400' }
      case 2: return { text: 'Fair', color: '#ffff00' }
      case 3: return { text: 'Moderate', color: '#ff7e00' }
      case 4: return { text: 'Poor', color: '#ff0000' }
      case 5: return { text: 'Very Poor', color: '#8f3f97' }
      default: return { text: 'Unknown', color: '#999' }
    }
  }

  // Get UV Index description
  const getUVDescription = (uvi) => {
    if (uvi <= 2) return { text: 'Low', color: '#00e400' }
    if (uvi <= 5) return { text: 'Moderate', color: '#ffff00' }
    if (uvi <= 7) return { text: 'High', color: '#ff7e00' }
    if (uvi <= 10) return { text: 'Very High', color: '#ff0000' }
    return { text: 'Extreme', color: '#8f3f97' }
  }

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
          <label className="config-label">Units</label>
          <select
            className="config-select"
            value={config.units || 'metric'}
            onChange={(e) => onConfigUpdate({ ...config, units: e.target.value })}
          >
            <option value="metric">Celsius (°C)</option>
            <option value="imperial">Fahrenheit (°F)</option>
          </select>
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

  if (weather.error) {
    return (
      <div className="weather-widget-advanced">
        <div className="weather-current">
          <div className="weather-location">{weather.location}</div>
          <div className="weather-main">
            <div className="weather-temp">--°</div>
            <WeatherIcon iconCode={weather.icon} size={48} />
          </div>
          <div className="weather-description">{weather.description}</div>
        </div>
      </div>
    )
  }

  const tempUnit = config.units === 'imperial' ? '°F' : '°C'
  const windUnit = config.units === 'imperial' ? 'mph' : 'm/s'

  return (
    <div className={`weather-widget-advanced ${expandedView ? 'expanded' : ''}`}>
      {/* Weather Alerts */}
      {weather.alerts && weather.alerts.length > 0 && (
        <div className="weather-alerts">
          {weather.alerts.map((alert, index) => (
            <div key={index} className="weather-alert">
              <AlertTriangle size={16} />
              <span>{alert.event}</span>
            </div>
          ))}
        </div>
      )}

      {/* Current Weather */}
      <div className="weather-current">
        <div className="weather-header">
          <div className="weather-location">
            <MapPin size={16} />
            {weather.location}
            {weather.country && <span className="country-code">{weather.country}</span>}
          </div>
          {config.showAdvanced && (
            <button 
              className="expand-toggle"
              onClick={() => setExpandedView(!expandedView)}
            >
              {expandedView ? '−' : '+'}
            </button>
          )}
        </div>
        
        <div className="weather-main">
          <div className="weather-temp-group">
            <div className="weather-temp">{weather.temp}{tempUnit}</div>
            <div className="weather-feels-like">Feels like {weather.feelsLike}{tempUnit}</div>
          </div>
          <WeatherIcon iconCode={weather.icon} size={64} />
        </div>
        
        <div className="weather-description">{weather.description}</div>
        
        <div className="weather-high-low">
          <span className="weather-high">H: {weather.high}{tempUnit}</span>
          <span className="weather-low">L: {weather.low}{tempUnit}</span>
        </div>

        {/* Advanced Current Stats */}
        {config.showAdvanced && (
          <div className="weather-stats">
            <div className="weather-stat">
              <Wind size={16} />
              <span>{weather.windSpeed} {windUnit}</span>
            </div>
            <div className="weather-stat">
              <Droplets size={16} />
              <span>{weather.humidity}%</span>
            </div>
            <div className="weather-stat">
              <Gauge size={16} />
              <span>{weather.pressure} hPa</span>
            </div>
            <div className="weather-stat">
              <Eye size={16} />
              <span>{weather.visibility} km</span>
            </div>
          </div>
        )}

        {/* Sun & Moon Info */}
        {config.showAdvanced && expandedView && (
          <div className="weather-astro">
            <div className="astro-item">
              <Sunrise size={16} />
              <span>{formatTime(weather.sunrise)}</span>
            </div>
            <div className="astro-item">
              <Sunset size={16} />
              <span>{formatTime(weather.sunset)}</span>
            </div>
            <div className="astro-item">
              <span>{getMoonPhaseIcon(weather.moonPhase)}</span>
              <span>Moon</span>
            </div>
          </div>
        )}

        {/* Air Quality */}
        {config.showAdvanced && weather.airQuality && (
          <div className="weather-air-quality">
            <div className="air-quality-label">Air Quality</div>
            <div 
              className="air-quality-value" 
              style={{ color: getAQIDescription(weather.airQuality.aqi).color }}
            >
              {getAQIDescription(weather.airQuality.aqi).text}
            </div>
          </div>
        )}
      </div>

      {/* Hourly Forecast */}
      <div className="weather-forecast">
        <div className="weather-section">
          <div className="section-title">Hourly Forecast</div>
          <div className="weather-hourly-container">
            <div className="weather-hourly-scroll" ref={hourlyScrollRef}>
              <div className="weather-hourly">
                {weather.hourly.map((hour, index) => (
                  <div key={index} className={`hourly-item ${hour.isNow ? 'hourly-now' : ''}`}>
                    <div className="hourly-time">{hour.time}</div>
                    <WeatherIcon iconCode={hour.icon} size={32} />
                    <div className="hourly-temp">{hour.temp}{tempUnit}</div>
                    {hour.rain > 0 && (
                      <div className="hourly-rain">
                        <Droplets size={12} />
                        <span>{hour.rain}%</span>
                      </div>
                    )}
                    {config.showAdvanced && (
                      <>
                        <div className="hourly-wind">
                          <Wind size={12} />
                          <span>{hour.wind}</span>
                        </div>
                        <div className="hourly-uvi" style={{ 
                          color: getUVDescription(hour.uvi).color 
                        }}>
                          UV {hour.uvi}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Daily Forecast */}
        <div className="weather-section">
          <div className="section-title">8-Day Forecast</div>
          <div className="weather-daily">
            {weather.daily.map((day, index) => (
              <div key={index} className="weather-day">
                <div className="weather-day-header">
                  <div className="weather-day-name">{day.name}</div>
                  {config.showAdvanced && (
                    <div className="weather-day-date">
                      {day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  )}
                </div>
                
                <div className="weather-day-main">
                  <WeatherIcon iconCode={day.icon} size={32} />
                  <div className="weather-day-temps">
                    <span className="temp-high">{day.high}{tempUnit}</span>
                    <span className="temp-low">{day.low}{tempUnit}</span>
                  </div>
                </div>
                
                <div className="weather-day-description">{day.description}</div>
                
                {day.rain > 0 && (
                  <div className="weather-day-rain">
                    <Droplets size={14} />
                    <span>{day.rain}%</span>
                  </div>
                )}
                
                {config.showAdvanced && expandedView && (
                  <div className="weather-day-details">
                    <div className="day-stat">
                      <Wind size={12} />
                      <span>{day.wind} {windUnit}</span>
                    </div>
                    <div className="day-stat">
                      <Droplets size={12} />
                      <span>{day.humidity}%</span>
                    </div>
                    <div className="day-stat" style={{ 
                      color: getUVDescription(day.uvi).color 
                    }}>
                      UV {day.uvi}
                    </div>
                    <div className="day-astro">
                      <Sunrise size={12} />
                      <span>{day.sunrise.toLocaleTimeString('en-US', { 
                        hour: 'numeric', 
                        minute: '2-digit' 
                      })}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Import missing icon
const CloudSun = (props) => (
  <svg {...props} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
    <path d="M15.5 12.5A3 3 0 0 0 13 8.17"/>
    <path d="M17 9a5 5 0 0 0-8.82 3.18A3 3 0 0 0 7 18h10a3 3 0 0 0 .5-5.97z"/>
  </svg>
)

export default WeatherWidgetAdvanced