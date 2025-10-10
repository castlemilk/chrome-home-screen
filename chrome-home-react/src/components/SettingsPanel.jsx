// eslint-disable-next-line no-unused-vars
import { AnimatePresence, motion } from 'framer-motion'
import { X, Image, Plus, Check } from 'lucide-react'
import { useSettings } from '../contexts/SettingsContext'
import { useWidgets } from '../contexts/WidgetContext'
import { useState, useEffect } from 'react'
import { WIDGET_TYPES } from '../App'
import imageService from '../services/imageService'

const SettingsPanel = ({ onClose, initialTab = 'appearance' }) => {
  const { settings, updateSettings } = useSettings()
  const { addWidget, widgets } = useWidgets()
  const [activeTab, setActiveTab] = useState(initialTab)
  const [gcsImages, setGcsImages] = useState([])
  const [gcsLoading, setGcsLoading] = useState(false)
  const [recentlyAdded, setRecentlyAdded] = useState(new Set())
  
  // Update active tab when initialTab changes (e.g., from popup message)
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab)
    }
  }, [initialTab])
  
  // Load GCS images when panel opens
  useEffect(() => {
    loadGCSImages()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  
  const loadGCSImages = async () => {
    setGcsLoading(true)
    try {
      const manifest = await imageService.loadManifest()
      if (manifest && manifest.images) {
        // Map manifest images to UI format and add metadata
        const images = manifest.images.map(img => {
          // Find matching metadata from jwstImages array
          const metadata = jwstImages.find(jwst => img.name === jwst.name) || {}
          
          return {
            id: img.id,
            name: img.name,
            thumbnail: img.variants.find(v => v.size === 'thumbnail' && v.format === 'jpg')?.url || img.variants[0]?.url,
            description: metadata.description || '',
            distance: metadata.distance || '',
            captured: metadata.captured || ''
          }
        })
        setGcsImages(images)
      }
    } catch (error) {
      console.error('Failed to load GCS images:', error)
    } finally {
      setGcsLoading(false)
    }
  }
  
  // JWST images with detailed metadata
  const jwstImages = [
    { 
      name: 'Tarantula Nebula', 
      file: 'tarantula-nebula.jpg',
      description: 'A massive star-forming region in the Large Magellanic Cloud',
      distance: '161,000 light-years',
      captured: 'July 2022'
    },
    { 
      name: 'Carina Nebula', 
      file: '53612916394_734d0e1e4a_o.jpg',
      description: 'Stellar nursery revealing newborn stars hidden behind cosmic cliffs',
      distance: '7,500 light-years',
      captured: 'July 2022'
    },
    { 
      name: 'Southern Ring Nebula', 
      file: '53876176351_9cbdfa7df1_o.jpg',
      description: 'A dying star surrounded by expanding shells of gas',
      distance: '2,000 light-years',
      captured: 'July 2022'
    },
    { 
      name: 'Stephan\'s Quintet', 
      file: '53876484333_958b3c2c84_o.jpg',
      description: 'Five galaxies locked in a cosmic dance, four of them in collision',
      distance: '290 million light-years',
      captured: 'July 2022'
    },
    { 
      name: 'Webb\'s First Deep Field', 
      file: '53951942710_9389759151_o.jpg',
      description: 'Galaxy cluster SMACS 0723, revealing thousands of ancient galaxies',
      distance: '4.6 billion light-years',
      captured: 'July 2022'
    },
    { 
      name: 'Cosmic Cliffs', 
      file: '54088897300_3e378b6a5f_o.jpg',
      description: 'Edge of the Carina Nebula where new stars are born',
      distance: '7,500 light-years',
      captured: 'July 2022'
    },
    { 
      name: 'Pillars of Creation', 
      file: '54107357754_d57a5943c5_o.jpg',
      description: 'Iconic star-forming columns in the Eagle Nebula captured in stunning detail',
      distance: '6,500 light-years',
      captured: 'October 2022'
    },
    { 
      name: 'NGC 346', 
      file: '54107470055_7387a886d1_o.jpg',
      description: 'A young star cluster in the Small Magellanic Cloud',
      distance: '200,000 light-years',
      captured: 'December 2022'
    },
    { 
      name: 'Rho Ophiuchi', 
      file: '54167157727_9c8df56be1_o.jpg',
      description: 'The closest star-forming region to Earth in exquisite detail',
      distance: '390 light-years',
      captured: 'July 2023'
    },
    { 
      name: 'Ring Nebula', 
      file: '54213487373_132699b1df_o.jpg',
      description: 'A planetary nebula showing the final death throes of a sun-like star',
      distance: '2,500 light-years',
      captured: 'August 2023'
    },
    { 
      name: 'Orion Nebula', 
      file: '54565613170_7e8bef5479_o.jpg',
      description: 'The most studied stellar nursery in the Milky Way',
      distance: '1,350 light-years',
      captured: 'September 2023'
    },
    { 
      name: 'Wolf-Rayet Star', 
      file: '54626159771_b9d4f2ea0f_o.jpg',
      description: 'WR 124 - a massive star ejecting its outer layers before going supernova',
      distance: '15,000 light-years',
      captured: 'March 2023'
    },
    { 
      name: 'Saturn', 
      file: '54639970389_dfbc0c75f6_o.jpg',
      description: 'The ringed giant with unprecedented clarity showing atmospheric details',
      distance: '886 million miles',
      captured: 'June 2023'
    },
    { 
      name: 'Phantom Galaxy', 
      file: '54644815047_f6aaedf588_o.jpg',
      description: 'M74 - a grand spiral galaxy perfectly face-on to our view',
      distance: '32 million light-years',
      captured: 'August 2022'
    },
    { 
      name: 'Cartwheel Galaxy', 
      file: '54688092157_efd8cef20a_o.jpg',
      description: 'A ring galaxy formed by a violent galactic collision',
      distance: '500 million light-years',
      captured: 'August 2022'
    },
    { 
      name: 'Neptune', 
      file: '54692963181_e9ddaf3294_o.jpg',
      description: 'The ice giant showing its rings and atmospheric features in infrared',
      distance: '2.7 billion miles',
      captured: 'July 2022'
    }
  ]

  const gradients = [
    { name: 'Purple Dream', value: 'gradient1', colors: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    { name: 'Sunset', value: 'gradient2', colors: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
    { name: 'Ocean', value: 'gradient3', colors: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
    { name: 'Forest', value: 'gradient4', colors: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
    { name: 'Warm', value: 'gradient5', colors: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
    { name: 'Cool', value: 'gradient6', colors: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)' }
  ]

  // Unsplash collections
  const unsplashCollections = {
    space: [
      { id: 'space1', url: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=1920', name: 'Galaxy' },
      { id: 'space2', url: 'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=1920', name: 'Northern Lights' },
      { id: 'space3', url: 'https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?w=1920', name: 'Milky Way' },
      { id: 'space4', url: 'https://images.unsplash.com/photo-1465101162946-4377e57745c3?w=1920', name: 'Space Clouds' },
      { id: 'space5', url: 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?w=1920', name: 'Starfield' },
      { id: 'space6', url: 'https://images.unsplash.com/photo-1454789548928-9efd52dc4031?w=1920', name: 'Earth from Space' }
    ],
    nature: [
      { id: 'nature1', url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920', name: 'Mountains' },
      { id: 'nature2', url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1920', name: 'Foggy Hills' },
      { id: 'nature3', url: 'https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=1920', name: 'Forest' },
      { id: 'nature4', url: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=1920', name: 'Forest Path' },
      { id: 'nature5', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1920', name: 'Mountain Lake' },
      { id: 'nature6', url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1920', name: 'Valley' }
    ],
    architecture: [
      { id: 'arch1', url: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1920', name: 'City Street' },
      { id: 'arch2', url: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=1920', name: 'City Skyline' },
      { id: 'arch3', url: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1920', name: 'Modern Building' },
      { id: 'arch4', url: 'https://images.unsplash.com/photo-1513584684374-8bab748fbf90?w=1920', name: 'Architecture' },
      { id: 'arch5', url: 'https://images.unsplash.com/photo-1494145904049-0dca59b4bbad?w=1920', name: 'City Lights' },
      { id: 'arch6', url: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1920', name: 'Dubai' }
    ],
    abstract: [
      { id: 'abstract1', url: 'https://images.unsplash.com/photo-1567095761054-7a02e69e5c43?w=1920', name: 'Gradient' },
      { id: 'abstract2', url: 'https://images.unsplash.com/photo-1604076913837-52ab5629fba9?w=1920', name: 'Liquid' },
      { id: 'abstract3', url: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=1920', name: 'Watercolor' },
      { id: 'abstract4', url: 'https://images.unsplash.com/photo-1549490349-8643362247b5?w=1920', name: 'Smoke' },
      { id: 'abstract5', url: 'https://images.unsplash.com/photo-1574169208507-84376144848b?w=1920', name: 'Paint' },
      { id: 'abstract6', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1920', name: 'Geometric' }
    ]
  }

  const [selectedUnsplashCategory, setSelectedUnsplashCategory] = useState('space')
  
  // Check if a widget type is already added
  const isWidgetAdded = (widgetTypeId) => {
    return widgets.some(w => w.type === widgetTypeId)
  }
  
  // Handle widget addition with visual feedback
  const handleWidgetAdd = (widgetType) => {
    addWidget(widgetType)
    setRecentlyAdded(prev => new Set(prev).add(widgetType.id))
    
    // Remove the "recently added" indicator after 2 seconds
    setTimeout(() => {
      setRecentlyAdded(prev => {
        const newSet = new Set(prev)
        newSet.delete(widgetType.id)
        return newSet
      })
    }, 2000)
  }

  const handleBackgroundChange = (type, value, imageUrl = null, source = 'local') => {
    updateSettings({
      backgroundType: type,
      background: value,
      backgroundUrl: imageUrl,
      backgroundSource: source
    })
    // Update body background
    if (type === 'gradient') {
      document.body.className = ''
      document.body.setAttribute('data-bg', value)
    } else if (type === 'image') {
      document.body.className = 'image-background'
      document.body.removeAttribute('data-bg')
    }
  }

  return (
    <motion.div
      className="settings-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="settings-container"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="settings-header">
          <h2 className="settings-title">Settings</h2>
          <button className="settings-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="settings-tabs">
          <button
            className={`settings-tab ${activeTab === 'appearance' ? 'active' : ''}`}
            onClick={() => setActiveTab('appearance')}
          >
            Appearance
          </button>
          <button
            className={`settings-tab ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            General
          </button>
          <button
            className={`settings-tab ${activeTab === 'widgets' ? 'active' : ''}`}
            onClick={() => setActiveTab('widgets')}
          >
            Widgets
          </button>
        </div>

        <div className="settings-content">
          {activeTab === 'appearance' && (
            <div className="settings-section">
              <div className="settings-group">
                <h3 className="settings-group-title">Background</h3>
                
                <div className="background-section">
                  <h4 className="background-section-title">Gradients</h4>
                  <div className="background-grid">
                    {gradients.map((gradient) => (
                      <div
                        key={gradient.value}
                        className={`background-option ${settings.backgroundType === 'gradient' && settings.background === gradient.value ? 'active' : ''}`}
                        onClick={() => handleBackgroundChange('gradient', gradient.value)}
                      >
                        <div className="background-preview gradient-preview" style={{ background: gradient.colors }} />
                        <span className="background-name">{gradient.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="background-section">
                  <h4 className="background-section-title">NASA Webb Images</h4>
                  {gcsLoading ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.6)' }}>
                      Loading images...
                    </div>
                  ) : gcsImages.length > 0 ? (
                    <div className="background-grid image-grid">
                      {gcsImages.map((image) => (
                        <div
                          key={image.id}
                          className={`background-option jwst-image-option ${settings.backgroundType === 'image' && settings.background === image.id ? 'active' : ''}`}
                          onClick={() => handleBackgroundChange('image', image.id, null, 'gcs')}
                        >
                          <div className="background-preview image-preview">
                            <img src={image.thumbnail} alt={image.name} loading="lazy" />
                            <div className="image-icon">
                              <Image size={16} />
                            </div>
                            {image.description && (
                              <div className="jwst-metadata-tooltip">
                                <div className="jwst-metadata-title">{image.name}</div>
                                <div className="jwst-metadata-description">{image.description}</div>
                                {image.distance && (
                                  <div className="jwst-metadata-info">
                                    <strong>Distance:</strong> {image.distance}
                                  </div>
                                )}
                                {image.captured && (
                                  <div className="jwst-metadata-info">
                                    <strong>Captured:</strong> {image.captured}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          <span className="background-name">{image.name}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.6)' }}>
                      No images available
                    </div>
                  )}
                </div>

                <div className="background-section">
                  <h4 className="background-section-title">Unsplash Photos</h4>
                  <div className="unsplash-categories">
                    {Object.keys(unsplashCollections).map((category) => (
                      <button
                        key={category}
                        className={`unsplash-cat ${selectedUnsplashCategory === category ? 'active' : ''}`}
                        onClick={() => setSelectedUnsplashCategory(category)}
                      >
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </button>
                    ))}
                  </div>
                  <div className="background-grid image-grid">
                    {unsplashCollections[selectedUnsplashCategory].map((image) => (
                      <div
                        key={image.id}
                        className={`background-option ${settings.backgroundType === 'image' && settings.background === image.id && settings.backgroundSource === 'unsplash' ? 'active' : ''}`}
                        onClick={() => handleBackgroundChange('image', image.id, image.url, 'unsplash')}
                      >
                        <div className="background-preview image-preview">
                          <img src={image.url} alt={image.name} loading="lazy" />
                          <div className="image-icon">
                            <Image size={16} />
                          </div>
                        </div>
                        <span className="background-name">{image.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'general' && (
            <div className="settings-section">
              <div className="settings-group">
                <h3 className="settings-group-title">Personalization</h3>
                <div className="config-group">
                  <label className="config-label">Your Name</label>
                  <input
                    type="text"
                    className="config-input"
                    placeholder="Enter your name"
                    value={settings.userName || ''}
                    onChange={(e) => updateSettings({ userName: e.target.value })}
                  />
                  <p className="config-help">Used in the greeting message</p>
                </div>
              </div>

              <div className="settings-group">
                <h3 className="settings-group-title">Search</h3>
                <div className="config-group">
                  <label className="config-label">Default Search Engine</label>
                  <select
                    className="config-select"
                    value={settings.searchEngine || 'google'}
                    onChange={(e) => updateSettings({ searchEngine: e.target.value })}
                  >
                    <option value="google">Google</option>
                    <option value="duckduckgo">DuckDuckGo</option>
                    <option value="bing">Bing</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'widgets' && (
            <div className="settings-section">
              <div className="settings-group">
                <h3 className="settings-group-title">Widget Settings</h3>
                <p className="settings-description">Configure widget display options</p>
                
                <div className="config-group">
                  <label className="config-label">Weather Widget</label>
                  <div className="config-row">
                    <label className="config-checkbox">
                      <input
                        type="checkbox"
                        checked={settings.weatherShowDaily !== false}
                        onChange={(e) => updateSettings({ weatherShowDaily: e.target.checked })}
                      />
                      <span className="checkbox-label">Show 5-Day Forecast</span>
                    </label>
                  </div>
                  <div className="config-row">
                    <label className="config-checkbox">
                      <input
                        type="checkbox"
                        checked={settings.weatherShowHourly !== false}
                        onChange={(e) => updateSettings({ weatherShowHourly: e.target.checked })}
                      />
                      <span className="checkbox-label">Show Hourly Forecast</span>
                    </label>
                  </div>
                  <p className="config-help">5-day forecast is automatically hidden when widget height is too small</p>
                </div>
              </div>

              <div className="settings-group">
                <h3 className="settings-group-title">Available Widgets</h3>
                <p className="settings-description">Add widgets to customize your home screen. Click multiple widgets to add them all at once!</p>
                <div className="widget-grid">
                  {Object.values(WIDGET_TYPES).map((widgetType) => {
                    const isAdded = isWidgetAdded(widgetType.id)
                    const wasRecentlyAdded = recentlyAdded.has(widgetType.id)
                    
                    return (
                      <motion.div
                        key={widgetType.id}
                        className={`widget-option-card ${isAdded ? 'widget-added' : ''} ${wasRecentlyAdded ? 'widget-just-added' : ''}`}
                        onClick={() => !isAdded && handleWidgetAdd(widgetType)}
                        whileHover={{ scale: isAdded ? 1 : 1.02 }}
                        whileTap={{ scale: isAdded ? 1 : 0.98 }}
                      >
                        <span className="widget-option-icon">{widgetType.icon}</span>
                        <h3 className="widget-option-name">{widgetType.name}</h3>
                        <p className="widget-option-description">{widgetType.description}</p>
                        <div className={`widget-option-add ${isAdded ? 'added' : ''}`}>
                          <AnimatePresence mode="wait">
                            {isAdded ? (
                              <motion.div
                                key="check"
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                exit={{ scale: 0, rotate: 180 }}
                              >
                                <Check size={16} />
                              </motion.div>
                            ) : (
                              <motion.div
                                key="plus"
                                initial={{ scale: 0, rotate: 180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                exit={{ scale: 0, rotate: -180 }}
                              >
                                <Plus size={16} />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                        {isAdded && <div className="widget-added-badge">Added</div>}
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

export default SettingsPanel