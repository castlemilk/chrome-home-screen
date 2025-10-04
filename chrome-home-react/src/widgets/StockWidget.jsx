import { useState, useEffect, useMemo } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { ParentSize } from '@visx/responsive'
import { LinePath, AreaClosed, Line } from '@visx/shape'
import { curveMonotoneX } from '@visx/curve'
import { scaleTime, scaleLinear } from '@visx/scale'
import { GradientTealBlue } from '@visx/gradient'
import { useTooltip, TooltipWithBounds, defaultStyles } from '@visx/tooltip'
import { localPoint } from '@visx/event'
import { bisector } from '@visx/vendor/d3-array'
import { Group } from '@visx/group'
import cacheService, { CacheConfig } from '../services/cache'

// Enhanced Sparkline component with window selection
const Sparkline = ({ data, width, height, symbol }) => {
  const {
    tooltipData,
    tooltipLeft,
    tooltipTop,
    tooltipOpen,
    showTooltip,
    hideTooltip,
  } = useTooltip()
  
  const [selectionStart, setSelectionStart] = useState(null)
  const [selectionEnd, setSelectionEnd] = useState(null)
  const [isDragging, setIsDragging] = useState(false)

  // Accessors
  const getDate = (d) => new Date(d.timestamp * 1000)
  const getPrice = (d) => d.close

  // Scales
  const dateScale = useMemo(
    () =>
      scaleTime({
        range: [0, width],
        domain: [getDate(data[0]), getDate(data[data.length - 1])],
      }),
    [width, data]
  )

  const priceScale = useMemo(() => {
    const prices = data.map(getPrice)
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)
    const padding = (maxPrice - minPrice) * 0.1
    
    return scaleLinear({
      range: [height, 0],
      domain: [minPrice - padding, maxPrice + padding],
      nice: true,
    })
  }, [height, data])

  // Bisector for tooltip
  const bisectDate = bisector((d) => getDate(d)).left
  
  // Calculate percentage change for selection
  const getSelectionChange = () => {
    if (!selectionStart || !selectionEnd || !data.length) return null
    
    const startIndex = bisectDate(data, selectionStart, 1)
    const endIndex = bisectDate(data, selectionEnd, 1)
    
    if (startIndex >= data.length || endIndex >= data.length) return null
    
    const startPrice = data[Math.max(0, startIndex - 1)]?.close || data[0].close
    const endPrice = data[Math.min(data.length - 1, endIndex)]?.close || data[data.length - 1].close
    
    const change = ((endPrice - startPrice) / startPrice) * 100
    return change
  }

  // Handle mouse events for selection
  const [dragStartX, setDragStartX] = useState(null)
  
  const handleMouseDown = (event) => {
    const { x } = localPoint(event) || { x: 0 }
    setDragStartX(x)
    setIsDragging(true)
  }
  
  const [cursorX, setCursorX] = useState(null)
  
  const handleMouseMove = (event) => {
    const { x } = localPoint(event) || { x: 0 }
    setCursorX(x)
    
    if (isDragging && dragStartX !== null) {
      // Only start selection if dragged more than 10 pixels
      const dragDistance = Math.abs(x - dragStartX)
      if (dragDistance > 10) {
        if (!selectionStart) {
          // Initialize selection on first significant drag
          const startDate = dateScale.invert(dragStartX)
          setSelectionStart(startDate)
        }
        const date = dateScale.invert(x)
        setSelectionEnd(date)
        hideTooltip() // Hide regular tooltip during selection
      }
    } else if (!isDragging) {
      // Handle tooltip only when not dragging
      const x0 = dateScale.invert(x)
      const index = bisectDate(data, x0, 1)
      const d0 = data[index - 1]
      const d1 = data[index]
      let d = d0
      if (d1 && getDate(d1)) {
        d = x0.valueOf() - getDate(d0).valueOf() > getDate(d1).valueOf() - x0.valueOf() ? d1 : d0
      }
      if (d) {
        showTooltip({
          tooltipData: d,
          tooltipLeft: x,
          tooltipTop: priceScale(getPrice(d)),
        })
      }
    }
  }
  
  const handleMouseUp = () => {
    // Clear selection if it was just a click (no significant drag)
    if (selectionStart && selectionEnd) {
      const startX = dateScale(selectionStart)
      const endX = dateScale(selectionEnd)
      if (Math.abs(endX - startX) < 10) {
        setSelectionStart(null)
        setSelectionEnd(null)
      }
    }
    setIsDragging(false)
    setDragStartX(null)
  }
  
  const handleMouseLeave = () => {
    setIsDragging(false)
    hideTooltip()
    // Clear selection when leaving chart
    setSelectionStart(null)
    setSelectionEnd(null)
  }
  
  const clearSelection = () => {
    setSelectionStart(null)
    setSelectionEnd(null)
  }

  const isPositive = data[data.length - 1].close >= data[0].close
  const color = isPositive ? '#10b981' : '#ef4444'
  
  const selectionChange = getSelectionChange()
  const selectionColor = selectionChange && selectionChange >= 0 ? '#10b981' : '#ef4444'

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'visible' }}>
      <svg width={width} height={height} style={{ cursor: isDragging ? 'col-resize' : 'crosshair', display: 'block' }}>
        <defs>
          <linearGradient id={`gradient-${symbol}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <Group>
          {/* Area chart */}
          <AreaClosed
            data={data}
            x={(d) => dateScale(getDate(d))}
            y={(d) => priceScale(getPrice(d))}
            yScale={priceScale}
            strokeWidth={0}
            fill={`url(#gradient-${symbol})`}
            curve={curveMonotoneX}
          />
          
          {/* Line path */}
          <LinePath
            data={data}
            x={(d) => dateScale(getDate(d))}
            y={(d) => priceScale(getPrice(d))}
            stroke={color}
            strokeWidth={2}
            strokeOpacity={0.8}
            curve={curveMonotoneX}
          />
          
          {/* Selection visualization - render after main line so it appears on top */}
          {selectionStart && selectionEnd && (() => {
            const startIndex = bisectDate(data, selectionStart, 1)
            const endIndex = bisectDate(data, selectionEnd, 1)
            const selectedData = data.slice(Math.max(0, startIndex - 1), Math.min(data.length, endIndex + 1))
            
            if (selectedData.length > 1) {
              return (
                <g>
                  {/* Highlight the selected portion of the line */}
                  <LinePath
                    data={selectedData}
                    x={(d) => dateScale(getDate(d))}
                    y={(d) => priceScale(getPrice(d))}
                    stroke={selectionColor}
                    strokeWidth={4}
                    strokeOpacity={1}
                    curve={curveMonotoneX}
                    pointerEvents="none"
                  />
                  
                  {/* Start vertical line */}
                  <Line
                    from={{ x: dateScale(getDate(selectedData[0])), y: 0 }}
                    to={{ x: dateScale(getDate(selectedData[0])), y: height }}
                    stroke={selectionColor}
                    strokeWidth={2}
                    opacity={0.8}
                    pointerEvents="none"
                  />
                  
                  {/* End vertical line */}
                  <Line
                    from={{ x: dateScale(getDate(selectedData[selectedData.length - 1])), y: 0 }}
                    to={{ x: dateScale(getDate(selectedData[selectedData.length - 1])), y: height }}
                    stroke={selectionColor}
                    strokeWidth={2}
                    opacity={0.8}
                    pointerEvents="none"
                  />
                  
                  {/* Start marker */}
                  <circle
                    cx={dateScale(getDate(selectedData[0]))}
                    cy={priceScale(getPrice(selectedData[0]))}
                    r={5}
                    fill={selectionColor}
                    stroke="white"
                    strokeWidth={2}
                    pointerEvents="none"
                  />
                  
                  {/* End marker */}
                  <circle
                    cx={dateScale(getDate(selectedData[selectedData.length - 1]))}
                    cy={priceScale(getPrice(selectedData[selectedData.length - 1]))}
                    r={5}
                    fill={selectionColor}
                    stroke="white"
                    strokeWidth={2}
                    pointerEvents="none"
                  />
                </g>
              )
            }
            return null
          })()}
          
          {/* Interactive overlay */}
          <rect
            width={width}
            height={height}
            fill="transparent"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            style={{ cursor: isDragging ? 'col-resize' : 'crosshair' }}
          />
          
          {/* Tooltip visualization */}
          {tooltipData && tooltipOpen && !isDragging && (
            <g>
              <Line
                from={{ x: tooltipLeft, y: 0 }}
                to={{ x: tooltipLeft, y: height }}
                stroke={color}
                strokeWidth={1}
                pointerEvents="none"
                strokeDasharray="2,2"
                opacity={0.5}
              />
              <circle
                cx={dateScale(getDate(tooltipData))}
                cy={priceScale(getPrice(tooltipData))}
                r={4}
                fill={color}
                stroke="white"
                strokeWidth={2}
                style={{ pointerEvents: 'none' }}
              />
            </g>
          )}
        </Group>
      </svg>
      
      {/* Selection change indicator - follows cursor */}
      {selectionChange !== null && selectionStart && selectionEnd && Math.abs(dateScale(selectionEnd) - dateScale(selectionStart)) > 5 && cursorX && (
        <div
          style={{
            position: 'absolute',
            left: cursorX + 15,
            top: 20,
            background: 'rgba(0, 0, 0, 0.85)',
            color: selectionColor,
            padding: '6px 10px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 'bold',
            pointerEvents: 'none',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
            whiteSpace: 'nowrap',
            zIndex: 10,
          }}
        >
          {selectionChange >= 0 ? '+' : ''}{selectionChange.toFixed(2)}%
        </div>
      )}
      
      {/* Tooltip with bounds checking */}
      {tooltipOpen && tooltipData && !isDragging && (
        <TooltipWithBounds
          key={Math.random()} // Force recalculation of position
          top={tooltipTop - 12}
          left={tooltipLeft}
          style={{
            ...defaultStyles,
            background: 'rgba(15, 15, 15, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: 'white',
            padding: '10px 12px',
            borderRadius: '8px',
            fontSize: '12px',
            pointerEvents: 'none',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
            minWidth: '120px',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
          }}
          offsetLeft={12}
          offsetTop={12}
        >
          <div style={{ 
            fontWeight: 'bold', 
            fontSize: '14px',
            marginBottom: '4px',
            color: '#ffffff'
          }}>
            ${getPrice(tooltipData).toFixed(2)}
          </div>
          <div style={{ 
            fontSize: '11px', 
            opacity: 0.8,
            color: 'rgba(255, 255, 255, 0.8)'
          }}>
            {(() => {
              const date = new Date(tooltipData.timestamp * 1000)
              const time = date.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
              })
              const day = date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
              })
              return `${day} · ${time}`
            })()}
          </div>
        </TooltipWithBounds>
      )}
    </div>
  )
}

const StockWidget = ({ config, onConfigUpdate, isConfigMode }) => {
  const [stocks, setStocks] = useState([])
  const [loading, setLoading] = useState(true)
  const [newSymbol, setNewSymbol] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [searchTimeout, setSearchTimeout] = useState(null)
  const [interval, setInterval] = useState(config.interval || '1d')

  // Interval options
  const intervals = [
    { value: '1d', label: '1D', range: '1d' },
    { value: '5d', label: '5D', range: '5d' },
    { value: '1mo', label: '1M', range: '1mo' },
    { value: '3mo', label: '3M', range: '3mo' },
    { value: '6mo', label: '6M', range: '6mo' },
    { value: '1y', label: '1Y', range: '1y' },
  ]

  // Fetch stock data using Yahoo Finance
  const fetchStockData = async () => {
    if (!config.symbols || config.symbols.length === 0) {
      setLoading(false)
      return
    }

    const currentInterval = config.interval || '1d'
    const intervalData = intervals.find(i => i.value === currentInterval) || intervals[0]

    try {
      const promises = config.symbols.map(async (symbol) => {
        try {
          // Using cache service for stock data
          const interval = intervalData.value === '1d' ? '5m' : intervalData.value === '5d' ? '30m' : '1d'
          const cacheKey = `stock_${symbol}_${interval}_${intervalData.range}`
          
          // Determine cache duration based on market hours
          const now = new Date()
          const isMarketHours = now.getDay() !== 0 && now.getDay() !== 6 && 
                                now.getHours() >= 9 && now.getHours() < 16
          const maxAge = isMarketHours ? CacheConfig.STOCKS.maxAge : 15 * 60 * 1000 // 15 min outside market
          
          const data = await cacheService.fetchWithCache(
            `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`,
            {
              params: {
                interval,
                range: intervalData.range
              },
              maxAge
            }
          )
          
          if (data.chart && data.chart.result && data.chart.result[0]) {
            const result = data.chart.result[0]
            const quote = result.indicators.quote[0]
            const meta = result.meta
            const timestamps = result.timestamp
            
            const currentPrice = meta.regularMarketPrice || quote.close[quote.close.length - 1]
            const previousClose = meta.previousClose || meta.chartPreviousClose
            const change = currentPrice - previousClose
            const changePercent = (change / previousClose) * 100
            
            // Prepare chart data
            const chartData = timestamps
              .map((timestamp, index) => ({
                timestamp,
                close: quote.close[index],
                high: quote.high[index],
                low: quote.low[index],
                open: quote.open[index],
              }))
              .filter(d => d.close !== null)
            
            return {
              symbol: symbol,
              price: currentPrice,
              change: change,
              changePercent: changePercent,
              previousClose: previousClose,
              chartData: chartData,
              error: false
            }
          }
        } catch (err) {
          console.error(`Error fetching ${symbol}:`, err)
          return {
            symbol: symbol,
            price: 0,
            change: 0,
            changePercent: 0,
            chartData: [],
            error: true
          }
        }
      })

      const stockData = await Promise.all(promises)
      setStocks(stockData)
      setLoading(false)
    } catch (error) {
      console.error('Stock fetch error:', error)
      setLoading(false)
    }
  }

  // Search stocks using Yahoo Finance
  const searchStocks = async (query) => {
    if (query.length < 1) {
      setSuggestions([])
      return
    }

    try {
      const response = await fetch(
        `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=10&newsCount=0&listsCount=0&enableFuzzyQuery=false`
      )
      const data = await response.json()
      
      if (data.quotes && data.quotes.length > 0) {
        setSuggestions(data.quotes.filter(quote => 
          quote.quoteType === 'EQUITY' || quote.quoteType === 'ETF'
        ).slice(0, 8))
      } else {
        setSuggestions([])
      }
    } catch (error) {
      console.error('Stock search error:', error)
      setSuggestions([])
    }
  }

  // Handle search with debounce
  const handleSearchInput = (value) => {
    setSearchQuery(value)
    
    if (searchTimeout) clearTimeout(searchTimeout)
    
    const timeout = setTimeout(() => {
      searchStocks(value)
    }, 300)
    
    setSearchTimeout(timeout)
  }

  // Add stock from search
  const addStockFromSearch = (quote) => {
    if (!config.symbols.includes(quote.symbol)) {
      onConfigUpdate({
        ...config,
        symbols: [...config.symbols, quote.symbol]
      })
    }
    setSearchQuery('')
    setSuggestions([])
  }

  useEffect(() => {
    fetchStockData()
    const intervalId = setInterval(fetchStockData, 60000) // Update every minute
    return () => clearInterval(intervalId)
  }, [config.symbols, config.interval])

  const handleIntervalChange = (newInterval) => {
    onConfigUpdate({
      ...config,
      interval: newInterval
    })
  }

  const addStock = () => {
    if (newSymbol && !config.symbols.includes(newSymbol.toUpperCase())) {
      onConfigUpdate({
        ...config,
        symbols: [...config.symbols, newSymbol.toUpperCase()]
      })
      setNewSymbol('')
    }
  }

  const removeStock = (symbol) => {
    onConfigUpdate({
      ...config,
      symbols: config.symbols.filter(s => s !== symbol)
    })
  }

  if (isConfigMode) {
    return (
      <div className="widget-config-content">
        <div className="config-group">
          <label className="config-label">Stock Symbols</label>
          <div className="stock-symbols-list">
            {config.symbols.map((symbol) => (
              <div key={symbol} className="stock-symbol-item">
                <span>{symbol}</span>
                <button
                  className="stock-remove-btn"
                  onClick={() => removeStock(symbol)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <div className="stock-search-container">
            <input
              type="text"
              className="config-input"
              placeholder="Search stocks..."
              value={searchQuery}
              onChange={(e) => handleSearchInput(e.target.value)}
            />
            {suggestions.length > 0 && (
              <div className="stock-suggestions">
                {suggestions.map((quote) => (
                  <div
                    key={quote.symbol}
                    className="stock-suggestion"
                    onClick={() => addStockFromSearch(quote)}
                  >
                    <div className="stock-suggestion-symbol">{quote.symbol}</div>
                    <div className="stock-suggestion-name">{quote.shortname || quote.longname}</div>
                    <div className="stock-suggestion-type">{quote.exchDisp}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="config-group">
          <label className="config-label">Chart Interval</label>
          <div className="interval-selector">
            {intervals.map((int) => (
              <button
                key={int.value}
                className={`interval-btn ${config.interval === int.value ? 'active' : ''}`}
                onClick={() => handleIntervalChange(int.value)}
              >
                {int.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="stock-widget">
        <div className="stock-loading">Loading stocks...</div>
      </div>
    )
  }

  if (stocks.length === 0) {
    return (
      <div className="stock-widget">
        <div className="stock-empty">Add stocks in settings</div>
      </div>
    )
  }

  return (
    <div className="stock-widget">
      <div className="stock-interval-header">
        {intervals.map((int) => (
          <button
            key={int.value}
            className={`interval-btn ${(config.interval || '1d') === int.value ? 'active' : ''}`}
            onClick={() => handleIntervalChange(int.value)}
          >
            {int.label}
          </button>
        ))}
      </div>
      <div className="stock-list">
        {stocks.map((stock) => {
          if (stock.error) {
            return (
              <div key={stock.symbol} className="stock-item error">
                <div className="stock-info">
                  <div className="stock-symbol">{stock.symbol}</div>
                  <div className="stock-error">Unable to load</div>
                </div>
              </div>
            )
          }
          
          const isPositive = stock.change > 0
          const isNegative = stock.change < 0
          
          return (
            <div key={stock.symbol} className="stock-item">
              <div className="stock-main">
                <div className="stock-info">
                  <div className="stock-symbol">{stock.symbol}</div>
                  <div className="stock-price">${stock.price.toFixed(2)}</div>
                </div>
                <div className={`stock-change ${isPositive ? 'positive' : isNegative ? 'negative' : 'neutral'}`}>
                  <div className="stock-change-icon">
                    {isPositive ? <TrendingUp size={16} /> : isNegative ? <TrendingDown size={16} /> : <Minus size={16} />}
                  </div>
                  <div className="stock-change-values">
                    <div className="stock-change-amount">
                      {isPositive ? '+' : ''}{stock.change.toFixed(2)}
                    </div>
                    <div className="stock-change-percent">
                      ({isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%)
                    </div>
                  </div>
                </div>
              </div>
              {stock.chartData && stock.chartData.length > 0 && (
                <div className="stock-chart">
                  <ParentSize>
                    {({ width, height }) => (
                      <Sparkline 
                        data={stock.chartData} 
                        width={width} 
                        height={height || 50} 
                        symbol={stock.symbol}
                      />
                    )}
                  </ParentSize>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default StockWidget