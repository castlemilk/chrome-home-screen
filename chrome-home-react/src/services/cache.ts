/**
 * Cache service for managing API data across multiple tabs
 * Uses Chrome storage API for persistence and cross-tab synchronization
 * Now includes authentication support
 */

import authService from './auth'

const CACHE_PREFIX = 'cache_'
const CACHE_META_PREFIX = 'cache_meta_'

interface CachedData<T = any> {
  data: T
  timestamp: number
}

interface CacheMetadata {
  timestamp: number
}

interface FetchOptions {
  params?: Record<string, any>
  maxAge?: number
  forceRefresh?: boolean
  headers?: Record<string, string>
  method?: string
  body?: any
}

interface CacheStats {
  memoryCacheSize: number
  storageCacheSize: number
  totalBytes: number
  pendingRequests: number
}

type CacheListener<T = any> = (data: T) => void
type UnsubscribeFn = () => void

class CacheService {
  private memoryCache = new Map<string, CachedData>()
  private pendingRequests = new Map<string, Promise<any>>()
  private listeners = new Map<string, Set<CacheListener>>()

  constructor() {
    // Listen for storage changes from other tabs
    if (chrome?.storage?.onChanged) {
      chrome.storage.onChanged.addListener(this.handleStorageChange.bind(this))
    }
  }

  /**
   * Generate cache key from URL and params
   */
  getCacheKey(url: string, params: Record<string, any> = {}): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&')
    return `${CACHE_PREFIX}${url}${sortedParams ? '?' + sortedParams : ''}`
  }

  /**
   * Get data from cache with expiration check
   */
  async get<T = any>(key: string, maxAge: number = 5 * 60 * 1000): Promise<T | null> {
    const cacheKey = key.startsWith(CACHE_PREFIX) ? key : `${CACHE_PREFIX}${key}`
    const metaKey = `${CACHE_META_PREFIX}${key}`

    // Check memory cache first
    if (this.memoryCache.has(cacheKey)) {
      const cached = this.memoryCache.get(cacheKey)!
      if (this.isValid(cached.timestamp, maxAge)) {
        return cached.data
      }
      this.memoryCache.delete(cacheKey)
    }

    // Check Chrome storage
    try {
      const result = await chrome.storage.local.get([cacheKey, metaKey])
      if (result[cacheKey] && result[metaKey]) {
        const metadata: CacheMetadata = result[metaKey]
        if (this.isValid(metadata.timestamp, maxAge)) {
          // Store in memory cache for faster subsequent access
          this.memoryCache.set(cacheKey, {
            data: result[cacheKey],
            timestamp: metadata.timestamp
          })
          return result[cacheKey]
        }
        // Clean up expired cache
        await this.remove(key)
      }
    } catch (error) {
      console.warn('Cache read error:', error)
    }

    return null
  }

  /**
   * Set data in cache
   */
  async set<T = any>(key: string, data: T): Promise<void> {
    const cacheKey = key.startsWith(CACHE_PREFIX) ? key : `${CACHE_PREFIX}${key}`
    const metaKey = `${CACHE_META_PREFIX}${key}`
    const timestamp = Date.now()

    // Store in memory cache
    this.memoryCache.set(cacheKey, { data, timestamp })

    // Store in Chrome storage
    try {
      await chrome.storage.local.set({
        [cacheKey]: data,
        [metaKey]: { timestamp }
      })
    } catch (error) {
      console.error('Cache write error:', error)
      // If storage fails, at least we have memory cache
    }

    // Notify listeners
    this.notifyListeners(key, data)
  }

  /**
   * Remove item from cache
   */
  async remove(key: string): Promise<void> {
    const cacheKey = key.startsWith(CACHE_PREFIX) ? key : `${CACHE_PREFIX}${key}`
    const metaKey = `${CACHE_META_PREFIX}${key}`

    this.memoryCache.delete(cacheKey)
    
    try {
      await chrome.storage.local.remove([cacheKey, metaKey])
    } catch (error) {
      console.warn('Cache remove error:', error)
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    this.memoryCache.clear()
    
    try {
      const keys = await chrome.storage.local.get(null)
      const cacheKeys = Object.keys(keys).filter(key => 
        key.startsWith(CACHE_PREFIX) || key.startsWith(CACHE_META_PREFIX)
      )
      await chrome.storage.local.remove(cacheKeys)
    } catch (error) {
      console.error('Cache clear error:', error)
    }
  }

  /**
   * Check if cache entry is still valid
   */
  private isValid(timestamp: number, maxAge: number): boolean {
    return Date.now() - timestamp < maxAge
  }

  /**
   * Fetch with caching and deduplication
   */
  async fetchWithCache<T = any>(url: string, options: FetchOptions = {}): Promise<T> {
    const {
      params = {},
      maxAge = 5 * 60 * 1000,
      forceRefresh = false,
      ...fetchOptions
    } = options

    const cacheKey = this.getCacheKey(url, params)

    // Check cache first unless force refresh
    if (!forceRefresh) {
      const cached = await this.get<T>(cacheKey, maxAge)
      if (cached !== null) {
        return cached
      }
    }

    // Check if there's already a pending request for this resource
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey)!
    }

    // Create new request promise
    const requestPromise = this.performFetch<T>(url, params, fetchOptions)
      .then(async data => {
        await this.set(cacheKey, data)
        this.pendingRequests.delete(cacheKey)
        return data
      })
      .catch(error => {
        this.pendingRequests.delete(cacheKey)
        throw error
      })

    // Store pending request to prevent duplicate fetches
    this.pendingRequests.set(cacheKey, requestPromise)
    return requestPromise
  }

  /**
   * Perform actual fetch with authentication
   */
  private async performFetch<T = any>(
    url: string, 
    params: Record<string, any> = {}, 
    options: Omit<FetchOptions, 'params' | 'maxAge' | 'forceRefresh'> = {}
  ): Promise<T> {
    const queryString = new URLSearchParams(params).toString()
    const fullUrl = queryString ? `${url}?${queryString}` : url

    try {
      // Get authenticated headers
      const authHeaders = await authService.getAuthHeaders()
      
      // Update usage stats
      await authService.updateUsageStats()

      const response = await fetch(fullUrl, {
        ...options,
        headers: {
          ...authHeaders,
          ...options.headers
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // Handle different response types
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        return response.json()
      }
      return response.text() as T
    } catch (error) {
      console.warn('Authenticated fetch failed, falling back to basic request:', error)
      
      // Fallback to basic request if authentication fails
      const response = await fetch(fullUrl, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        return response.json()
      }
      return response.text() as T
    }
  }

  /**
   * Subscribe to cache updates
   */
  subscribe<T = any>(key: string, callback: CacheListener<T>): UnsubscribeFn {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set())
    }
    this.listeners.get(key)!.add(callback as CacheListener)

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(key)
      if (callbacks) {
        callbacks.delete(callback as CacheListener)
        if (callbacks.size === 0) {
          this.listeners.delete(key)
        }
      }
    }
  }

  /**
   * Notify listeners of cache updates
   */
  private notifyListeners<T = any>(key: string, data: T): void {
    const callbacks = this.listeners.get(key)
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error('Cache listener error:', error)
        }
      })
    }
  }

  /**
   * Handle storage changes from other tabs
   */
  private handleStorageChange(changes: { [key: string]: chrome.storage.StorageChange }, areaName: string): void {
    if (areaName !== 'local') return

    Object.keys(changes).forEach(key => {
      if (key.startsWith(CACHE_PREFIX) && !key.startsWith(CACHE_META_PREFIX)) {
        const cacheKey = key.replace(CACHE_PREFIX, '')
        const newValue = changes[key].newValue

        // Update memory cache
        if (newValue !== undefined) {
          this.memoryCache.set(key, {
            data: newValue,
            timestamp: Date.now()
          })
          // Notify listeners
          this.notifyListeners(cacheKey, newValue)
        } else {
          this.memoryCache.delete(key)
        }
      }
    })
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    const memoryCacheSize = this.memoryCache.size
    let storageCacheSize = 0
    let totalBytes = 0

    try {
      const keys = await chrome.storage.local.get(null)
      const cacheKeys = Object.keys(keys).filter(key => 
        key.startsWith(CACHE_PREFIX) && !key.startsWith(CACHE_META_PREFIX)
      )
      storageCacheSize = cacheKeys.length
      
      // Estimate size
      cacheKeys.forEach(key => {
        totalBytes += JSON.stringify(keys[key]).length
      })
    } catch (error) {
      console.warn('Failed to get cache stats:', error)
    }

    return {
      memoryCacheSize,
      storageCacheSize,
      totalBytes,
      pendingRequests: this.pendingRequests.size
    }
  }
}

// Create singleton instance
const cacheService = new CacheService()

// Export for use in other modules
export default cacheService

// Also export specific cache configurations for different data types
export const CacheConfig = {
  WEATHER: {
    maxAge: 15 * 60 * 1000, // 15 minutes
    key: 'weather'
  },
  WEATHER_UI_STATE: {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days for UI state
    key: 'weather_ui_state'
  },
  STOCKS: {
    maxAge: 1 * 60 * 1000, // 1 minute during market hours
    key: 'stocks'
  },
  NEWS: {
    maxAge: 30 * 60 * 1000, // 30 minutes
    key: 'news'
  },
  SEARCH_HISTORY: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    key: 'search_history'
  }
}

export type { CachedData, FetchOptions, CacheStats, CacheListener, UnsubscribeFn }