/**
 * Image Service - Fetches and manages images from Google Cloud Storage
 */

const MANIFEST_URL = 'https://storage.googleapis.com/chrome-home-images/manifest.json';
const CACHE_KEY = 'gcs_image_manifest';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

class ImageService {
  constructor() {
    this.manifest = null;
    this.lastFetch = null;
  }

  /**
   * Load the image manifest from GCS or cache
   * @returns {Promise<Object|null>} The manifest object or null on error
   */
  async loadManifest() {
    // Check if we have a cached manifest
    const cached = await this.getCachedManifest();
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('📦 Using cached manifest');
      this.manifest = cached.data;
      return this.manifest;
    }

    // Fetch fresh manifest
    try {
      console.log('🔄 Fetching manifest from GCS...');
      const response = await fetch(MANIFEST_URL);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      this.manifest = await response.json();
      this.lastFetch = Date.now();

      // Cache the manifest
      await this.cacheManifest(this.manifest);

      console.log(`✅ Loaded ${this.manifest.images.length} images from GCS`);
      return this.manifest;
    } catch (error) {
      console.error('❌ Failed to load manifest:', error);
      
      // Try to use cached manifest even if expired
      if (cached) {
        console.warn('⚠️ Using expired cache as fallback');
        this.manifest = cached.data;
        return this.manifest;
      }
      
      return null;
    }
  }

  /**
   * Get a random image with specified size and format
   * @param {string} size - 'full', 'preview', or 'thumbnail'
   * @param {string} format - 'jpg' or 'webp'
   * @returns {Promise<Object|null>} Image variant object or null
   */
  async getRandomImage(size = 'preview', format = 'webp') {
    const manifest = await this.loadManifest();
    if (!manifest || !manifest.images || manifest.images.length === 0) {
      return null;
    }

    // Get a random image
    const randomIndex = Math.floor(Math.random() * manifest.images.length);
    const image = manifest.images[randomIndex];

    // Find the requested variant
    const variant = image.variants.find(
      v => v.size === size && v.format === format
    );

    if (variant) {
      return {
        ...variant,
        imageName: image.name,
        imageId: image.id
      };
    }

    // Fallback to any available variant
    return {
      ...image.variants[0],
      imageName: image.name,
      imageId: image.id
    };
  }

  /**
   * Get multiple random images
   * @param {number} count - Number of images to get
   * @param {string} size - 'full', 'preview', or 'thumbnail'
   * @param {string} format - 'jpg' or 'webp'
   * @returns {Promise<Array>} Array of image variant objects
   */
  async getRandomImages(count = 5, size = 'preview', format = 'webp') {
    const manifest = await this.loadManifest();
    if (!manifest || !manifest.images || manifest.images.length === 0) {
      return [];
    }

    // Shuffle images array
    const shuffled = [...manifest.images].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(count, shuffled.length));

    return selected.map(image => {
      const variant = image.variants.find(
        v => v.size === size && v.format === format
      );
      return variant || image.variants[0];
    });
  }

  /**
   * Preload images for faster display
   * @param {number} count - Number of images to preload
   * @param {string} size - 'full', 'preview', or 'thumbnail'
   * @param {string} format - 'jpg' or 'webp'
   * @returns {Promise<Array>} Array of preloaded image objects
   */
  async preloadImages(count = 5, size = 'preview', format = 'webp') {
    const images = await this.getRandomImages(count, size, format);
    
    const preloadPromises = images.map(variant => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve({ ...variant, loaded: true });
        img.onerror = () => reject(new Error(`Failed to load: ${variant.url}`));
        img.src = variant.url;
      });
    });

    try {
      return await Promise.all(preloadPromises);
    } catch (error) {
      console.warn('⚠️ Some images failed to preload:', error);
      return [];
    }
  }

  /**
   * Get all available images
   * @returns {Promise<Array>} Array of all images with their variants
   */
  async getAllImages() {
    const manifest = await this.loadManifest();
    return manifest?.images || [];
  }

  /**
   * Cache the manifest in localStorage
   * @param {Object} data - Manifest data to cache
   */
  async cacheManifest(data) {
    try {
      const cacheData = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('⚠️ Failed to cache manifest:', error);
    }
  }

  /**
   * Get cached manifest from localStorage
   * @returns {Object|null} Cached data or null
   */
  async getCachedManifest() {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.warn('⚠️ Failed to read cache:', error);
      return null;
    }
  }

  /**
   * Clear the cached manifest
   */
  clearCache() {
    localStorage.removeItem(CACHE_KEY);
    console.log('🗑️ Manifest cache cleared');
  }
}

// Export singleton instance
export const imageService = new ImageService();
export default imageService;

