import { useState, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Settings, Move } from 'lucide-react'
import { Responsive, WidthProvider } from 'react-grid-layout'
import WidgetContainer from './components/WidgetContainer'
import TimeDisplay from './components/TimeDisplay'
import Greeting from './components/Greeting'
import SearchBar from './components/SearchBar'
import BackgroundSelector from './components/BackgroundSelector'
import SettingsPanel from './components/SettingsPanel'
import { WidgetProvider } from './contexts/WidgetContext'
import { SettingsProvider } from './contexts/SettingsContext'
import { storage } from './utils/storage'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

// Available widget types
export const WIDGET_TYPES = {
  WEATHER: {
    id: 'weather',
    name: 'Weather',
    description: 'Current weather and forecast',
    icon: '🌤️',
    defaultConfig: {
      location: '',
      units: 'celsius'
    },
    defaultSize: { w: 4, h: 5 },
    minSize: { w: 2, h: 2 },
    responsiveMinSize: {
      xl: { w: 3, h: 3 },
      lg: { w: 3, h: 3 },
      md: { w: 2, h: 2 },
      sm: { w: 2, h: 2 },
      xs: { w: 2, h: 2 },
      xxs: { w: 2, h: 2 }
    }
  },
  STOCKS: {
    id: 'stocks',
    name: 'Stocks',
    description: 'Track your favorite stocks',
    icon: '📈',
    defaultConfig: {
      symbols: ['AAPL', 'GOOGL', 'MSFT'],
      period: '1d'
    },
    defaultSize: { w: 4, h: 5 },
    minSize: { w: 2, h: 3 },
    responsiveMinSize: {
      xl: { w: 3, h: 4 },
      lg: { w: 3, h: 4 },
      md: { w: 2, h: 3 },
      sm: { w: 2, h: 3 },
      xs: { w: 1, h: 3 },
      xxs: { w: 1, h: 3 }
    }
  },
  WORLD_CLOCK: {
    id: 'world-clock',
    name: 'World Clock',
    description: 'Multiple time zones at a glance',
    icon: '🌍',
    defaultConfig: {
      timezones: [
        { city: 'New York', timezone: 'America/New_York' },
        { city: 'London', timezone: 'Europe/London' },
        { city: 'Tokyo', timezone: 'Asia/Tokyo' }
      ]
    },
    defaultSize: { w: 4, h: 5 },
    minSize: { w: 2, h: 3 },
    responsiveMinSize: {
      xl: { w: 3, h: 4 },
      lg: { w: 3, h: 4 },
      md: { w: 2, h: 3 },
      sm: { w: 2, h: 3 },
      xs: { w: 1, h: 2 },
      xxs: { w: 1, h: 2 }
    }
  },
  TODO: {
    id: 'todo',
    name: 'Todo List',
    description: 'Keep track of your tasks',
    icon: '✅',
    defaultConfig: {
      lists: ['Personal', 'Work']
    },
    defaultSize: { w: 3, h: 5 },
    minSize: { w: 2, h: 3 },
    responsiveMinSize: {
      xl: { w: 3, h: 4 },
      lg: { w: 3, h: 4 },
      md: { w: 2, h: 3 },
      sm: { w: 2, h: 3 },
      xs: { w: 1, h: 3 },
      xxs: { w: 1, h: 3 }
    }
  },
  CALENDAR: {
    id: 'calendar',
    name: 'Calendar',
    description: 'View your upcoming events',
    icon: '📅',
    defaultConfig: {
      view: 'week'
    },
    defaultSize: { w: 6, h: 5 },
    minSize: { w: 2, h: 3 },
    responsiveMinSize: {
      xl: { w: 4, h: 4 },
      lg: { w: 4, h: 4 },
      md: { w: 3, h: 3 },
      sm: { w: 2, h: 3 },
      xs: { w: 1, h: 3 },
      xxs: { w: 1, h: 3 }
    }
  },
  NEWS: {
    id: 'news',
    name: 'News Feed',
    description: 'Stay updated with latest news',
    icon: '📰',
    defaultConfig: {
      sources: ['tech', 'world']
    },
    defaultSize: { w: 5, h: 6 },
    minSize: { w: 2, h: 3 },
    responsiveMinSize: {
      xl: { w: 4, h: 4 },
      lg: { w: 3, h: 4 },
      md: { w: 3, h: 3 },
      sm: { w: 3, h: 3 },
      xs: { w: 2, h: 3 },
      xxs: { w: 2, h: 3 }
    }
  },
  SEARCH_HISTORY: {
    id: 'search-history',
    name: 'Search History',
    description: 'Recent searches with favicons',
    icon: '🔍',
    defaultConfig: {
      displayLimit: 10
    },
    defaultSize: { w: 4, h: 4 },
    minSize: { w: 2, h: 2 },
    responsiveMinSize: {
      xl: { w: 3, h: 3 },
      lg: { w: 3, h: 3 },
      md: { w: 2, h: 2 },
      sm: { w: 2, h: 2 },
      xs: { w: 1, h: 2 },
      xxs: { w: 1, h: 2 }
    }
  }
}

const ResponsiveGridLayout = WidthProvider(Responsive)

// Default layouts for different screen sizes
const defaultLayouts = {
  xl: [
    { i: 'time-display', x: 4, y: 0, w: 4, h: 2, static: false, minW: 3, minH: 1, maxW: 12 },
    { i: 'greeting', x: 4, y: 2, w: 4, h: 1, static: false, minW: 3, minH: 1, maxW: 12 },
    { i: 'search-bar', x: 4, y: 3, w: 4, h: 1, static: false, minW: 3, minH: 1, maxW: 8 }, // Narrower search bar
  ],
  lg: [
    { i: 'time-display', x: 4, y: 0, w: 4, h: 2, static: false, minW: 3, minH: 1, maxW: 12 },
    { i: 'greeting', x: 4, y: 2, w: 4, h: 1, static: false, minW: 3, minH: 1, maxW: 12 },
    { i: 'search-bar', x: 4, y: 3, w: 4, h: 1, static: false, minW: 3, minH: 1, maxW: 8 }, // Narrower search bar
  ],
  md: [
    { i: 'time-display', x: 2, y: 0, w: 4, h: 2, static: false, minW: 3, minH: 1, maxW: 8 },
    { i: 'greeting', x: 2, y: 2, w: 4, h: 1, static: false, minW: 3, minH: 1, maxW: 8 },
    { i: 'search-bar', x: 2, y: 3, w: 4, h: 1, static: false, minW: 3, minH: 1, maxW: 6 }, // Narrower search bar
  ],
  sm: [
    { i: 'time-display', x: 1, y: 0, w: 4, h: 2, static: false, minW: 3, minH: 1, maxW: 6 },
    { i: 'greeting', x: 1, y: 2, w: 4, h: 1, static: false, minW: 3, minH: 1, maxW: 6 },
    { i: 'search-bar', x: 1, y: 3, w: 4, h: 1, static: false, minW: 3, minH: 1, maxW: 5 }, // Narrower search bar
  ],
  xs: [
    { i: 'time-display', x: 0, y: 0, w: 4, h: 2, static: false, minW: 3, minH: 1, maxW: 4 },
    { i: 'greeting', x: 0, y: 2, w: 4, h: 1, static: false, minW: 3, minH: 1, maxW: 4 },
    { i: 'search-bar', x: 0, y: 3, w: 4, h: 1, static: false, minW: 3, minH: 1, maxW: 4 },
  ],
  xxs: [
    { i: 'time-display', x: 0, y: 0, w: 2, h: 2, static: false, minW: 2, minH: 1, maxW: 2 },
    { i: 'greeting', x: 0, y: 2, w: 2, h: 1, static: false, minW: 2, minH: 1, maxW: 2 },
    { i: 'search-bar', x: 0, y: 3, w: 2, h: 1, static: false, minW: 2, minH: 1, maxW: 2 },
  ]
}

function App() {
  const [widgets, setWidgets] = useState([])
  const [layouts, setLayouts] = useState(defaultLayouts)
  const [showSettings, setShowSettings] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [windowWidth, setWindowWidth] = useState(window.innerWidth)
  const [windowHeight, setWindowHeight] = useState(window.innerHeight)
  const searchBarRef = useRef(null)
  
  // Calculate dynamic row height based on window size
  const calculateRowHeight = () => {
    // Base row height that scales with viewport
    const baseHeight = windowHeight / 15 // Roughly 15 rows in viewport
    // Clamp between min and max values
    const minHeight = 50
    const maxHeight = 100
    return Math.max(minHeight, Math.min(maxHeight, baseHeight))
  }
  
  const [rowHeight, setRowHeight] = useState(calculateRowHeight())
  
  // Update window dimensions on resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
      setWindowHeight(window.innerHeight)
      setRowHeight(calculateRowHeight())
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [windowHeight])
  
  // Add keyboard shortcut for resetting layouts (Ctrl/Cmd + Shift + R)
  useEffect(() => {
    const handleKeyPress = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'R') {
        e.preventDefault()
        resetLayouts()
        console.log('Layouts reset!')
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [widgets])

  // Function to auto-arrange widgets like Lego blocks for each breakpoint
  const autoArrangeWidgets = (widgetIds, breakpoint) => {
    const coreItemIds = ['time-display', 'greeting', 'search-bar']
    
    // Get grid configuration for this breakpoint
    const cols = { xl: 12, lg: 12, md: 8, sm: 6, xs: 4, xxs: 2 }[breakpoint]
    
    // Start placing widgets after core UI elements, but try to place first widgets alongside search
    const startY = 3 // Same row as search bar
    const arrangements = []
    
    // Get default layout for core items
    const coreItems = defaultLayouts[breakpoint] || []
    
    // Track occupied positions
    const occupied = new Set()
    coreItems.forEach(item => {
      for (let x = item.x; x < item.x + item.w; x++) {
        for (let y = item.y; y < item.y + item.h; y++) {
          occupied.add(`${x},${y}`)
        }
      }
    })
    
    // For each widget, find best position
    widgetIds.forEach((widgetId, index) => {
      const widgetType = Object.values(WIDGET_TYPES).find(type => 
        widgetId.startsWith(type.id + '-')
      )
      
      if (!widgetType) return
      
      // Get appropriate size for this breakpoint with better height scaling
      let w, h
      const baseHeight = widgetType.defaultSize?.h || 5
      
      if (breakpoint === 'xxs') {
        w = 2 // Full width on mobile
        // Increase height on mobile to maintain content visibility
        h = Math.ceil(baseHeight * 1.2)
      } else if (breakpoint === 'xs') {
        w = 4 // Full width on xs
        // Slightly increase height to compensate for narrower width
        h = Math.ceil(baseHeight * 1.1)
      } else if (breakpoint === 'sm') {
        w = Math.min(widgetType.defaultSize?.w || 3, 3) // Half width or less
        h = baseHeight
      } else if (breakpoint === 'md') {
        w = Math.min(widgetType.defaultSize?.w || 4, 3) // Narrower to fit alongside search
        h = baseHeight
      } else {
        // lg and xl - use default sizes but limit width to fit alongside search
        w = Math.min(widgetType.defaultSize?.w || 4, 4)
        h = baseHeight
      }
      
      // Apply minimum heights to ensure content is visible
      const minHeight = widgetType.responsiveMinSize?.[breakpoint]?.h || widgetType.minSize?.h || 3
      h = Math.max(h, minHeight)
      
      // Ensure w doesn't exceed cols
      w = Math.min(w, cols)
      
      // For the first two widgets on larger screens, try to place them alongside search bar
      let preferredStartY = startY
      let preferredStartX = 0
      
      if ((breakpoint === 'xl' || breakpoint === 'lg') && index < 2) {
        // Try to place first widget to the left of search, second to the right
        if (index === 0) {
          preferredStartX = 0 // Left side
          preferredStartY = 3 // Same row as search
          w = Math.min(w, 4) // Limit width
        } else if (index === 1) {
          preferredStartX = 8 // Right side
          preferredStartY = 3 // Same row as search
          w = Math.min(w, 4) // Limit width
        }
      } else if (breakpoint === 'md' && index < 2) {
        // For medium screens, try to place alongside but may need to go below
        if (index === 0) {
          preferredStartX = 0 // Left side
          preferredStartY = 3
          w = Math.min(w, 2)
        } else if (index === 1) {
          preferredStartX = 6 // Right side
          preferredStartY = 3
          w = Math.min(w, 2)
        }
      }
      
      // Find first available position that fits
      let placed = false
      
      // First try the preferred position
      if (preferredStartX >= 0 && preferredStartX + w <= cols) {
        let canPlace = true
        for (let dx = 0; dx < w && canPlace; dx++) {
          for (let dy = 0; dy < h && canPlace; dy++) {
            if (occupied.has(`${preferredStartX + dx},${preferredStartY + dy}`)) {
              canPlace = false
            }
          }
        }
        
        if (canPlace) {
          // Mark as occupied
          for (let dx = 0; dx < w; dx++) {
            for (let dy = 0; dy < h; dy++) {
              occupied.add(`${preferredStartX + dx},${preferredStartY + dy}`)
            }
          }
          
          arrangements.push({
            i: widgetId,
            x: preferredStartX,
            y: preferredStartY,
            w: w,
            h: h,
            minW: widgetType.responsiveMinSize?.[breakpoint]?.w || widgetType.minSize?.w || 2,
            minH: widgetType.responsiveMinSize?.[breakpoint]?.h || widgetType.minSize?.h || 3,
            maxW: cols
          })
          placed = true
        }
      }
      
      // If preferred position didn't work, fall back to normal placement
      if (!placed) {
        for (let y = startY; y < startY + 50 && !placed; y++) {
          for (let x = 0; x <= cols - w && !placed; x++) {
            // Check if this position is free
            let canPlace = true
            for (let dx = 0; dx < w && canPlace; dx++) {
              for (let dy = 0; dy < h && canPlace; dy++) {
                if (occupied.has(`${x + dx},${y + dy}`)) {
                  canPlace = false
                }
              }
            }
            
            if (canPlace) {
              // Mark as occupied
              for (let dx = 0; dx < w; dx++) {
                for (let dy = 0; dy < h; dy++) {
                  occupied.add(`${x + dx},${y + dy}`)
                }
              }
              
              arrangements.push({
                i: widgetId,
                x: x,
                y: y,
                w: w,
                h: h,
                minW: widgetType.responsiveMinSize?.[breakpoint]?.w || widgetType.minSize?.w || 2,
                minH: widgetType.responsiveMinSize?.[breakpoint]?.h || widgetType.minSize?.h || 3,
                maxW: cols
              })
              placed = true
            }
          }
        }
      }
    })
    
    return [...coreItems, ...arrangements]
  }

  // Function to rebuild all layouts for current widgets
  const rebuildLayouts = (widgetList) => {
    const widgetIds = widgetList.map(w => w.id)
    const breakpoints = ['xl', 'lg', 'md', 'sm', 'xs', 'xxs']
    const newLayouts = {}
    
    breakpoints.forEach(bp => {
      newLayouts[bp] = autoArrangeWidgets(widgetIds, bp)
    })
    
    return newLayouts
  }

  // Load widgets and layouts from storage
  useEffect(() => {
    storage.sync.get(['widgets', 'layouts'], (result) => {
      if (result.widgets) {
        setWidgets(result.widgets)
      }
      
      // Use saved layouts if they exist, otherwise rebuild or use defaults
      if (result.layouts) {
        setLayouts(result.layouts)
      } else if (result.widgets) {
        // Only rebuild if we have widgets but no saved layouts
        const newLayouts = rebuildLayouts(result.widgets)
        setLayouts(newLayouts)
      } else {
        // No widgets or layouts, use defaults
        setLayouts(defaultLayouts)
      }
    })
  }, [])

  // Save widgets and layouts to storage
  useEffect(() => {
    if (widgets.length > 0) {
      storage.sync.set({ widgets, layouts })
    }
  }, [widgets, layouts])

  // Helper function to find next available position
  const findNextAvailablePosition = (layout, cols, w, h) => {
    // Start after core UI elements (they occupy y: 0-4)
    let startY = 5
    
    // Try to find a position starting from top-right area, then moving across and down
    const maxY = Math.max(startY, layout.reduce((max, item) => Math.max(max, item.y + item.h), startY))
    
    // Search in a more distributed pattern - try different areas of the grid
    const searchAreas = [
      // Right side first (x: 8-12)
      { xStart: Math.max(0, 12 - w), xEnd: 12 - w, yStart: startY, yEnd: startY + 10 },
      // Left side (x: 0-4)  
      { xStart: 0, xEnd: Math.min(4, cols - w), yStart: startY, yEnd: startY + 10 },
      // Middle area (x: 4-8)
      { xStart: 4, xEnd: Math.min(8, cols - w), yStart: startY, yEnd: startY + 10 },
      // Anywhere below existing content
      { xStart: 0, xEnd: cols - w, yStart: maxY, yEnd: maxY + 20 }
    ]
    
    for (const area of searchAreas) {
      for (let y = area.yStart; y <= area.yEnd; y++) {
        for (let x = area.xStart; x <= area.xEnd; x++) {
          const position = { x, y, w, h }
          
          // Check if this position collides with any existing item
          const hasCollision = layout.some(item => {
            return !(position.x + position.w <= item.x || 
                    position.x >= item.x + item.w || 
                    position.y + position.h <= item.y || 
                    position.y >= item.y + item.h)
          })
          
          if (!hasCollision) {
            return { x, y }
          }
        }
      }
    }
    
    // Fallback: put at bottom
    return { x: 0, y: maxY }
  }

  const addWidget = (widgetType) => {
    const newWidgetId = `${widgetType.id}-${Date.now()}`
    const newWidget = {
      id: newWidgetId,
      type: widgetType.id,
      config: { ...widgetType.defaultConfig }
    }
    
    // Add widget to list
    const updatedWidgets = [...widgets, newWidget]
    setWidgets(updatedWidgets)
    
    // Rebuild all layouts with the new widget
    const newLayouts = rebuildLayouts(updatedWidgets)
    setLayouts(newLayouts)
  }

  const removeWidget = (widgetId) => {
    const updatedWidgets = widgets.filter(w => w.id !== widgetId)
    setWidgets(updatedWidgets)
    
    // Rebuild layouts without the removed widget
    const newLayouts = rebuildLayouts(updatedWidgets)
    setLayouts(newLayouts)
  }

  const updateWidgetConfig = (widgetId, newConfig) => {
    setWidgets(widgets.map(w => 
      w.id === widgetId ? { ...w, config: newConfig } : w
    ))
  }

  const onLayoutChange = (currentLayout, allLayouts) => {
    // Only save manual layout changes in edit mode
    if (editMode) {
      setLayouts(allLayouts)
      // Save to storage immediately
      storage.sync.set({ layouts: allLayouts })
    }
  }
  
  // Add a function to reset layouts
  const resetLayouts = () => {
    const newLayouts = rebuildLayouts(widgets)
    setLayouts(newLayouts)
    // Also save to storage
    storage.sync.set({ layouts: newLayouts })
  }
  
  const onDragStart = () => {
    setIsDragging(true)
  }
  
  const onDragStop = () => {
    setIsDragging(false)
  }
  
  const toggleEditMode = () => {
    setEditMode(!editMode)
  }

  return (
    <SettingsProvider>
      <WidgetProvider value={{ widgets, addWidget, removeWidget, updateWidgetConfig }}>
        <div className={`app ${isDragging ? 'dragging' : ''} ${editMode ? 'edit-mode' : ''}`}>
          <BackgroundSelector />
          
          <ResponsiveGridLayout
            className="grid-layout"
            layouts={layouts}
            onLayoutChange={onLayoutChange}
            onDragStart={onDragStart}
            onDragStop={onDragStop}
            breakpoints={{ xl: 1400, lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ xl: 12, lg: 12, md: 8, sm: 6, xs: 4, xxs: 2 }}
            rowHeight={rowHeight}
            margin={windowWidth < 768 ? [8, 8] : [16, 16]}
            containerPadding={windowWidth < 768 ? [10, 10] : [20, 20]}
            isDraggable={editMode}
            isResizable={editMode}
            draggableHandle=".drag-handle"
            resizeHandles={['se']}
            compactType={null}
            preventCollision={true}
            autoSize={false}
            useCSSTransforms={true}
            verticalCompact={false}
          >
            {/* Core UI Elements */}
            <div key="time-display" className="grid-item core-item">
              {editMode && <div className="drag-handle"><Move size={16} /></div>}
              <TimeDisplay />
            </div>
            
            <div key="greeting" className="grid-item core-item">
              {editMode && <div className="drag-handle"><Move size={16} /></div>}
              <Greeting />
            </div>
            
            <div key="search-bar" className="grid-item core-item">
              {editMode && <div className="drag-handle"><Move size={16} /></div>}
              <SearchBar ref={searchBarRef} />
            </div>
            
            {/* Widgets */}
            {widgets.map((widget) => (
              <div key={widget.id} className="grid-item widget-item">
                {editMode && <div className="drag-handle widget-drag-handle"><Move size={16} /></div>}
                <WidgetContainer
                  widget={widget}
                  onRemove={() => removeWidget(widget.id)}
                  onConfigUpdate={(config) => updateWidgetConfig(widget.id, config)}
                  editMode={editMode}
                  onChatHistoryClick={(item) => {
                    if (searchBarRef.current?.restoreChatFromHistory) {
                      searchBarRef.current.restoreChatFromHistory(item)
                    }
                  }}
                />
              </div>
            ))}
          </ResponsiveGridLayout>

          {/* Top Right Action Buttons */}
          <div className="top-actions">
            <motion.button
              className={`edit-mode-btn ${editMode ? 'active' : ''}`}
              onClick={toggleEditMode}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title={editMode ? 'Exit Edit Mode' : 'Edit Layout'}
            >
              <Move size={20} />
            </motion.button>
            
            <motion.button
              className="settings-btn"
              onClick={() => setShowSettings(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Settings size={20} />
            </motion.button>
          </div>


          <AnimatePresence>
            {showSettings && (
              <SettingsPanel
                onClose={() => setShowSettings(false)}
              />
            )}
          </AnimatePresence>
        </div>
      </WidgetProvider>
    </SettingsProvider>
  )
}

export default App