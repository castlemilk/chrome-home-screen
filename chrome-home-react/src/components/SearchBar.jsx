import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import { Search, MessageSquare, Sparkles, Filter, Clock, ChevronDown } from 'lucide-react'
import { useSettings } from '../contexts/SettingsContext'
import TabbedChatUI from './TabbedChatUI'
import './TabbedChatUI.css'

const SearchBar = forwardRef((props, ref) => {
  const [query, setQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [mode, setMode] = useState('search') // 'search' or 'chat'
  const [showChat, setShowChat] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [restoreChatData, setRestoreChatData] = useState(null)
  const [currentChatId, setCurrentChatId] = useState(null)
  const [searchType, setSearchType] = useState('all') // all, images, videos, news, maps, shopping
  const [timeRange, setTimeRange] = useState('') // '', 'hour', 'day', 'week', 'month', 'year'
  const [showFilters, setShowFilters] = useState(false)
  const inputRef = useRef(null)
  const containerRef = useRef(null)
  const { addSearchHistory } = useSettings()
  const OPENROUTER_API_KEY = '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'
  
  // Search type configurations for Google search operators
  const searchTypeConfig = {
    all: { label: 'All', operator: '' },
    images: { label: 'Images', operator: '' }, // Will be handled differently
    videos: { label: 'Videos', operator: 'inurl:youtube.com OR site:vimeo.com' },
    news: { label: 'News', operator: '' }, // Will be handled differently  
    maps: { label: 'Maps', operator: '' }, // Will be handled differently
    shopping: { label: 'Shopping', operator: '' } // Will be handled differently
  }
  
  // Time range configurations for Google search operators
  const timeRangeConfig = {
    '': { label: 'Any time', operator: '' },
    'hour': { label: 'Past hour', operator: 'after:' + new Date(Date.now() - 3600000).toISOString().split('T')[0] },
    'day': { label: 'Past 24 hours', operator: 'after:' + new Date(Date.now() - 86400000).toISOString().split('T')[0] },
    'week': { label: 'Past week', operator: 'after:' + new Date(Date.now() - 604800000).toISOString().split('T')[0] },
    'month': { label: 'Past month', operator: 'after:' + new Date(Date.now() - 2592000000).toISOString().split('T')[0] },
    'year': { label: 'Past year', operator: 'after:' + new Date(Date.now() - 31536000000).toISOString().split('T')[0] }
  }
  
  // Load saved search preferences
  useEffect(() => {
    const savedPrefs = localStorage.getItem('searchPreferences')
    if (savedPrefs) {
      try {
        const prefs = JSON.parse(savedPrefs)
        if (prefs.searchType) setSearchType(prefs.searchType)
        if (prefs.timeRange) setTimeRange(prefs.timeRange)
      } catch (e) {
        console.error('Failed to load search preferences:', e)
      }
    }
  }, [])
  
  // Save search preferences
  useEffect(() => {
    localStorage.setItem('searchPreferences', JSON.stringify({
      searchType,
      timeRange
    }))
  }, [searchType, timeRange])
  
  // Expose the restore method via ref
  useImperativeHandle(ref, () => ({
    restoreChatFromHistory
  }))
  
  const handleChatSubmit = async (message) => {
    setIsLoading(true)
    setError(null)
    
    // Generate or use existing chat ID
    const chatId = currentChatId || Date.now().toString()
    if (!currentChatId) {
      setCurrentChatId(chatId)
    }
    
    // Add to search history with chat context
    addSearchHistory({
      id: Date.now().toString(),
      query: message,
      url: '#chat',
      favicon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%2363b3ed"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg>',
      title: `Chat: ${message}`,
      type: 'chat',
      timestamp: new Date().toISOString(),
      chatId: chatId // Store the chat ID for restoration
    })
    
    try {
      // Get current messages from the chat component (will be handled internally)
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Chrome Home Extension',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'deepseek/deepseek-chat',
          messages: [{ role: 'user', content: message }],
          stream: true,
          temperature: 0.7,
          max_tokens: 2000
        })
      })
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }
      
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let assistantContent = ''
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue
            
            try {
              const parsed = JSON.parse(data)
              const content = parsed.choices?.[0]?.delta?.content || ''
              if (content) {
                assistantContent += content
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
      
      return assistantContent
    } catch (err) {
      console.error('Chat error:', err)
      setError('Something went wrong. Please try again.')
      return null
    } finally {
      setIsLoading(false)
    }
  }

  // Quick search suggestions
  const quickSuggestions = [
    'weather',
    'news today',
    'stocks',
    'youtube',
    'github',
    'chatgpt'
  ]

  useEffect(() => {
    // Show suggestions based on query
    if (query.length > 0 && query.length < 3) {
      setSuggestions(quickSuggestions.filter(s => s.startsWith(query.toLowerCase())))
    } else {
      setSuggestions([])
    }
  }, [query])

  // Handle clicks outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsFocused(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // If in chat mode, always open the chat
    if (mode === 'chat') {
      setShowChat(true)
      // Don't clear query here - it will be passed to chat
      return
    }
    
    // For search mode, only proceed if there's a query
    if (query.trim()) {
      
      const timestamp = new Date().toISOString()
      let url, favicon, title
      
      // Check if it's a URL
      if (query.includes('.') || query.startsWith('http')) {
        url = query.startsWith('http') ? query : `https://${query}`
        const urlObj = new URL(url)
        favicon = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`
        title = query
        
        // Add to history
        addSearchHistory({
          id: Date.now().toString(),
          query: query,
          url: url,
          favicon: favicon,
          title: title,
          type: 'direct',
          timestamp: timestamp
        })
        
        window.location.href = url
        return
      }

      // Use Chrome Search API to respect user's default search engine
      // The search API will automatically use the user's configured default search engine
      const searchQuery = query.trim()
      
      // Add to history (we don't know the exact URL since it depends on user's search engine)
      addSearchHistory({
        id: Date.now().toString(),
        query: searchQuery,
        url: '#', // Placeholder since actual URL depends on user's search engine
        favicon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%234285f4"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>',
        title: searchQuery,
        type: 'search',
        timestamp: timestamp
      })
      
      // Build enhanced search query with filters
      let enhancedQuery = searchQuery
      
      // Add search operators based on filters
      if (searchType !== 'all' && searchTypeConfig[searchType].operator) {
        enhancedQuery = `${searchQuery} ${searchTypeConfig[searchType].operator}`
      }
      
      if (timeRange && timeRangeConfig[timeRange].operator) {
        enhancedQuery = `${enhancedQuery} ${timeRangeConfig[timeRange].operator}`
      }
      
      // Use Chrome Search API to respect user's default search engine
      if (typeof window !== 'undefined' && window.chrome && window.chrome.search && window.chrome.search.query) {
        // For special search types, we need to handle them differently
        if (searchType === 'images' || searchType === 'news' || searchType === 'maps' || searchType === 'shopping') {
          // These require specific Google search URLs
          let specialSearchUrl = ''
          switch(searchType) {
            case 'images':
              specialSearchUrl = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(searchQuery)}`
              break
            case 'news':
              specialSearchUrl = `https://news.google.com/search?q=${encodeURIComponent(searchQuery)}`
              break
            case 'maps':
              specialSearchUrl = `https://maps.google.com/maps?q=${encodeURIComponent(searchQuery)}`
              break
            case 'shopping':
              specialSearchUrl = `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(searchQuery)}`
              break
          }
          if (specialSearchUrl) {
            window.location.href = specialSearchUrl
            return
          }
        }
        
        // Use Chrome Search API with enhanced query
        window.chrome.search.query({
          text: enhancedQuery,
          disposition: 'CURRENT_TAB'
        })
      } else {
        // Fallback to Google search when Chrome Search API is not available
        // This happens during development or in non-Chrome browsers
        let googleSearchUrl = ''
        
        // Handle special search types for fallback
        if (searchType === 'images') {
          googleSearchUrl = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(searchQuery)}`
        } else if (searchType === 'news') {
          googleSearchUrl = `https://news.google.com/search?q=${encodeURIComponent(searchQuery)}`
        } else if (searchType === 'maps') {
          googleSearchUrl = `https://maps.google.com/maps?q=${encodeURIComponent(searchQuery)}`
        } else if (searchType === 'shopping') {
          googleSearchUrl = `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(searchQuery)}`
        } else {
          googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(enhancedQuery)}`
        }
        
        window.location.href = googleSearchUrl
      }
    }
  }

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion)
    setSuggestions([])
    inputRef.current?.focus()
  }

  const handleFocus = () => {
    setIsFocused(true)
  }

  const handleBlur = () => {
    // Delay to allow clicking on suggestions
    setTimeout(() => {
      setIsFocused(false)
    }, 200)
  }

  const toggleMode = () => {
    const newMode = mode === 'search' ? 'chat' : 'search'
    setMode(newMode)
    if (newMode === 'chat') {
      setShowChat(true) // Open chat immediately when switching to chat mode
    } else {
      setShowChat(false)
    }
  }
  
  // Filter toggle functions
  const toggleFilters = () => {
    setShowFilters(!showFilters)
  }
  
  const handleSearchTypeChange = (type) => {
    setSearchType(type)
    if (query.trim()) {
      // Re-submit search with new type
      handleSubmit(new Event('submit'))
    }
  }
  
  const handleTimeRangeChange = (range) => {
    setTimeRange(range)
    if (query.trim()) {
      // Re-submit search with new time range
      handleSubmit(new Event('submit'))
    }
  }
  
  // Method to restore a chat from history
  const restoreChatFromHistory = (historyItem) => {
    if (historyItem.type === 'chat' && historyItem.chatId) {
      // Get the chat sessions from localStorage
      const savedChats = localStorage.getItem('chatSessions')
      if (savedChats) {
        try {
          const chats = JSON.parse(savedChats)
          const chatToRestore = chats.find(chat => chat.id === historyItem.chatId)
          
          if (chatToRestore) {
            setRestoreChatData({
              chatId: historyItem.chatId,
              title: chatToRestore.title,
              messages: chatToRestore.messages,
              createdAt: chatToRestore.createdAt
            })
            setCurrentChatId(historyItem.chatId)
            setMode('chat')
            setShowChat(true)
          } else {
            // If chat not found, just open a new chat with the query
            setQuery(historyItem.query || '')
            setMode('chat')
            setShowChat(true)
          }
        } catch (e) {
          console.error('Failed to restore chat:', e)
        }
      }
    }
  }

  const handleKeyDown = (e) => {
    // Toggle chat with Cmd/Ctrl + K
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      toggleMode()
    }
  }

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mode])

  return (
    <>
      <div 
        ref={containerRef}
        className={`search-container ${isFocused ? 'focused' : ''} ${mode}`}
      >
        <form className="search-form" onSubmit={handleSubmit}>
          <div className="search-input-wrapper">
            <button
              type="button"
              className={`mode-toggle ${mode}`}
              onClick={toggleMode}
              title={mode === 'search' ? 'Switch to Chat (⌘K)' : 'Switch to Search (⌘K)'}
            >
              {mode === 'search' ? (
                <Search className="icon-lucide" size={18} />
              ) : (
                <Sparkles className="icon-lucide sparkle-icon" size={18} />
              )}
            </button>
            <input
              ref={inputRef}
              type="text"
              placeholder={mode === 'chat' ? 'Click here or press Enter to open chat...' : 'Search the web...'}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={handleFocus}
              onBlur={handleBlur}
              className="search-input"
              onClick={() => {
                // Open chat when clicking on the input in chat mode
                if (mode === 'chat' && !showChat) {
                  setShowChat(true)
                }
              }}
            />
            {mode === 'chat' && (
              <div className="search-input-hint">AI Assistant</div>
            )}
            {mode === 'search' && (
              <button
                type="button"
                className={`filter-toggle ${showFilters ? 'active' : ''}`}
                onClick={toggleFilters}
                title="Search filters"
              >
                <Filter className="icon-lucide" size={16} />
              </button>
            )}
          </div>
          
          {/* Search filters */}
          {mode === 'search' && showFilters && (
            <div className="search-filters">
              <div className="filter-group">
                <label className="filter-label">Type:</label>
                <div className="filter-options">
                  {Object.entries(searchTypeConfig).map(([key, config]) => (
                    <button
                      key={key}
                      type="button"
                      className={`filter-option ${searchType === key ? 'active' : ''}`}
                      onClick={() => handleSearchTypeChange(key)}
                    >
                      {config.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="filter-group">
                <label className="filter-label">Time:</label>
                <div className="filter-options">
                  {Object.entries(timeRangeConfig).map(([key, config]) => (
                    <button
                      key={key}
                      type="button"
                      className={`filter-option ${timeRange === key ? 'active' : ''}`}
                      onClick={() => handleTimeRangeChange(key)}
                    >
                      {config.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* Quick suggestions for search mode */}
          {mode === 'search' && isFocused && suggestions.length > 0 && (
            <div className="search-suggestions">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="search-suggestion"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <Search className="suggestion-icon" size={14} />
                  <span>{suggestion}</span>
                </div>
              ))}
            </div>
          )}
        </form>
      </div>

      {/* Chat UI */}
      <TabbedChatUI
        isOpen={showChat && mode === 'chat'}
        initialMessage={query} // Pass the query to pre-fill the chat input
        onSendMessage={handleChatSubmit}
        isLoading={isLoading}
        error={error}
        restoreChatSession={restoreChatData}
        onOpen={() => {
          // Clear the search bar query after chat opens
          setQuery('')
          // Clear restore data after opening
          setRestoreChatData(null)
        }}
        onClose={() => {
          setShowChat(false)
          setMode('search')
          setQuery('') // Clear query when closing
          setCurrentChatId(null) // Reset chat ID
          setRestoreChatData(null) // Clear restore data
        }}
      />
    </>
  )
})

SearchBar.displayName = 'SearchBar'

export default SearchBar