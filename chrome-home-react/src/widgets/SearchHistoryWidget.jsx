import { useState } from 'react'
import { Clock, X, Trash2, ExternalLink, Search, Globe, Image, FileText, Video, ShoppingBag } from 'lucide-react'
import { useSettings } from '../contexts/SettingsContext'

const SearchHistoryWidget = ({ config, onConfigUpdate, isConfigMode, onItemClick }) => {
  const { searchHistory, removeSearchHistoryItem, clearSearchHistory } = useSettings()
  const [showConfirmClear, setShowConfirmClear] = useState(false)
  
  // Get icon for search type
  const getTypeIcon = (type) => {
    switch(type) {
      case 'images': return <Image size={14} />
      case 'videos': return <Video size={14} />
      case 'news': return <FileText size={14} />
      case 'shopping': return <ShoppingBag size={14} />
      case 'sites': return <Globe size={14} />
      case 'direct': return <Globe size={14} />
      default: return <Search size={14} />
    }
  }
  
  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date
    
    // Less than 1 minute
    if (diff < 60000) return 'Just now'
    
    // Less than 1 hour
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000)
      return `${minutes}m ago`
    }
    
    // Less than 24 hours
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000)
      return `${hours}h ago`
    }
    
    // Less than 7 days
    if (diff < 604800000) {
      const days = Math.floor(diff / 86400000)
      return `${days}d ago`
    }
    
    // Default to date
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
  
  // Limit display items based on config
  const displayLimit = config.displayLimit || 10
  const displayItems = searchHistory.slice(0, displayLimit)
  
  if (isConfigMode) {
    return (
      <div className="widget-config-content">
        <div className="config-group">
          <label className="config-label">Display Settings</label>
          <div className="config-row">
            <label>Items to show</label>
            <input
              type="number"
              className="config-input small"
              value={displayLimit}
              onChange={(e) => onConfigUpdate({ ...config, displayLimit: parseInt(e.target.value) || 10 })}
              min="5"
              max="50"
            />
          </div>
        </div>
        
        <div className="config-group">
          <label className="config-label">History Management</label>
          <div className="history-stats">
            <p>{searchHistory.length} items in history</p>
          </div>
          {showConfirmClear ? (
            <div className="confirm-clear">
              <p>Are you sure you want to clear all history?</p>
              <div className="confirm-buttons">
                <button 
                  className="config-button danger"
                  onClick={() => {
                    clearSearchHistory()
                    setShowConfirmClear(false)
                  }}
                >
                  Yes, Clear All
                </button>
                <button 
                  className="config-button"
                  onClick={() => setShowConfirmClear(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button 
              className="config-button danger"
              onClick={() => setShowConfirmClear(true)}
            >
              <Trash2 size={16} />
              Clear All History
            </button>
          )}
        </div>
      </div>
    )
  }
  
  if (searchHistory.length === 0) {
    return (
      <div className="search-history-widget">
        <div className="history-empty">
          <Clock size={32} />
          <p>No search history yet</p>
          <p className="history-empty-hint">Your searches will appear here</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="search-history-widget">
      <div className="history-list">
        {displayItems.map((item) => (
          <div 
            key={item.id} 
            className="history-item clickable"
            onClick={() => {
              if (item.type === 'chat' && onItemClick) {
                onItemClick(item)
              } else if (item.url === '#' && item.query) {
                // For search items with placeholder URL, re-perform the search
                if (window.chrome?.search?.query) {
                  window.chrome.search.query({
                    text: item.query,
                    disposition: 'CURRENT_TAB'
                  })
                } else {
                  // Fallback to Google search
                  window.location.href = `https://www.google.com/search?q=${encodeURIComponent(item.query)}`
                }
              } else if (item.url && item.url !== '#') {
                // Open the URL for direct navigation items
                window.location.href = item.url
              }
            }}
            style={{ cursor: 'pointer' }}
          >
            <div className="history-favicon">
              <img 
                src={item.favicon} 
                alt=""
                onError={(e) => {
                  e.target.style.display = 'none'
                  e.target.nextSibling.style.display = 'flex'
                }}
              />
              <div className="favicon-fallback" style={{ display: 'none' }}>
                {getTypeIcon(item.type)}
              </div>
            </div>
            
            <div className="history-content">
              <div className="history-title">{item.title}</div>
              <div className="history-meta">
                <span className="history-time">{formatTime(item.timestamp)}</span>
                {item.type !== 'all' && item.type !== 'direct' && (
                  <span className="history-type">
                    {getTypeIcon(item.type)}
                    <span>{item.type}</span>
                  </span>
                )}
              </div>
            </div>
            
            <div className="history-actions">
              {item.type === 'chat' ? (
                <button
                  className="history-action"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (onItemClick) {
                      onItemClick(item)
                    }
                  }}
                  title="Open Chat"
                >
                  <ExternalLink size={14} />
                </button>
              ) : item.url && item.url !== '#' ? (
                <a
                  href={item.url}
                  className="history-action"
                  title="Open"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink size={14} />
                </a>
              ) : null}
              <button
                className="history-action"
                onClick={(e) => {
                  e.stopPropagation()
                  removeSearchHistoryItem(item.id)
                }}
                title="Remove"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {searchHistory.length > displayLimit && (
        <div className="history-footer">
          <span className="history-more">
            +{searchHistory.length - displayLimit} more items
          </span>
        </div>
      )}
    </div>
  )
}

export default SearchHistoryWidget