import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Grip, Settings, X } from 'lucide-react'
import GoogleWeatherWidget from '../widgets/GoogleWeatherWidget'
import StockWidget from '../widgets/StockWidget'
import WorldClockWidget from '../widgets/WorldClockWidget'
import TodoWidget from '../widgets/TodoWidget'
import CalendarWidget from '../widgets/CalendarWidget'
import NewsWidget from '../widgets/NewsWidget'
import SearchHistoryWidget from '../widgets/SearchHistoryWidget'
import GoogleAppsWidget from '../widgets/GoogleAppsWidget'

const WIDGET_COMPONENTS = {
  'weather': GoogleWeatherWidget,
  'stocks': StockWidget,
  'world-clock': WorldClockWidget,
  'todo': TodoWidget,
  'calendar': CalendarWidget,
  'news': NewsWidget,
  'search-history': SearchHistoryWidget,
  'google-apps': GoogleAppsWidget
}

const WidgetContainer = ({ widget, onRemove, onConfigUpdate, editMode, onChatHistoryClick }) => {
  const [showConfig, setShowConfig] = useState(false)
  const WidgetComponent = WIDGET_COMPONENTS[widget.type]

  if (!WidgetComponent) {
    return null
  }

  return (
    <motion.div
      className="widget-container"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
    >
      {!editMode && (
        <div className="widget-header">
          <div className="widget-actions">
            <button
              className="widget-action-btn"
              onClick={() => setShowConfig(!showConfig)}
            >
              <Settings size={16} />
            </button>
            <button
              className="widget-action-btn"
              onClick={() => {
                if (showConfig) {
                  setShowConfig(false)
                } else {
                  onRemove(widget.id)
                }
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {showConfig ? (
          <motion.div
            key="config"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="widget-config"
          >
            <WidgetComponent
              config={widget.config}
              onConfigUpdate={onConfigUpdate}
              isConfigMode={true}
              onItemClick={widget.type === 'search-history' ? onChatHistoryClick : undefined}
            />
          </motion.div>
        ) : (
          <motion.div
            key="widget"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="widget-content"
          >
            <WidgetComponent
              config={widget.config}
              onConfigUpdate={onConfigUpdate}
              isConfigMode={false}
              onItemClick={widget.type === 'search-history' ? onChatHistoryClick : undefined}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default WidgetContainer