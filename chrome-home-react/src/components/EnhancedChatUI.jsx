import { useState, useRef, useEffect } from 'react'
import { Send, Sparkles, Copy, Check, ChevronDown, FileText, Code2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import './ChatUI.css'

// Custom code block component with copy functionality
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
          <Code2 size={14} />
          {language || 'code'}
        </span>
        <button 
          className="code-block-copy"
          onClick={handleCopy}
          title="Copy code"
        >
          {copied ? (
            <><Check size={14} /> Copied</>
          ) : (
            <><Copy size={14} /> Copy</>
          )}
        </button>
      </div>
      <pre className="code-block-content">
        <code className={`language-${language}`}>
          {value}
        </code>
      </pre>
    </div>
  )
}

const EnhancedChatUI = ({ 
  isOpen, 
  messages, 
  onSendMessage, 
  isLoading, 
  error,
  onClose,
  onClear
}) => {
  const [input, setInput] = useState('')
  const [copiedId, setCopiedId] = useState(null)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const chatContainerRef = useRef(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen])

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim())
      setInput('')
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

  const containerVariants = {
    hidden: { 
      height: 0,
      opacity: 0,
      y: -20
    },
    visible: { 
      height: 'auto',
      opacity: 1,
      y: 0,
      transition: {
        height: {
          type: "spring",
          stiffness: 500,
          damping: 30
        },
        opacity: {
          duration: 0.2
        },
        y: {
          type: "spring",
          stiffness: 500,
          damping: 30
        }
      }
    },
    exit: {
      height: 0,
      opacity: 0,
      y: -20,
      transition: {
        height: {
          duration: 0.2
        },
        opacity: {
          duration: 0.15
        }
      }
    }
  }

  const messageVariants = {
    hidden: { 
      opacity: 0, 
      x: -20,
      scale: 0.95
    },
    visible: { 
      opacity: 1, 
      x: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 500,
        damping: 30
      }
    }
  }

  // Markdown components configuration
  const MarkdownComponents = {
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '')
      const language = match ? match[1] : null
      
      if (!inline && language) {
        return (
          <CodeBlock 
            language={language} 
            value={String(children).replace(/\n$/, '')} 
          />
        )
      }
      
      if (!inline) {
        return (
          <CodeBlock 
            language="text" 
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
      // Handle pre tags - the code component will render the content
      if (children?.props?.className?.startsWith('language-')) {
        return <>{children}</>
      }
      return <pre className="message-pre">{children}</pre>
    },
    p({ children }) {
      return <p className="message-paragraph">{children}</p>
    },
    ul({ children }) {
      return <ul className="message-list">{children}</ul>
    },
    ol({ children }) {
      return <ol className="message-list message-list-ordered">{children}</ol>
    },
    li({ children }) {
      return <li className="message-list-item">{children}</li>
    },
    blockquote({ children }) {
      return <blockquote className="message-blockquote">{children}</blockquote>
    },
    h1({ children }) {
      return <h3 className="message-heading">{children}</h3>
    },
    h2({ children }) {
      return <h4 className="message-heading">{children}</h4>
    },
    h3({ children }) {
      return <h5 className="message-heading">{children}</h5>
    },
    a({ href, children }) {
      return (
        <a 
          href={href} 
          target="_blank" 
          rel="noopener noreferrer"
          className="message-link"
        >
          {children}
        </a>
      )
    },
    table({ children }) {
      return (
        <div className="message-table-wrapper">
          <table className="message-table">{children}</table>
        </div>
      )
    },
    thead({ children }) {
      return <thead className="message-table-head">{children}</thead>
    },
    tbody({ children }) {
      return <tbody className="message-table-body">{children}</tbody>
    },
    tr({ children }) {
      return <tr className="message-table-row">{children}</tr>
    },
    th({ children }) {
      return <th className="message-table-header">{children}</th>
    },
    td({ children }) {
      return <td className="message-table-cell">{children}</td>
    },
    hr() {
      return <hr className="message-divider" />
    },
    strong({ children }) {
      return <strong className="message-bold">{children}</strong>
    },
    em({ children }) {
      return <em className="message-italic">{children}</em>
    },
    del({ children }) {
      return <del className="message-strikethrough">{children}</del>
    }
  }

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          ref={chatContainerRef}
          className="chat-ui-container"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <div className="chat-ui-wrapper">
            {/* Chat Header */}
            <div className="chat-ui-header">
              <div className="chat-ui-title">
                <Sparkles size={18} className="chat-ui-icon" />
                <span>AI Assistant</span>
              </div>
              <div className="chat-ui-actions">
                {messages.length > 0 && (
                  <button 
                    className="chat-ui-action-btn"
                    onClick={onClear}
                    title="Clear chat"
                  >
                    <FileText size={16} />
                    Clear
                  </button>
                )}
                <button 
                  className="chat-ui-action-btn chat-ui-close"
                  onClick={onClose}
                  title="Close chat"
                >
                  <ChevronDown size={18} />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="chat-ui-messages">
              {messages.length === 0 && (
                <motion.div 
                  className="chat-ui-empty"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="chat-ui-empty-icon">
                    <Sparkles size={32} />
                  </div>
                  <h3>How can I help you today?</h3>
                  <p>Ask me anything - from coding to general knowledge</p>
                  <div className="chat-ui-suggestions">
                    <button 
                      className="chat-ui-suggestion"
                      onClick={() => {
                        setInput("Write a Python function to find prime numbers")
                        setTimeout(() => inputRef.current?.form?.requestSubmit(), 100)
                      }}
                    >
                      Python prime numbers
                    </button>
                    <button 
                      className="chat-ui-suggestion"
                      onClick={() => {
                        setInput("Explain React hooks with examples")
                        setTimeout(() => inputRef.current?.form?.requestSubmit(), 100)
                      }}
                    >
                      React hooks guide
                    </button>
                    <button 
                      className="chat-ui-suggestion"
                      onClick={() => {
                        setInput("Create a REST API with Node.js")
                        setTimeout(() => inputRef.current?.form?.requestSubmit(), 100)
                      }}
                    >
                      Node.js REST API
                    </button>
                  </div>
                </motion.div>
              )}

              <AnimatePresence mode="popLayout">
                {messages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    className={`chat-ui-message ${message.role}`}
                    variants={messageVariants}
                    initial="hidden"
                    animate="visible"
                    layout
                  >
                    <div className="chat-ui-message-content">
                      {message.role === 'user' ? (
                        <div className="chat-ui-message-text">
                          {message.content}
                        </div>
                      ) : (
                        <div className="chat-ui-message-text">
                          <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            components={MarkdownComponents}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      )}
                      {message.role === 'assistant' && message.content && (
                        <div className="chat-ui-message-actions">
                          <button
                            className="chat-ui-message-action"
                            onClick={() => copyToClipboard(message.content, message.id)}
                          >
                            {copiedId === message.id ? (
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
                  className="chat-ui-message assistant"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <div className="chat-ui-message-content">
                    <div className="chat-ui-typing">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </motion.div>
              )}

              {error && (
                <motion.div
                  className="chat-ui-error"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <span>⚠️ {error}</span>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form className="chat-ui-form" onSubmit={handleSubmit}>
              <input
                ref={inputRef}
                type="text"
                className="chat-ui-input"
                placeholder="Type your message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
              />
              <button
                type="submit"
                className="chat-ui-submit"
                disabled={!input.trim() || isLoading}
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default EnhancedChatUI