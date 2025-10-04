import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { WIDGET_TYPES } from '../App'

const WidgetMarketplace = ({ onClose, onAddWidget }) => {
  return (
    <motion.div
      className="marketplace-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="widget-selector-container"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="widget-selector-header">
          <h2 className="widget-selector-title">Add Widget</h2>
          <button className="widget-selector-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <div className="widget-selector-scroll">
          <div className="widget-selector-grid">
            {Object.values(WIDGET_TYPES).map((widgetType) => (
              <motion.div
                key={widgetType.id}
                className="widget-option-card"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onAddWidget(widgetType)}
              >
                <div className="widget-option-icon">{widgetType.icon}</div>
                <div className="widget-option-name">{widgetType.name}</div>
                <div className="widget-option-description">{widgetType.description}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default WidgetMarketplace