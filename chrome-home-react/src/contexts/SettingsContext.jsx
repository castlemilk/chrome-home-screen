import { createContext, useContext, useState, useEffect } from 'react'
import { storage } from '../utils/storage'

const SettingsContext = createContext()

export const useSettings = () => {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    userName: '',
    background: 'gradient1',
    backgroundType: 'gradient',
    searchEngine: 'google',
    quickLinks: [
      { name: 'Gmail', url: 'https://gmail.com', icon: 'https://www.google.com/favicon.ico' },
      { name: 'YouTube', url: 'https://youtube.com', icon: 'https://www.youtube.com/favicon.ico' },
      { name: 'GitHub', url: 'https://github.com', icon: 'https://github.com/favicon.ico' }
    ]
  })
  
  const [searchHistory, setSearchHistory] = useState([])

  // Load settings and search history from storage
  useEffect(() => {
    storage.sync.get(['settings', 'searchHistory'], (result) => {
      if (result.settings) {
        setSettings(result.settings)
        // Apply background on load
        if (result.settings.backgroundType === 'gradient') {
          document.body.className = ''
          document.body.setAttribute('data-bg', result.settings.background)
        } else if (result.settings.backgroundType === 'image') {
          document.body.className = 'image-background'
          document.body.removeAttribute('data-bg')
        }
      }
      if (result.searchHistory) {
        setSearchHistory(result.searchHistory)
      }
    })
  }, [])

  // Save settings to storage
  const updateSettings = (newSettings) => {
    const updated = { ...settings, ...newSettings }
    setSettings(updated)
    storage.sync.set({ settings: updated })
  }
  
  // Add item to search history
  const addSearchHistory = (item) => {
    const newHistory = [item, ...searchHistory.slice(0, 49)] // Keep last 50 items
    setSearchHistory(newHistory)
    storage.sync.set({ searchHistory: newHistory })
  }
  
  // Clear search history
  const clearSearchHistory = () => {
    setSearchHistory([])
    storage.sync.set({ searchHistory: [] })
  }
  
  // Remove specific item from history
  const removeSearchHistoryItem = (id) => {
    const newHistory = searchHistory.filter(item => item.id !== id)
    setSearchHistory(newHistory)
    storage.sync.set({ searchHistory: newHistory })
  }

  return (
    <SettingsContext.Provider value={{ 
      settings, 
      updateSettings,
      searchHistory,
      addSearchHistory,
      clearSearchHistory,
      removeSearchHistoryItem
    }}>
      {children}
    </SettingsContext.Provider>
  )
}