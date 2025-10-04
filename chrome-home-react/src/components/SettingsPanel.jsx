import { motion } from 'framer-motion'
import { X, Image, Plus, Cloud } from 'lucide-react'
import { useSettings } from '../contexts/SettingsContext'
import { useWidgets } from '../contexts/WidgetContext'
import { useState, useEffect } from 'react'
import { WIDGET_TYPES } from '../App'
import imageService from '../services/imageService'

const SettingsPanel = ({ onClose }) => {
  const { settings, updateSettings } = useSettings()
  const { addWidget } = useWidgets()
  const [activeTab, setActiveTab] = useState('appearance')
  const [gcsImages, setGcsImages] = useState([])
  const [gcsLoading, setGcsLoading] = useState(false)
  
  // Load GCS images when panel opens
  useEffect(() => {
    loadGCSImages()
  }, [])
  
  const loadGCSImages = async () => {
    setGcsLoading(true)
    try {
      const manifest = await imageService.loadManifest()
      if (manifest && manifest.images) {
        // Map manifest images to UI format
        const images = manifest.images.map(img => ({
          id: img.id,
          name: img.name,
          thumbnail: img.variants.find(v => v.size === 'thumbnail' && v.format === 'jpg')?.url || img.variants[0]?.url
        }))
        setGcsImages(images)
      }
    } catch (error) {
      console.error('Failed to load GCS images:', error)
    } finally {
      setGcsLoading(false)
    }
  }
  
  // JWST images
  const jwstImages = [
    { name: 'Tarantula Nebula', file: 'tarantula-nebula.jpg' },
    { name: 'Carina Nebula', file: '53612916394_734d0e1e4a_o.jpg' },
    { name: 'Southern Ring Nebula', file: '53876176351_9cbdfa7df1_o.jpg' },
    { name: 'Stephan\'s Quintet', file: '53876484333_958b3c2c84_o.jpg' },
    { name: 'Webb\'s First Deep Field', file: '53951942710_9389759151_o.jpg' },
    { name: 'Cosmic Cliffs', file: '54088897300_3e378b6a5f_o.jpg' },
    { name: 'Pillars of Creation', file: '54107357754_d57a5943c5_o.jpg' },
    { name: 'NGC 346', file: '54107470055_7387a886d1_o.jpg' },
    { name: 'Rho Ophiuchi', file: '54167157727_9c8df56be1_o.jpg' },
    { name: 'Ring Nebula', file: '54213487373_132699b1df_o.jpg' },
    { name: 'Orion Nebula', file: '54565613170_7e8bef5479_o.jpg' },
    { name: 'Wolf-Rayet Star', file: '54626159771_b9d4f2ea0f_o.jpg' },
    { name: 'Saturn', file: '54639970389_dfbc0c75f6_o.jpg' },
    { name: 'Phantom Galaxy', file: '54644815047_f6aaedf588_o.jpg' },
    { name: 'Cartwheel Galaxy', file: '54688092157_efd8cef20a_o.jpg' },
    { name: 'Neptune', file: '54692963181_e9ddaf3294_o.jpg' }
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
                  <h4 className="background-section-title">
                    <Cloud size={18} style={{ display: 'inline', marginRight: '8px' }} />
                    Cloud Images (GCS)
                  </h4>
                  {gcsLoading ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.6)' }}>
                      Loading images from cloud...
                    </div>
                  ) : gcsImages.length > 0 ? (
                    <div className="background-grid image-grid">
                      {gcsImages.map((image) => (
                        <div
                          key={image.id}
                          className={`background-option ${settings.backgroundType === 'image' && settings.background === image.id && settings.backgroundSource === 'gcs' ? 'active' : ''}`}
                          onClick={() => handleBackgroundChange('image', image.id, null, 'gcs')}
                        >
                          <div className="background-preview image-preview">
                            <img src={image.thumbnail} alt={image.name} loading="lazy" />
                            <div className="image-icon">
                              <Cloud size={16} />
                            </div>
                          </div>
                          <span className="background-name">{image.name}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.6)' }}>
                      No cloud images available. Run: make deploy
                    </div>
                  )}
                </div>

                <div className="background-section">
                  <h4 className="background-section-title">NASA Webb Images (Local)</h4>
                  <div className="background-grid image-grid">
                    {jwstImages.map((image) => (
                      <div
                        key={image.file}
                        className={`background-option ${settings.backgroundType === 'image' && settings.background === image.file && settings.backgroundSource !== 'gcs' ? 'active' : ''}`}
                        onClick={() => handleBackgroundChange('image', image.file, null, 'local')}
                      >
                        <div className="background-preview image-preview">
                          <img src={`/images/jwst-optimized/${image.file}`} alt={image.name} loading="lazy" />
                          <div className="image-icon">
                            <Image size={16} />
                          </div>
                        </div>
                        <span className="background-name">{image.name}</span>
                      </div>
                    ))}
                  </div>
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
                <p className="settings-description">Add widgets to customize your home screen</p>
                <div className="widget-grid">
                  {Object.values(WIDGET_TYPES).map((widgetType) => (
                    <div
                      key={widgetType.id}
                      className="widget-option-card"
                      onClick={() => {
                        addWidget(widgetType)
                        onClose()
                      }}
                    >
                      <span className="widget-option-icon">{widgetType.icon}</span>
                      <h3 className="widget-option-name">{widgetType.name}</h3>
                      <p className="widget-option-description">{widgetType.description}</p>
                      <div className="widget-option-add">
                        <Plus size={16} />
                      </div>
                    </div>
                  ))}
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