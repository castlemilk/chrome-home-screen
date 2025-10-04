import { useState, useEffect } from 'react'
import { useSettings } from '../contexts/SettingsContext'
import imageService from '../services/imageService'

const BackgroundSelector = () => {
  const { settings } = useSettings()
  const [backgroundUrl, setBackgroundUrl] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  
  // Load background image
  useEffect(() => {
    loadBackground()
  }, [settings.background, settings.backgroundType, settings.backgroundUrl])
  
  const loadBackground = async () => {
    if (settings.backgroundType !== 'image' || !settings.background) {
      setBackgroundUrl(null)
      return
    }
    
    // Check if it's a GCS image ID
    if (settings.backgroundSource === 'gcs' || (!settings.backgroundUrl && !settings.background.includes('.'))) {
      setIsLoading(true)
      try {
        // Fetch from GCS using the image ID
        const manifest = await imageService.loadManifest()
        if (manifest) {
          const image = manifest.images.find(img => img.id === settings.background)
          if (image) {
            // Use preview size in WebP format for best balance
            const variant = image.variants.find(v => v.size === 'preview' && v.format === 'webp')
              || image.variants.find(v => v.size === 'preview')
              || image.variants[0]
            
            if (variant) {
              setBackgroundUrl(variant.url)
            }
          }
        }
      } catch (error) {
        console.error('Failed to load GCS image:', error)
        // Fallback to local if GCS fails
        if (settings.background.includes('.jpg') || settings.background.includes('.png')) {
          setBackgroundUrl(`/images/jwst-optimized/${settings.background}`)
        }
      } finally {
        setIsLoading(false)
      }
    } else if (settings.backgroundUrl) {
      // Unsplash or external URL
      setBackgroundUrl(settings.backgroundUrl)
    } else if (settings.background.includes('.jpg') || settings.background.includes('.png')) {
      // Local JWST image
      setBackgroundUrl(`/images/jwst-optimized/${settings.background}`)
    }
  }
  
  const style = {}
  if (backgroundUrl) {
    style.backgroundImage = `url(${backgroundUrl})`
    style.opacity = isLoading ? 0.5 : 1
  }
  
  return <div className={`background-layer ${settings.backgroundType === 'image' && backgroundUrl ? 'loaded' : ''}`} style={style} />
}

export default BackgroundSelector