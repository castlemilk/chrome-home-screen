import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { Settings, RefreshCw, Plus, BarChart3, Palette, Home } from 'lucide-react'
import './popup.css'

/* global chrome */

function Popup() {
  const [userName, setUserName] = useState('')
  const [widgetCount, setWidgetCount] = useState(0)
  const [version, setVersion] = useState('1.0.0')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    // Load user settings and display info
    chrome.storage.sync.get(['settings', 'widgets'], (result) => {
      if (result.settings && result.settings.userName) {
        setUserName(result.settings.userName)
      }
      setWidgetCount(result.widgets ? result.widgets.length : 0)
    })

    // Get version from manifest
    const manifest = chrome.runtime.getManifest()
    setVersion(manifest.version)
  }, [])

  const openNewTab = () => {
    chrome.tabs.create({ url: 'chrome://newtab' })
    window.close()
  }

  const refreshAllData = () => {
    setRefreshing(true)
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const currentTab = tabs[0]
      
      // Check if current tab is our extension's new tab page
      const isExtensionNewTab = currentTab && 
        currentTab.url && 
        (currentTab.url.includes('chrome-extension://') || 
         currentTab.url === 'chrome://newtab/' ||
         currentTab.url === 'chrome://newtab')
      
      if (isExtensionNewTab) {
        // Just reload the tab to refresh all data
        chrome.tabs.reload(currentTab.id, () => {
          setTimeout(() => {
            setRefreshing(false)
            window.close()
          }, 500)
        })
      } else {
        setRefreshing(false)
      }
    })
  }

  const openSettingsTab = (tab = null) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const currentTab = tabs[0]
      
      // Check if current tab is our extension's new tab page
      const isExtensionNewTab = currentTab && 
        currentTab.url && 
        (currentTab.url.includes('chrome-extension://') || 
         currentTab.url === 'chrome://newtab/' ||
         currentTab.url === 'chrome://newtab')
      
      if (isExtensionNewTab) {
        // Store the tab preference and reload to trigger settings
        chrome.storage.local.set({ 
          openSettingsOnLoad: true, 
          settingsTab: tab || 'appearance' 
        }, () => {
          chrome.tabs.reload(currentTab.id)
          window.close()
        })
      } else {
        // Create a new tab and set it to open settings
        chrome.storage.local.set({ 
          openSettingsOnLoad: true, 
          settingsTab: tab || 'appearance' 
        }, () => {
          chrome.tabs.create({ url: chrome.runtime.getURL('index.html') })
          window.close()
        })
      }
    })
  }

  return (
    <div className="popup-container">
      {/* Header */}
      <div className="popup-header">
        <div className="popup-title">
          <Home size={24} />
          <span>Chrome Home</span>
        </div>
        <div className="popup-subtitle">
          Quick Settings & Actions
        </div>
      </div>

      {/* User Info */}
      {userName && (
        <div className="user-info">
          <div className="user-name">Hello, {userName}! 👋</div>
          <div className="user-greeting">Welcome back</div>
        </div>
      )}

      {/* Content */}
      <div className="popup-content">
        {/* Quick Actions */}
        <div className="menu-section">
          <div className="section-title">Quick Actions</div>
          
          <button
            className="quick-action"
            onClick={openNewTab}
          >
            <Plus size={18} />
            Open New Tab
          </button>

          <button
            className="quick-action"
            onClick={refreshAllData}
            disabled={refreshing}
          >
            <RefreshCw size={18} className={refreshing ? 'spinning' : ''} />
            {refreshing ? 'Refreshed!' : 'Refresh All Data'}
          </button>
        </div>

        {/* Settings */}
        <div className="menu-section">
          <div className="section-title">Settings</div>

          <div
            className="menu-item"
            onClick={() => openSettingsTab()}
          >
            <div className="menu-item-icon">
              <Settings size={20} />
            </div>
            <div className="menu-item-text">
              <div className="menu-item-title">Full Settings</div>
              <div className="menu-item-description">
                Customize appearance & widgets
              </div>
            </div>
          </div>

          <div
            className="menu-item"
            onClick={() => openSettingsTab('widgets')}
          >
            <div className="menu-item-icon">🧩</div>
            <div className="menu-item-text">
              <div className="menu-item-title">Manage Widgets</div>
              <div className="menu-item-description">Add or remove widgets</div>
            </div>
          </div>

          <div
            className="menu-item"
            onClick={() => openSettingsTab('appearance')}
          >
            <div className="menu-item-icon">
              <Palette size={20} />
            </div>
            <div className="menu-item-text">
              <div className="menu-item-title">Change Background</div>
              <div className="menu-item-description">Pick a new background</div>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="menu-section">
          <div className="section-title">Info</div>

          <div className="menu-item info-only">
            <div className="menu-item-icon">
              <BarChart3 size={20} />
            </div>
            <div className="menu-item-text">
              <div className="menu-item-title">Statistics</div>
              <div className="menu-item-description">
                {widgetCount} widget{widgetCount !== 1 ? 's' : ''} active
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="popup-footer">
        Chrome Home Extension v{version}
      </div>
    </div>
  )
}

// Export for React Fast Refresh
export default Popup

// Mount the React app
const root = ReactDOM.createRoot(document.getElementById('popup-root'))
root.render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
)

