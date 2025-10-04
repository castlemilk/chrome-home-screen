import { useState, useRef, useEffect } from 'react'
import { Send, Sparkles, Copy, Check, X, Plus, MessageSquare, ChevronLeft, ChevronRight, Minimize2, Maximize2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import './TabbedChatUI.css'

// Custom code block component
const CodeBlock = ({ language, value }) => {
  const [copied, setCopied] = useState(false)
  
  const handleCopy = () => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="code-block-container">
      <div className="code-block-header">
        <span className="code-block-language">
          {language || 'code'}
        </span>
        <button 
          className="code-block-copy"
          onClick={handleCopy}
        >
          {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
        </button>
      </div>
      <pre className="code-block-content">
        <code>{value}</code>
      </pre>
    </div>
  )
}

const TabbedChatUI = ({ 
  isOpen, 
  onClose,
  onOpen,
  onSendMessage,
  isLoading,
  error,
  initialMessage = '',
  restoreChatSession = null
}) => {
  const [chats, setChats] = useState(() => {
    // Load chats from localStorage
    const saved = localStorage.getItem('chatSessions')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        return [{
          id: Date.now().toString(),
          title: 'New Chat',
          messages: [],
          createdAt: new Date().toISOString()
        }]
      }
    }
    return [{
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date().toISOString()
    }]
  })
  
  const [activeTabId, setActiveTabId] = useState(chats[0]?.id)
  const [input, setInput] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const [copiedId, setCopiedId] = useState(null)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const tabsContainerRef = useRef(null)
  const [canScrollTabs, setCanScrollTabs] = useState({ left: false, right: false })

  // Get active chat
  const activeChat = chats.find(chat => chat.id === activeTabId) || chats[0]

  // Save chats to localStorage
  useEffect(() => {
    localStorage.setItem('chatSessions', JSON.stringify(chats))
  }, [chats])

  // Check if tabs can scroll
  useEffect(() => {
    const checkScroll = () => {
      if (tabsContainerRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = tabsContainerRef.current
        setCanScrollTabs({
          left: scrollLeft > 0,
          right: scrollLeft < scrollWidth - clientWidth - 1
        })
      }
    }
    
    checkScroll()
    window.addEventListener('resize', checkScroll)
    return () => window.removeEventListener('resize', checkScroll)
  }, [chats])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    // Small delay to ensure DOM is updated
    const scrollTimer = setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
      }
    }, 100)
    
    return () => clearTimeout(scrollTimer)
  }, [activeChat?.messages, isLoading])

  // Focus input when opening and set initial message
  useEffect(() => {
    if (isOpen) {
      // Check if we need to restore a chat session
      if (restoreChatSession) {
        // Find if this chat already exists or create a new one
        const existingChat = chats.find(chat => chat.id === restoreChatSession.chatId)
        
        if (existingChat) {
          // If chat exists, just switch to it
          setActiveTabId(restoreChatSession.chatId)
        } else {
          // Create new chat with the restored messages
          const newChat = {
            id: restoreChatSession.chatId || Date.now().toString(),
            title: restoreChatSession.title || 'Restored Chat',
            messages: restoreChatSession.messages || [],
            createdAt: restoreChatSession.createdAt || new Date().toISOString()
          }
          setChats(prev => [...prev, newChat])
          setActiveTabId(newChat.id)
        }
      } else if (initialMessage && initialMessage.trim()) {
        // Set the initial message if provided
        setInput(initialMessage)
      }
      
      // Call onOpen callback if provided
      if (onOpen) {
        onOpen()
      }
      
      // Focus the input after a short delay
      setTimeout(() => {
        inputRef.current?.focus()
      }, 400)
    }
  }, [isOpen, restoreChatSession]) // Trigger when isOpen or restoreChatSession changes
  
  // Handle initial message changes while open
  useEffect(() => {
    if (isOpen && initialMessage && initialMessage.trim() && !input) {
      setInput(initialMessage)
    }
  }, [initialMessage])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (input.trim() && !isLoading) {
      const messageText = input.trim()
      const userMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: messageText
      }
      
      // Update chat title if it's the first message
      setChats(prev => prev.map(chat => {
        if (chat.id === activeTabId) {
          return {
            ...chat,
            messages: [...chat.messages, userMessage],
            title: chat.messages.length === 0 ? messageText.slice(0, 30) : chat.title
          }
        }
        return chat
      }))
      
      setInput('')
      
      // Call the parent's message handler
      const response = await onSendMessage(messageText)
      
      // Add assistant response
      if (response) {
        const assistantMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response
        }
        
        setChats(prev => prev.map(chat => {
          if (chat.id === activeTabId) {
            return {
              ...chat,
              messages: [...chat.messages, assistantMessage]
            }
          }
          return chat
        }))
      }
    }
  }

  const createNewChat = () => {
    const newChat = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date().toISOString()
    }
    setChats([...chats, newChat])
    setActiveTabId(newChat.id)
  }

  const closeTab = (chatId, e) => {
    e.stopPropagation()
    if (chats.length > 1) {
      const newChats = chats.filter(chat => chat.id !== chatId)
      setChats(newChats)
      if (activeTabId === chatId) {
        setActiveTabId(newChats[0].id)
      }
    }
  }

  const scrollTabs = (direction) => {
    if (tabsContainerRef.current) {
      const scrollAmount = 200
      tabsContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  const copyToClipboard = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Markdown components
  const MarkdownComponents = {
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '')
      const language = match ? match[1] : null
      
      if (!inline && (language || String(children).includes('\n'))) {
        return (
          <CodeBlock 
            language={language} 
            value={String(children).replace(/\n$/, '')} 
          />
        )
      }
      
      return (
        <code className="inline-code" {...props}>
          {children}
        </code>
      )
    },
    pre({ children }) {
      return <>{children}</>
    },
    p: ({ children }) => <p className="message-paragraph">{children}</p>,
    ul: ({ children }) => <ul className="message-list">{children}</ul>,
    ol: ({ children }) => <ol className="message-list ordered">{children}</ol>,
    li: ({ children }) => <li className="message-list-item">{children}</li>,
    blockquote: ({ children }) => <blockquote className="message-blockquote">{children}</blockquote>,
    a: ({ href, children }) => (
      <a href={href} target="_blank" rel="noopener noreferrer" className="message-link">
        {children}
      </a>
    ),
    strong: ({ children }) => <strong className="message-bold">{children}</strong>,
    em: ({ children }) => <em className="message-italic">{children}</em>
  }

  const containerVariants = {
    hidden: { 
      opacity: 0,
      scale: 0.95,
      y: 20
    },
    visible: { 
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25,
        staggerChildren: 0.1
      }
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: 20,
      transition: {
        duration: 0.2
      }
    }
  }

  const expandVariants = {
    collapsed: {
      width: "600px",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    },
    expanded: {
      width: "900px",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="tabbed-chat-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="tabbed-chat-container"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              className="tabbed-chat-wrapper"
              variants={expandVariants}
              animate={isExpanded ? "expanded" : "collapsed"}
            >
              {/* Header with Tabs */}
              <div className="tabbed-chat-header">
                <div className="chat-tabs-container">
                  {canScrollTabs.left && (
                    <button 
                      className="tab-scroll-btn left"
                      onClick={() => scrollTabs('left')}
                    >
                      <ChevronLeft size={16} />
                    </button>
                  )}
                  
                  <div className="chat-tabs" ref={tabsContainerRef}>
                    {chats.map((chat) => (
                      <motion.div
                        key={chat.id}
                        className={`chat-tab ${activeTabId === chat.id ? 'active' : ''}`}
                        onClick={() => setActiveTabId(chat.id)}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <MessageSquare size={14} />
                        <span className="tab-title">{chat.title}</span>
                        {chats.length > 1 && (
                          <button 
                            className="tab-close"
                            onClick={(e) => closeTab(chat.id, e)}
                          >
                            <X size={14} />
                          </button>
                        )}
                      </motion.div>
                    ))}
                    <motion.button 
                      className="new-tab-btn"
                      onClick={createNewChat}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Plus size={16} />
                    </motion.button>
                  </div>
                  
                  {canScrollTabs.right && (
                    <button 
                      className="tab-scroll-btn right"
                      onClick={() => scrollTabs('right')}
                    >
                      <ChevronRight size={16} />
                    </button>
                  )}
                </div>
                
                <div className="chat-header-actions">
                  <button 
                    className="header-action-btn"
                    onClick={() => setIsExpanded(!isExpanded)}
                    title={isExpanded ? "Collapse" : "Expand"}
                  >
                    {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                  </button>
                  <button 
                    className="header-action-btn"
                    onClick={onClose}
                    title="Close"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="tabbed-chat-messages">
                {activeChat.messages.length === 0 ? (
                  <motion.div 
                    className="chat-empty-state"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Sparkles size={48} className="empty-icon" />
                    <h3>Start a new conversation</h3>
                    <p>Ask me anything - I'm here to help!</p>
                    <div className="quick-prompts">
                      {[
                        "Explain quantum computing",
                        "Write a Python script",
                        "Create a React component",
                        "Debug this code"
                      ].map((prompt) => (
                        <button
                          key={prompt}
                          className="quick-prompt"
                          onClick={() => {
                            setInput(prompt)
                            inputRef.current?.focus()
                          }}
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <div className="messages-container">
                    {activeChat.messages.map((message, index) => (
                      <motion.div
                        key={message.id}
                        className={`chat-message ${message.role}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <div className="message-content">
                          {message.role === 'user' ? (
                            <div className="message-text">{message.content}</div>
                          ) : (
                            <>
                              <div className="message-text">
                                <ReactMarkdown 
                                  remarkPlugins={[remarkGfm]}
                                  components={MarkdownComponents}
                                >
                                  {message.content}
                                </ReactMarkdown>
                              </div>
                              <button
                                className="message-copy-btn"
                                onClick={() => copyToClipboard(message.content, message.id)}
                              >
                                {copiedId === message.id ? (
                                  <><Check size={14} /> Copied</>
                                ) : (
                                  <><Copy size={14} /> Copy</>
                                )}
                              </button>
                            </>
                          )}
                        </div>
                      </motion.div>
                    ))}
                    
                    {isLoading && (
                      <motion.div
                        className="chat-message assistant"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <div className="message-content">
                          <div className="typing-indicator">
                            <span></span>
                            <span></span>
                            <span></span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                    
                    {error && (
                      <motion.div
                        className="chat-error"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        ⚠️ {error}
                      </motion.div>
                    )}
                    
                    <div ref={messagesEndRef} className="messages-scroll-anchor" />
                  </div>
                )}
              </div>

              {/* Input Area */}
              <form className="tabbed-chat-input" onSubmit={handleSubmit}>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Type your message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isLoading}
                />
                <motion.button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Send size={18} />
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default TabbedChatUI