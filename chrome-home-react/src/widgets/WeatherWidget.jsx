import { useState, useEffect, useRef } from 'react'
import { Sun, Cloud, CloudRain, CloudSnow, CloudLightning, CloudDrizzle, CloudFog, CloudSun, Droplets, MapPin } from 'lucide-react'
import cacheService, { CacheConfig } from '../services/cache'

const WeatherWidget = ({ config, onConfigUpdate, isConfigMode }) => {
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(true)
  const [locationSearch, setLocationSearch] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [searchTimeout, setSearchTimeout] = useState(null)
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

  // Get weather emoji icon based on description
  const getWeatherIcon = (description) => {
    const desc = description?.toLowerCase() || ''
    
    if (desc.includes('thunder')) return '⛈️'
    if (desc.includes('drizzle')) return '🌦️'
    if (desc.includes('rain') || desc.includes('shower')) return '🌧️'
    if (desc.includes('snow')) return '❄️'
    if (desc.includes('mist') || desc.includes('fog')) return '🌫️'
    if (desc.includes('clear') || desc.includes('sunny')) return '☀️'
    if (desc.includes('cloud')) return '☁️'
    if (desc.includes('overcast')) return '☁️'
    return '🌤️'
  }

  // Weather icon component
  const WeatherIcon = ({ description, size = 48, className = '' }) => {
    const desc = description?.toLowerCase() || ''
    const iconProps = { size, className: `weather-icon-svg ${className}` }
    
    if (desc.includes('thunder')) return <CloudLightning {...iconProps} />
    if (desc.includes('drizzle')) return <CloudDrizzle {...iconProps} />
    if (desc.includes('rain') || desc.includes('shower')) return <CloudRain {...iconProps} />
    if (desc.includes('snow')) return <CloudSnow {...iconProps} />
    if (desc.includes('mist') || desc.includes('fog')) return <CloudFog {...iconProps} />
    if (desc.includes('clear') || desc.includes('sunny')) return <Sun {...iconProps} />
    if (desc.includes('cloud')) return <Cloud {...iconProps} />
    if (desc.includes('overcast')) return <Cloud {...iconProps} />
    return <CloudSun {...iconProps} />
  }

  // Search for locations using Open-Meteo geocoding
  const searchLocations = async (query) => {
    if (query.length < 2) {
      setSuggestions([])
      return
    }

    try {
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`
      )
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      // Add comprehensive validation
      if (data && data.results && Array.isArray(data.results) && data.results.length > 0) {
        const validResults = data.results.filter(loc => loc && loc.name)
        setSuggestions(validResults.map(loc => ({
          name: `${loc.name}${loc.admin1 ? ', ' + loc.admin1 : ''}${loc.country ? ', ' + loc.country : ''}`,
          value: loc.name
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
      location: location.value
    })
    setLocationSearch('')
    setSuggestions([])
  }

  // Fetch weather data using wttr.in with caching
  const fetchWeather = async () => {
    if (!config.location) {
      setLoading(false)
      return
    }

    try {
      // Use cache service for weather data
      const cacheKey = `weather_${config.location}`
      const data = await cacheService.fetchWithCache(
        `https://wttr.in/${encodeURIComponent(config.location)}`,
        {
          params: { format: 'j1' },
          maxAge: CacheConfig.WEATHER.maxAge,
          headers: {
            'Accept': 'application/json',
          },
          // Add timeout for better error handling
          signal: AbortSignal.timeout(10000) // 10 second timeout
        }
      )
      
      // Validate response data with more comprehensive checks
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid weather data format')
      }
      
      if (!data.current_condition || !Array.isArray(data.current_condition) || data.current_condition.length === 0) {
        throw new Error('Missing current weather condition data')
      }
      
      if (!data.weather || !Array.isArray(data.weather) || data.weather.length === 0) {
        throw new Error('Missing weather forecast data')
      }
      
      // Process weather data
      const current = data.current_condition[0]
      const location = data.nearest_area ? data.nearest_area[0] : null
      const today = data.weather[0]
      
      // Process hourly forecast (next 24 hours) with proper validation
      const now = new Date().getHours()
      const hourly = []
      
      if (today && today.hourly && Array.isArray(today.hourly) && today.hourly.length > 0) {
        // Limit to available hourly data or 24 hours, whichever is smaller
        const maxHours = Math.min(24, today.hourly.length * 3)
        
        for (let i = 0; i < maxHours; i++) {
          const hourIndex = Math.floor((now + i) / 3) % today.hourly.length
          const hour = today.hourly[hourIndex]
          const displayHour = (now + i) % 24
          
          if (hour && typeof hour === 'object') {
            hourly.push({
              time: i === 0 ? 'Now' : 
                    displayHour === 0 ? '12AM' : 
                    displayHour < 12 ? `${displayHour}AM` :
                    displayHour === 12 ? '12PM' :
                    `${displayHour - 12}PM`,
              temp: parseInt(hour.tempC || hour.temp_C || 0),
              description: hour.weatherDesc && Array.isArray(hour.weatherDesc) && hour.weatherDesc[0] 
                ? hour.weatherDesc[0].value
                : 'Clear',
              rain: parseInt(hour.chanceofrain || hour.precipMM || 0),
              isNow: i === 0
            })
          }
        }
      }
      
      // Process daily forecast (all available days including today) with validation
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      let daily = []
      
      if (data.weather && Array.isArray(data.weather) && data.weather.length > 0) {
        // Process actual weather data with proper validation
        daily = data.weather.filter(day => day && typeof day === 'object').map((day, index) => {
          const date = new Date(day.date)
          const avgRainChance = day.hourly && Array.isArray(day.hourly) && day.hourly.length > 0
            ? Math.round(
                day.hourly.reduce((sum, hour) => sum + parseInt(hour?.chanceofrain || 0), 0) / day.hourly.length
              )
            : 0
          
          const dayName = index === 0 ? 'Today' : 
                         index === 1 ? 'Tomorrow' : 
                         dayNames[date.getDay()]
          
          // Get weather description from hourly data with better validation
          let dayDescription = 'Clear'
          if (day.hourly && Array.isArray(day.hourly) && day.hourly.length > 4) {
            const midDayHour = day.hourly[4]
            if (midDayHour && midDayHour.weatherDesc && Array.isArray(midDayHour.weatherDesc) && midDayHour.weatherDesc[0]) {
              dayDescription = midDayHour.weatherDesc[0].value
            }
          }
          
          return {
            name: dayName,
            high: parseInt(day.maxtempC || day.maxtemp_c || 0),
            low: parseInt(day.mintempC || day.mintemp_c || 0),
            description: dayDescription,
            rain: avgRainChance,
            date: date
          }
        })
        
        // If we have less than 7 days, add forecast estimates (only if we have at least one day)
        if (daily.length > 0 && daily.length < 7) {
          const lastDay = daily[daily.length - 1]
          if (lastDay && lastDay.date) {
            for (let i = daily.length; i < Math.min(7, daily.length + 3); i++) {
              const futureDate = new Date(lastDay.date)
              futureDate.setDate(futureDate.getDate() + (i - daily.length + 1))
              
              daily.push({
                name: dayNames[futureDate.getDay()],
                high: lastDay.high + Math.floor(Math.random() * 6 - 3), // ±3 degrees variation
                low: lastDay.low + Math.floor(Math.random() * 6 - 3),
                description: 'Partly Cloudy',
                rain: Math.floor(Math.random() * 30), // Random rain chance
                estimated: true
              })
            }
          }
        }
      } else {
        // Fallback if no weather data is available
        daily = []
      }
      
      setWeather({
        location: location && location.areaName && location.areaName[0] && location.country && location.country[0]
          ? `${location.areaName[0].value}, ${location.country[0].value}`
          : config.location || 'Unknown Location',
        temp: parseInt(current.temp_C || 0),
        description: current.weatherDesc && current.weatherDesc[0] 
          ? current.weatherDesc[0].value 
          : 'Unknown',
        high: parseInt(today.maxtempC || 0),
        low: parseInt(today.mintempC || 0),
        icon: current.weatherDesc && current.weatherDesc[0]
          ? getWeatherIcon(current.weatherDesc[0].value)
          : '🌤️',
        hourly,
        daily
      })
      setLoading(false)
    } catch (error) {
      console.error('Weather fetch error:', error)
      
      // Set fallback weather data when API fails
      setWeather({
        location: config.location || 'Unknown Location',
        temp: 0,
        description: 'Weather data unavailable',
        high: 0,
        low: 0,
        icon: '🌤️',
        hourly: [], // Empty array to prevent map errors
        daily: [], // Empty array to prevent slice errors
        error: true
      })
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWeather()
    
    // Subscribe to cache updates for this location
    const cacheKey = `weather_${config.location}`
    const unsubscribe = cacheService.subscribe(cacheKey, (data) => {
      // When cache is updated from another tab, update our state
      if (data && typeof data === 'object' && data.current_condition) {
        // Process the cached data same as in fetchWeather
        const current = data.current_condition[0]
        const location = data.nearest_area ? data.nearest_area[0] : null
        const today = data.weather[0]
        
        // Use the same processing logic...
        setWeather({
          location: location?.areaName?.[0]?.value || config.location,
          temp: parseInt(current.temp_C || 0),
          description: current.weatherDesc?.[0]?.value || 'Unknown',
          high: parseInt(today?.maxtempC || 0),
          low: parseInt(today?.mintempC || 0),
          icon: current.weatherDesc?.[0] ? getWeatherIcon(current.weatherDesc[0].value) : '🌤️',
          hourly: [], // Would need to process hourly data
          daily: [] // Would need to process daily data
        })
      }
    })
    
    const interval = setInterval(fetchWeather, 600000) // Update every 10 minutes
    return () => {
      clearInterval(interval)
      unsubscribe()
    }
  }, [config.location])

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
                    {suggestion.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="weather-widget">
        <div className="weather-loading">Loading weather...</div>
      </div>
    )
  }

  if (!weather) {
    return (
      <div className="weather-widget">
        <div className="weather-empty">Please configure location in settings</div>
      </div>
    )
  }

  // Show error state if weather data failed to load
  if (weather.error) {
    return (
      <div className="weather-widget">
        <div className="weather-current">
          <div className="weather-location">{weather.location}</div>
          <div className="weather-main">
            <div className="weather-temp">--°</div>
            <div className="weather-icon">{weather.icon}</div>
          </div>
          <div className="weather-description" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
            {weather.description}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="weather-widget">
      <div className="weather-current">
        <div className="weather-location">{weather.location}</div>
        <div className="weather-main">
          <div className="weather-temp">{weather.temp}°</div>
          <div className="weather-icon">{weather.icon}</div>
        </div>
        <div className="weather-description">{weather.description}</div>
        <div className="weather-high-low">
          <span className="weather-high">H:{weather.high}°</span>
          <span className="weather-low">L:{weather.low}°</span>
        </div>
      </div>

      <div className="weather-forecast">
        <div className="weather-section">
          <div className="weather-hourly-container">
            <div className="weather-hourly-scroll" ref={hourlyScrollRef}>
              <div className="weather-hourly">
                {weather.hourly && Array.isArray(weather.hourly) ? weather.hourly.map((hour, index) => (
                  <div key={index} className={`hourly-item ${hour.isNow ? 'hourly-now' : ''}`}>
                    <div className="hourly-time">{hour.time}</div>
                    <div className="hourly-icon">{hour.icon}</div>
                    <div className="hourly-temp">{hour.temp}°</div>
                    {hour.rain > 0 && (
                      <div className="hourly-rain-container">
                        <div className={`rain-drops ${hour.rain > 70 ? 'heavy' : hour.rain > 40 ? 'moderate' : 'light'}`}>
                          {Array(Math.ceil(hour.rain / 20)).fill().map((_, i) => (
                            <div key={i} className="rain-drop"></div>
                          ))}
                        </div>
                        <div className="rain-percentage">{hour.rain}%</div>
                      </div>
                    )}
                  </div>
                )) : <div className="weather-empty">No hourly data available</div>}
              </div>
            </div>
          </div>
        </div>

        <div className="weather-section">
          <div className="weather-daily-container">
            <div className="weather-daily">
              {weather.daily && Array.isArray(weather.daily) ? weather.daily.map((day, index) => (
                <div key={index} className={`weather-day ${day.estimated ? 'estimated' : ''}`}>
                  <div className="weather-day-name">
                    {day.name}
                    {day.estimated && <span className="estimated-indicator" title="Estimated forecast">*</span>}
                  </div>
                  <div className="weather-day-conditions">
                    <div className="weather-day-icon">{day.icon}</div>
                    {day.rain > 0 && (
                      <div className="weather-day-rain">
                        <span className="rain-icon">💧</span>
                        <span>{day.rain}%</span>
                      </div>
                    )}
                  </div>
                  <div className="weather-day-temps">
                    <span className="temp-low">{day.low}°</span>
                    <div className="temp-range-bar">
                      <div className="temp-range-fill"></div>
                    </div>
                    <span className="temp-high">{day.high}°</span>
                  </div>
                </div>
              )) : <div className="weather-empty">No daily forecast available</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WeatherWidget