import { useState, useRef, useEffect } from 'react'
import { Send, Loader, User, Bot, Copy, Check, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSettings } from '../contexts/SettingsContext'

const ChatInterface = ({ isVisible, onClose }) => {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(null)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const { addSearchHistory } = useSettings()
  
  const OPENROUTER_API_KEY = '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'
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    
    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim()
    }
    
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setError(null)
    
    // Add to search history
    addSearchHistory({
      id: Date.now().toString(),
      query: input.trim(),
      url: '#chat',
      favicon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%2363b3ed"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg>',
      title: `Chat: ${input.trim()}`,
      type: 'chat',
      timestamp: new Date().toISOString()
    })
    
    try {
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
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          })),
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
      
      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: ''
      }
      
      setMessages(prev => [...prev, assistantMessage])
      
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
                assistantMessage.content += content
                setMessages(prev => prev.map(m => 
                  m.id === assistantMessage.id 
                    ? { ...m, content: assistantMessage.content }
                    : m
                ))
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (err) {
      console.error('Chat error:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when chat becomes visible
  useEffect(() => {
    if (isVisible) {
      inputRef.current?.focus()
    }
  }, [isVisible])

  const copyToClipboard = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(id)
      setTimeout(() => setCopied(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const formatMessage = (content) => {
    // Simple markdown-like formatting
    return content
      .split('\n')
      .map((line, i) => {
        // Code blocks
        if (line.startsWith('```')) {
          return null
        }
        
        // Bold text
        line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        
        // Italic text
        line = line.replace(/\*(.*?)\*/g, '<em>$1</em>')
        
        // Inline code
        line = line.replace(/`(.*?)`/g, '<code>$1</code>')
        
        return <p key={i} dangerouslySetInnerHTML={{ __html: line }} />
      })
      .filter(Boolean)
  }

  if (!isVisible) return null

  return (
    <motion.div
      className="chat-interface"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-empty">
            <Bot size={48} />
            <h3>Start a conversation</h3>
            <p>Ask me anything - I'm powered by DeepSeek</p>
            <div className="chat-suggestions">
              <button 
                className="chat-suggestion"
                onClick={() => {
                  setInput("What's the weather like today?")
                  setTimeout(() => inputRef.current?.form?.requestSubmit(), 100)
                }}
              >
                What's the weather like?
              </button>
              <button 
                className="chat-suggestion"
                onClick={() => {
                  setInput("Help me write code")
                  setTimeout(() => inputRef.current?.form?.requestSubmit(), 100)
                }}
              >
                Help with coding
              </button>
              <button 
                className="chat-suggestion"
                onClick={() => {
                  setInput("Explain quantum computing")
                  setTimeout(() => inputRef.current?.form?.requestSubmit(), 100)
                }}
              >
                Explain a concept
              </button>
            </div>
          </div>
        )}
        
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              className={`chat-message ${message.role}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <div className="message-content">
                {message.role === 'user' && (
                  <div className="message-label">You</div>
                )}
                {message.role === 'assistant' && (
                  <div className="message-label">Assistant</div>
                )}
                <div className="message-text">
                  {message.role === 'user' ? (
                    <p>{message.content}</p>
                  ) : (
                    formatMessage(message.content)
                  )}
                </div>
                {message.role === 'assistant' && message.content && (
                  <div className="message-actions">
                    <button
                      className="message-action"
                      onClick={() => copyToClipboard(message.content, message.id)}
                      title="Copy to clipboard"
                    >
                      {copied === message.id ? (
                        <><Check size={14} /> Copied</>
                      ) : (
                        <><Copy size={14} /> Copy</>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isLoading && (
          <motion.div
            className="chat-message assistant loading"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="message-content">
              <div className="message-label">Assistant</div>
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
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <AlertCircle size={16} />
            <span>Something went wrong. Please try again.</span>
            <button onClick={() => {
              setError(null)
              // Retry last message
              const lastUserMessage = messages.filter(m => m.role === 'user').pop()
              if (lastUserMessage) {
                setInput(lastUserMessage.content)
                setMessages(messages.slice(0, -2)) // Remove last user and assistant messages
                setTimeout(() => inputRef.current?.form?.requestSubmit(), 100)
              }
            }}>Retry</button>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <form className="chat-input-form" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          type="text"
          className="chat-input"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
        />
        <button
          type="submit"
          className="chat-submit"
          disabled={!input.trim() || isLoading}
        >
          {isLoading ? (
            <Loader size={20} className="animate-spin" />
          ) : (
            <Send size={20} />
          )}
        </button>
      </form>
    </motion.div>
  )
}

export default ChatInterface