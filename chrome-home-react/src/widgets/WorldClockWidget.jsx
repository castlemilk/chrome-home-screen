import { useState, useEffect } from 'react'
import { Plus, X, ChevronLeft, ChevronRight, Globe, GripVertical } from 'lucide-react'
import { ReactSortable } from 'react-sortablejs'

const WorldClockWidget = ({ config, onConfigUpdate, isConfigMode }) => {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [timeOffset, setTimeOffset] = useState(0) // Hours offset for time navigation
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  
  // Initialize config with defaults
  const clocks = config.clocks || [
    { city: 'New York', timezone: 'America/New_York', offset: '-5' },
    { city: 'London', timezone: 'Europe/London', offset: '0' },
    { city: 'Tokyo', timezone: 'Asia/Tokyo', offset: '+9' }
  ]
  
  // Display format options with defaults
  const displayFormat = config.displayFormat || {
    showSeconds: true,
    use24Hour: true,
    showDate: true,
    showDayOfWeek: true,
    showTimezone: false
  }

  // Comprehensive global timezones with GMT offsets
  const timezones = [
    // UTC-12 to UTC-11
    { city: 'Baker Island', timezone: 'Etc/GMT+12', offset: '-12' },
    { city: 'Pago Pago', timezone: 'Pacific/Pago_Pago', offset: '-11' },
    { city: 'Niue', timezone: 'Pacific/Niue', offset: '-11' },
    
    // UTC-10
    { city: 'Honolulu', timezone: 'Pacific/Honolulu', offset: '-10' },
    { city: 'Tahiti', timezone: 'Pacific/Tahiti', offset: '-10' },
    { city: 'Rarotonga', timezone: 'Pacific/Rarotonga', offset: '-10' },
    
    // UTC-9
    { city: 'Anchorage', timezone: 'America/Anchorage', offset: '-9' },
    { city: 'Gambier', timezone: 'Pacific/Gambier', offset: '-9' },
    
    // UTC-8
    { city: 'Los Angeles', timezone: 'America/Los_Angeles', offset: '-8' },
    { city: 'San Francisco', timezone: 'America/Los_Angeles', offset: '-8' },
    { city: 'Seattle', timezone: 'America/Los_Angeles', offset: '-8' },
    { city: 'Vancouver', timezone: 'America/Vancouver', offset: '-8' },
    { city: 'Tijuana', timezone: 'America/Tijuana', offset: '-8' },
    
    // UTC-7
    { city: 'Phoenix', timezone: 'America/Phoenix', offset: '-7' },
    { city: 'Denver', timezone: 'America/Denver', offset: '-7' },
    { city: 'Calgary', timezone: 'America/Edmonton', offset: '-7' },
    { city: 'Chihuahua', timezone: 'America/Chihuahua', offset: '-7' },
    
    // UTC-6
    { city: 'Chicago', timezone: 'America/Chicago', offset: '-6' },
    { city: 'Mexico City', timezone: 'America/Mexico_City', offset: '-6' },
    { city: 'Guatemala City', timezone: 'America/Guatemala', offset: '-6' },
    { city: 'San Salvador', timezone: 'America/El_Salvador', offset: '-6' },
    { city: 'Winnipeg', timezone: 'America/Winnipeg', offset: '-6' },
    
    // UTC-5
    { city: 'New York', timezone: 'America/New_York', offset: '-5' },
    { city: 'Toronto', timezone: 'America/Toronto', offset: '-5' },
    { city: 'Miami', timezone: 'America/New_York', offset: '-5' },
    { city: 'Atlanta', timezone: 'America/New_York', offset: '-5' },
    { city: 'Havana', timezone: 'America/Havana', offset: '-5' },
    { city: 'Lima', timezone: 'America/Lima', offset: '-5' },
    { city: 'Bogotá', timezone: 'America/Bogota', offset: '-5' },
    { city: 'Kingston', timezone: 'America/Jamaica', offset: '-5' },
    
    // UTC-4
    { city: 'Halifax', timezone: 'America/Halifax', offset: '-4' },
    { city: 'Caracas', timezone: 'America/Caracas', offset: '-4' },
    { city: 'La Paz', timezone: 'America/La_Paz', offset: '-4' },
    { city: 'Santiago', timezone: 'America/Santiago', offset: '-4' },
    { city: 'Santo Domingo', timezone: 'America/Santo_Domingo', offset: '-4' },
    
    // UTC-3
    { city: 'São Paulo', timezone: 'America/Sao_Paulo', offset: '-3' },
    { city: 'Buenos Aires', timezone: 'America/Argentina/Buenos_Aires', offset: '-3' },
    { city: 'Montevideo', timezone: 'America/Montevideo', offset: '-3' },
    { city: 'Rio de Janeiro', timezone: 'America/Sao_Paulo', offset: '-3' },
    { city: 'Brasília', timezone: 'America/Sao_Paulo', offset: '-3' },
    
    // UTC-2
    { city: 'South Georgia', timezone: 'Atlantic/South_Georgia', offset: '-2' },
    
    // UTC-1
    { city: 'Azores', timezone: 'Atlantic/Azores', offset: '-1' },
    { city: 'Cape Verde', timezone: 'Atlantic/Cape_Verde', offset: '-1' },
    
    // UTC+0
    { city: 'London', timezone: 'Europe/London', offset: '0' },
    { city: 'Dublin', timezone: 'Europe/Dublin', offset: '0' },
    { city: 'Lisbon', timezone: 'Europe/Lisbon', offset: '0' },
    { city: 'Casablanca', timezone: 'Africa/Casablanca', offset: '0' },
    { city: 'Accra', timezone: 'Africa/Accra', offset: '0' },
    { city: 'Reykjavik', timezone: 'Atlantic/Reykjavik', offset: '0' },
    
    // UTC+1
    { city: 'Paris', timezone: 'Europe/Paris', offset: '+1' },
    { city: 'Berlin', timezone: 'Europe/Berlin', offset: '+1' },
    { city: 'Rome', timezone: 'Europe/Rome', offset: '+1' },
    { city: 'Madrid', timezone: 'Europe/Madrid', offset: '+1' },
    { city: 'Amsterdam', timezone: 'Europe/Amsterdam', offset: '+1' },
    { city: 'Brussels', timezone: 'Europe/Brussels', offset: '+1' },
    { city: 'Vienna', timezone: 'Europe/Vienna', offset: '+1' },
    { city: 'Prague', timezone: 'Europe/Prague', offset: '+1' },
    { city: 'Copenhagen', timezone: 'Europe/Copenhagen', offset: '+1' },
    { city: 'Stockholm', timezone: 'Europe/Stockholm', offset: '+1' },
    { city: 'Oslo', timezone: 'Europe/Oslo', offset: '+1' },
    { city: 'Warsaw', timezone: 'Europe/Warsaw', offset: '+1' },
    { city: 'Lagos', timezone: 'Africa/Lagos', offset: '+1' },
    { city: 'Tunis', timezone: 'Africa/Tunis', offset: '+1' },
    
    // UTC+2
    { city: 'Cairo', timezone: 'Africa/Cairo', offset: '+2' },
    { city: 'Athens', timezone: 'Europe/Athens', offset: '+2' },
    { city: 'Helsinki', timezone: 'Europe/Helsinki', offset: '+2' },
    { city: 'Kiev', timezone: 'Europe/Kiev', offset: '+2' },
    { city: 'Bucharest', timezone: 'Europe/Bucharest', offset: '+2' },
    { city: 'Istanbul', timezone: 'Europe/Istanbul', offset: '+2' },
    { city: 'Jerusalem', timezone: 'Asia/Jerusalem', offset: '+2' },
    { city: 'Johannesburg', timezone: 'Africa/Johannesburg', offset: '+2' },
    { city: 'Harare', timezone: 'Africa/Harare', offset: '+2' },
    
    // UTC+3
    { city: 'Moscow', timezone: 'Europe/Moscow', offset: '+3' },
    { city: 'Riyadh', timezone: 'Asia/Riyadh', offset: '+3' },
    { city: 'Kuwait City', timezone: 'Asia/Kuwait', offset: '+3' },
    { city: 'Nairobi', timezone: 'Africa/Nairobi', offset: '+3' },
    { city: 'Baghdad', timezone: 'Asia/Baghdad', offset: '+3' },
    { city: 'Minsk', timezone: 'Europe/Minsk', offset: '+3' },
    { city: 'Doha', timezone: 'Asia/Qatar', offset: '+3' },
    { city: 'Addis Ababa', timezone: 'Africa/Addis_Ababa', offset: '+3' },
    
    // UTC+3.5
    { city: 'Tehran', timezone: 'Asia/Tehran', offset: '+3.5' },
    
    // UTC+4
    { city: 'Dubai', timezone: 'Asia/Dubai', offset: '+4' },
    { city: 'Abu Dhabi', timezone: 'Asia/Dubai', offset: '+4' },
    { city: 'Muscat', timezone: 'Asia/Muscat', offset: '+4' },
    { city: 'Baku', timezone: 'Asia/Baku', offset: '+4' },
    { city: 'Tbilisi', timezone: 'Asia/Tbilisi', offset: '+4' },
    { city: 'Yerevan', timezone: 'Asia/Yerevan', offset: '+4' },
    { city: 'Mauritius', timezone: 'Indian/Mauritius', offset: '+4' },
    
    // UTC+4.5
    { city: 'Kabul', timezone: 'Asia/Kabul', offset: '+4.5' },
    
    // UTC+5
    { city: 'Karachi', timezone: 'Asia/Karachi', offset: '+5' },
    { city: 'Islamabad', timezone: 'Asia/Karachi', offset: '+5' },
    { city: 'Tashkent', timezone: 'Asia/Tashkent', offset: '+5' },
    { city: 'Yekaterinburg', timezone: 'Asia/Yekaterinburg', offset: '+5' },
    
    // UTC+5.5
    { city: 'Mumbai', timezone: 'Asia/Kolkata', offset: '+5.5' },
    { city: 'New Delhi', timezone: 'Asia/Kolkata', offset: '+5.5' },
    { city: 'Bangalore', timezone: 'Asia/Kolkata', offset: '+5.5' },
    { city: 'Chennai', timezone: 'Asia/Kolkata', offset: '+5.5' },
    { city: 'Kolkata', timezone: 'Asia/Kolkata', offset: '+5.5' },
    { city: 'Colombo', timezone: 'Asia/Colombo', offset: '+5.5' },
    
    // UTC+5.75
    { city: 'Kathmandu', timezone: 'Asia/Kathmandu', offset: '+5.75' },
    
    // UTC+6
    { city: 'Dhaka', timezone: 'Asia/Dhaka', offset: '+6' },
    { city: 'Almaty', timezone: 'Asia/Almaty', offset: '+6' },
    { city: 'Bishkek', timezone: 'Asia/Bishkek', offset: '+6' },
    { city: 'Omsk', timezone: 'Asia/Omsk', offset: '+6' },
    
    // UTC+6.5
    { city: 'Yangon', timezone: 'Asia/Yangon', offset: '+6.5' },
    
    // UTC+7
    { city: 'Bangkok', timezone: 'Asia/Bangkok', offset: '+7' },
    { city: 'Jakarta', timezone: 'Asia/Jakarta', offset: '+7' },
    { city: 'Ho Chi Minh City', timezone: 'Asia/Ho_Chi_Minh', offset: '+7' },
    { city: 'Hanoi', timezone: 'Asia/Ho_Chi_Minh', offset: '+7' },
    { city: 'Phnom Penh', timezone: 'Asia/Phnom_Penh', offset: '+7' },
    { city: 'Krasnoyarsk', timezone: 'Asia/Krasnoyarsk', offset: '+7' },
    
    // UTC+8
    { city: 'Beijing', timezone: 'Asia/Shanghai', offset: '+8' },
    { city: 'Shanghai', timezone: 'Asia/Shanghai', offset: '+8' },
    { city: 'Hong Kong', timezone: 'Asia/Hong_Kong', offset: '+8' },
    { city: 'Singapore', timezone: 'Asia/Singapore', offset: '+8' },
    { city: 'Taipei', timezone: 'Asia/Taipei', offset: '+8' },
    { city: 'Perth', timezone: 'Australia/Perth', offset: '+8' },
    { city: 'Manila', timezone: 'Asia/Manila', offset: '+8' },
    { city: 'Kuala Lumpur', timezone: 'Asia/Kuala_Lumpur', offset: '+8' },
    { city: 'Irkutsk', timezone: 'Asia/Irkutsk', offset: '+8' },
    
    // UTC+9
    { city: 'Tokyo', timezone: 'Asia/Tokyo', offset: '+9' },
    { city: 'Seoul', timezone: 'Asia/Seoul', offset: '+9' },
    { city: 'Osaka', timezone: 'Asia/Tokyo', offset: '+9' },
    { city: 'Pyongyang', timezone: 'Asia/Pyongyang', offset: '+9' },
    { city: 'Yakutsk', timezone: 'Asia/Yakutsk', offset: '+9' },
    
    // UTC+9.5
    { city: 'Adelaide', timezone: 'Australia/Adelaide', offset: '+9.5' },
    { city: 'Darwin', timezone: 'Australia/Darwin', offset: '+9.5' },
    
    // UTC+10
    { city: 'Sydney', timezone: 'Australia/Sydney', offset: '+10' },
    { city: 'Melbourne', timezone: 'Australia/Melbourne', offset: '+10' },
    { city: 'Brisbane', timezone: 'Australia/Brisbane', offset: '+10' },
    { city: 'Canberra', timezone: 'Australia/Sydney', offset: '+10' },
    { city: 'Port Moresby', timezone: 'Pacific/Port_Moresby', offset: '+10' },
    { city: 'Vladivostok', timezone: 'Asia/Vladivostok', offset: '+10' },
    
    // UTC+11
    { city: 'Magadan', timezone: 'Asia/Magadan', offset: '+11' },
    { city: 'Nouméa', timezone: 'Pacific/Noumea', offset: '+11' },
    { city: 'Solomon Islands', timezone: 'Pacific/Guadalcanal', offset: '+11' },
    
    // UTC+12
    { city: 'Auckland', timezone: 'Pacific/Auckland', offset: '+12' },
    { city: 'Wellington', timezone: 'Pacific/Auckland', offset: '+12' },
    { city: 'Fiji', timezone: 'Pacific/Fiji', offset: '+12' },
    { city: 'Kamchatka', timezone: 'Asia/Kamchatka', offset: '+12' },
    
    // UTC+13
    { city: 'Nuku\'alofa', timezone: 'Pacific/Tongatapu', offset: '+13' },
    { city: 'Samoa', timezone: 'Pacific/Apia', offset: '+13' },
    
    // UTC+14
    { city: 'Line Islands', timezone: 'Pacific/Kiritimati', offset: '+14' }
  ]

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Get adjusted time
  const getAdjustedTime = () => {
    const adjustedTime = new Date(currentTime)
    adjustedTime.setHours(adjustedTime.getHours() + timeOffset)
    return adjustedTime
  }

  // Format time for a specific timezone
  const formatTime = (timezone) => {
    try {
      const adjustedTime = getAdjustedTime()
      
      // Time formatting options
      const timeOptions = {
        hour: '2-digit',
        minute: '2-digit',
        hour12: !displayFormat.use24Hour,
        timeZone: timezone
      }
      
      if (displayFormat.showSeconds) {
        timeOptions.second = '2-digit'
      }
      
      const time = new Intl.DateTimeFormat('en-US', timeOptions).format(adjustedTime)
      
      // Date formatting options
      let dateStr = ''
      if (displayFormat.showDate) {
        const dateOptions = {
          month: 'short',
          day: 'numeric',
          timeZone: timezone
        }
        
        if (displayFormat.showDayOfWeek) {
          dateOptions.weekday = 'short'
        }
        
        dateStr = new Intl.DateTimeFormat('en-US', dateOptions).format(adjustedTime)
      }
      
      return { time, date: dateStr }
    } catch {
      return { time: '--:--', date: '' }
    }
  }

  // Get current GMT offset for a timezone
  const getCurrentOffset = (timezone) => {
    try {
      const now = new Date()
      const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }))
      const tzDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }))
      const offset = (tzDate - utcDate) / (60 * 60 * 1000)
      return offset >= 0 ? `+${offset}` : `${offset}`
    } catch {
      return ''
    }
  }

  // Add a clock
  const addClock = (timezone) => {
    if (!clocks.find(c => c.timezone === timezone.timezone)) {
      const newClocks = [...clocks, timezone]
      onConfigUpdate({ ...config, clocks: newClocks })
      setSearchQuery('')
      setSuggestions([])
    }
  }

  // Remove a clock
  const removeClock = (index) => {
    const newClocks = clocks.filter((_, i) => i !== index)
    onConfigUpdate({ ...config, clocks: newClocks })
  }

  // Search for timezones
  const handleSearch = (query) => {
    setSearchQuery(query)
    if (query.length < 2) {
      setSuggestions([])
      return
    }
    
    const lowerQuery = query.toLowerCase()
    const matches = timezones.filter(tz => 
      tz.city.toLowerCase().includes(lowerQuery) ||
      tz.timezone.toLowerCase().includes(lowerQuery) ||
      tz.offset.includes(query)
    ).filter(tz => !clocks.find(c => c.timezone === tz.timezone))
    
    // Sort by relevance
    matches.sort((a, b) => {
      const aStartsWith = a.city.toLowerCase().startsWith(lowerQuery)
      const bStartsWith = b.city.toLowerCase().startsWith(lowerQuery)
      if (aStartsWith && !bStartsWith) return -1
      if (!aStartsWith && bStartsWith) return 1
      return a.city.localeCompare(b.city)
    })
    
    setSuggestions(matches.slice(0, 10))
  }

  // Handle time offset change from slider
  const handleTimeOffsetChange = (value) => {
    setTimeOffset(parseInt(value))
  }

  // Reset to current time
  const resetTime = () => {
    setTimeOffset(0)
  }
  
  // Format offset display
  const formatOffsetDisplay = (offset) => {
    if (offset === 0) return 'Current Time'
    const hours = Math.abs(offset)
    const direction = offset > 0 ? 'ahead' : 'behind'
    return `${hours}h ${direction}`
  }

  if (isConfigMode) {
    return (
      <div className="widget-config-content">
        <div className="config-group">
          <label className="config-label">World Clocks</label>
          <div className="world-clock-list">
            {clocks.map((clock, index) => (
              <div key={index} className="world-clock-config-item">
                <span>{clock.city}</span>
                <span className="clock-offset-badge">GMT{clock.offset}</span>
                <button
                  className="clock-remove-btn"
                  onClick={() => removeClock(index)}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
          <div className="clock-search-container">
            <input
              type="text"
              className="config-input"
              placeholder="Search cities, timezones, or GMT offset..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
            {suggestions.length > 0 && (
              <div className="clock-suggestions">
                {suggestions.map((tz, index) => (
                  <div
                    key={index}
                    className="clock-suggestion"
                    onClick={() => addClock(tz)}
                  >
                    <div className="clock-suggestion-header">
                      <span className="clock-suggestion-city">{tz.city}</span>
                      <span className="clock-suggestion-offset">GMT{tz.offset}</span>
                    </div>
                    <div className="clock-suggestion-timezone">{tz.timezone}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="config-help">
            Search by city name, timezone, or GMT offset (e.g., "+5", "-8")
          </div>
        </div>
        
        <div className="config-group">
          <label className="config-label">Display Format</label>
          <div className="format-options">
            <label className="format-option">
              <input
                type="checkbox"
                checked={displayFormat.showSeconds}
                onChange={(e) => onConfigUpdate({
                  ...config,
                  displayFormat: { ...displayFormat, showSeconds: e.target.checked }
                })}
              />
              <span>Show seconds</span>
            </label>
            <label className="format-option">
              <input
                type="checkbox"
                checked={displayFormat.use24Hour}
                onChange={(e) => onConfigUpdate({
                  ...config,
                  displayFormat: { ...displayFormat, use24Hour: e.target.checked }
                })}
              />
              <span>24-hour format</span>
            </label>
            <label className="format-option">
              <input
                type="checkbox"
                checked={displayFormat.showDate}
                onChange={(e) => onConfigUpdate({
                  ...config,
                  displayFormat: { ...displayFormat, showDate: e.target.checked }
                })}
              />
              <span>Show date</span>
            </label>
            <label className="format-option">
              <input
                type="checkbox"
                checked={displayFormat.showDayOfWeek}
                disabled={!displayFormat.showDate}
                onChange={(e) => onConfigUpdate({
                  ...config,
                  displayFormat: { ...displayFormat, showDayOfWeek: e.target.checked }
                })}
              />
              <span>Show day of week</span>
            </label>
            <label className="format-option">
              <input
                type="checkbox"
                checked={displayFormat.showTimezone}
                onChange={(e) => onConfigUpdate({
                  ...config,
                  displayFormat: { ...displayFormat, showTimezone: e.target.checked }
                })}
              />
              <span>Show timezone code</span>
            </label>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="world-clock-widget">
      <div className="world-clock-header">
        <div className="time-slider-container">
          <div className="time-slider-header">
            <span className="time-slider-label">Time Travel</span>
            <span className="time-offset-display">{formatOffsetDisplay(timeOffset)}</span>
          </div>
          <div className="time-slider-wrapper">
            <span className="time-slider-bound">-24h</span>
            <input
              type="range"
              className="time-slider"
              min="-24"
              max="24"
              value={timeOffset}
              onChange={(e) => handleTimeOffsetChange(e.target.value)}
              style={{
                '--slider-progress': `${((timeOffset + 24) / 48) * 100}%`
              }}
            />
            <span className="time-slider-bound">+24h</span>
          </div>
          {timeOffset !== 0 && (
            <button 
              className="reset-time-btn"
              onClick={resetTime}
              title="Reset to current time"
            >
              Reset
            </button>
          )}
        </div>
      </div>
      
      <div className="clock-list">
        {clocks.length === 0 ? (
          <div className="clock-empty">
            <Globe size={32} />
            <p>No clocks added</p>
            <p className="clock-empty-hint">Configure in settings</p>
          </div>
        ) : (
          <ReactSortable
            list={clocks.map((clock, index) => ({ ...clock, id: `${clock.timezone}-${index}` }))}
            setList={(newList) => {
              // eslint-disable-next-line no-unused-vars
              const reordered = newList.map(({ id, ...clock }) => clock)
              onConfigUpdate({ ...config, clocks: reordered })
            }}
            animation={200}
            handle=".clock-drag-handle"
            className="clock-list-sortable"
            ghostClass="clock-ghost"
            dragClass="clock-drag"
          >
            {clocks.map((clock, index) => {
              const { time, date } = formatTime(clock.timezone)
              const currentOffset = getCurrentOffset(clock.timezone)
              return (
                <div key={`${clock.timezone}-${index}`} className="clock-item" data-id={`${clock.timezone}-${index}`}>
                  <div className="clock-drag-handle" title="Drag to reorder">
                    <GripVertical size={14} />
                  </div>
                  <div className="clock-info">
                    <div className="clock-city-row">
                      <span className="clock-city">{clock.city}</span>
                      <span className="clock-gmt">GMT{currentOffset || clock.offset}</span>
                    </div>
                    {displayFormat.showDate && date && (
                      <div className="clock-date">{date}</div>
                    )}
                    {displayFormat.showTimezone && (
                      <div className="clock-timezone-code">{clock.timezone.split('/').pop()}</div>
                    )}
                  </div>
                  <div className="clock-time">{time}</div>
                </div>
              )
            })}
          </ReactSortable>
        )}
      </div>
    </div>
  )
}

export default WorldClockWidget