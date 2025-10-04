/**
 * Chrome Extension Authentication Service
 * Handles token generation, validation, and extension identity verification
 */

interface ExtensionIdentity {
  extensionId: string
  extensionVersion: string
  installTime: number
  fingerprint: string
  userAgent: string
  timezone: string
}

interface AuthToken {
  token: string
  identity: ExtensionIdentity
}

interface TokenPayload {
  ext: string
  fp: string
  ts: number
  nonce: string
}

interface AuthHeaders {
  'X-Extension-Token': string
  'X-Extension-ID': string
  'X-Extension-Version': string
  'X-Extension-Fingerprint': string
  'X-Request-ID': string
  'Content-Type': string
}

interface ExtensionStats {
  identity?: ExtensionIdentity
  installTime: number
  uptime: number
  requestCount: number
  lastActivity: number
}

interface UsageStats {
  requests: number
  lastActivity: number
}

class ExtensionAuthService {
  private readonly storageKey = 'ext_auth_token'
  private readonly identityKey = 'ext_identity'
  private readonly sessionKey = 'ext_session'
  private readonly baseUrl = 'https://weather-service-fws6uj4tlq-uc.a.run.app/api'

  /**
   * Generate a unique extension identity
   */
  async generateExtensionIdentity(): Promise<ExtensionIdentity> {
    try {
      const extensionId = chrome?.runtime?.id || 'dev-extension'
      const extensionVersion = chrome?.runtime?.getManifest()?.version || '1.0.0'
      const installTime = await this.getInstallTime()
      const userAgent = navigator.userAgent
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      
      // Create a unique fingerprint
      const fingerprint = await this.generateFingerprint({
        extensionId,
        extensionVersion,
        installTime,
        userAgent,
        timezone
      })

      return {
        extensionId,
        extensionVersion,
        installTime,
        fingerprint,
        userAgent: this.sanitizeUserAgent(userAgent),
        timezone
      }
    } catch (error) {
      console.warn('Error generating extension identity:', error)
      const { v4: uuidv4 } = await import('uuid')
      return {
        extensionId: 'unknown',
        extensionVersion: '1.0.0',
        installTime: Date.now(),
        fingerprint: uuidv4(),
        userAgent: 'Chrome Extension',
        timezone: 'UTC'
      }
    }
  }

  /**
   * Get extension install time
   */
  private async getInstallTime(): Promise<number> {
    try {
      const stored = await this.getFromStorage<number>('install_time')
      if (stored) return stored

      const installTime = Math.floor(Date.now() / 1000) // Convert to seconds for backend compatibility
      await this.setInStorage('install_time', installTime)
      return installTime
    } catch (error) {
      return Math.floor(Date.now() / 1000) // Convert to seconds for backend compatibility
    }
  }

  /**
   * Generate a cryptographic fingerprint
   */
  private async generateFingerprint(data: Record<string, any>): Promise<string> {
    try {
      const encoder = new TextEncoder()
      const dataString = JSON.stringify(data, Object.keys(data).sort())
      const dataBuffer = encoder.encode(dataString)
      const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    } catch (error) {
      // Fallback for environments without crypto.subtle
      return btoa(JSON.stringify(data)).replace(/[^a-zA-Z0-9]/g, '').substring(0, 64)
    }
  }

  /**
   * Generate SHA256 hash of a string (for token signatures)
   */
  private async generateStringHash(data: string): Promise<string> {
    try {
      const encoder = new TextEncoder()
      const dataBuffer = encoder.encode(data)
      const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    } catch (error) {
      // Fallback
      return btoa(data).replace(/[^a-zA-Z0-9]/g, '').substring(0, 64)
    }
  }

  /**
   * Sanitize user agent to remove sensitive info
   */
  private sanitizeUserAgent(userAgent: string): string {
    return userAgent
      .replace(/\s+/g, ' ')
      .replace(/Chrome\/[\d.]+/, 'Chrome/xxx')
      .replace(/Safari\/[\d.]+/, 'Safari/xxx')
      .substring(0, 200)
  }

  /**
   * Get authentication token (prefer background-generated tokens)
   */
  async getAuthToken(): Promise<AuthToken> {
    try {
      // First, check if background script has already generated tokens
      let token = await this.getFromStorage<string>(this.storageKey)
      let identity = await this.getFromStorage<ExtensionIdentity>(this.identityKey)
      
      // Check auth version to force regeneration when signature method changes
      const authVersion = await this.getFromStorage<number>('auth_version')
      const CURRENT_AUTH_VERSION = 2 // Increment this to force regeneration
      
      if (authVersion !== CURRENT_AUTH_VERSION) {
        console.log('🔄 Auth version changed, regenerating tokens with new signature method...')
        token = null
        identity = null
        await this.clearAuth()
        await this.setInStorage('auth_version', CURRENT_AUTH_VERSION)
      }
      
      // Force regeneration if token has millisecond timestamp (old format)
      if (token) {
        try {
          const parts = token.split('.')
          if (parts.length === 2) {
            const payload = JSON.parse(atob(parts[0]))
            if (payload.ts && payload.ts > 9999999999) { // More than 10 digits = milliseconds
              console.log('🔄 Detected old token format with millisecond timestamp, regenerating...')
              token = null
              identity = null
              await this.clearAuth()
            }
          }
        } catch (e) {
          // Invalid token, will regenerate below
        }
      }

      // Check if background script initialization is in progress or failed
      const authState = await this.getFromStorage<any>('auth_init_failed')
      const backendRegistered = await this.getFromStorage<boolean>('backend_registered')

      if (!token || !identity) {
        console.log('⚠️ No auth token found, background script may not have initialized yet')
        
        // If background script hasn't run or failed, generate tokens as fallback
        identity = await this.generateExtensionIdentity()
        token = await this.generateSecureToken(identity)
        
        await this.setInStorage(this.storageKey, token)
        await this.setInStorage(this.identityKey, identity)

        // Try to register with backend if not already done
        if (!backendRegistered && !authState) {
          await this.registerExtension(token, identity)
        }
      }

      // Validate token age (24 hours max)
      const tokenAge = this.getTokenAge(token)
      if (tokenAge > 24 * 60 * 60 * 1000) {
        console.log('🔄 Token expired, refreshing...')
        token = await this.generateSecureToken(identity as ExtensionIdentity)
        await this.setInStorage(this.storageKey, token)
        await this.registerExtension(token, identity as ExtensionIdentity)
      }

      return { token, identity: identity as ExtensionIdentity }
    } catch (error) {
      console.error('Error getting auth token:', error)
      // Return a minimal token to prevent hanging - API calls will fail but app won't crash
      const { v4: uuidv4 } = await import('uuid')
      return {
        token: 'error-token',
        identity: {
          extensionId: 'unknown',
          extensionVersion: '1.0.0',
          installTime: Date.now(),
          fingerprint: uuidv4(),
          userAgent: 'Chrome Extension',
          timezone: 'UTC'
        }
      }
    }
  }

  /**
   * Get token age from its payload
   */
  private getTokenAge(token: string): number {
    try {
      const parts = token.split('.')
      if (parts.length !== 2) return Infinity
      
      const payloadBytes = atob(parts[0])
      const payload = JSON.parse(payloadBytes)
      
      return Date.now() - ((payload.ts || 0) * 1000) // Convert seconds back to milliseconds
    } catch (error) {
      return Infinity // Treat invalid tokens as expired
    }
  }

  /**
   * Generate a secure token
   */
  private async generateSecureToken(identity: ExtensionIdentity): Promise<string> {
    const { v4: uuidv4 } = await import('uuid')
    const timestamp = Math.floor(Date.now() / 1000) // Convert to seconds for backend compatibility
    const nonce = uuidv4()
    const payload: TokenPayload = {
      ext: identity.extensionId,
      fp: identity.fingerprint,
      ts: timestamp,
      nonce
    }

    const tokenData = btoa(JSON.stringify(payload))
    const signature = await this.generateStringHash(tokenData + identity.fingerprint)
    
    return `${tokenData}.${signature.substring(0, 32)}`
  }

  /**
   * Register extension with backend
   */
  private async registerExtension(token: string, identity: ExtensionIdentity): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Extension-Token': token,
          'X-Extension-ID': identity.extensionId,
          'X-Extension-Version': identity.extensionVersion
        },
        body: JSON.stringify({
          identity,
          timestamp: Math.floor(Date.now() / 1000) // Convert to seconds
        })
      })

      if (!response.ok) {
        throw new Error(`Registration failed: ${response.status}`)
      }

      const result = await response.json()
      console.log('Extension registered successfully:', result.message)
      
      // Mark as registered in storage
      await this.setInStorage('backend_registered', true)
      await this.setInStorage('registration_time', Date.now())
      
      return result
    } catch (error) {
      console.warn('Extension registration failed:', error)
      // Don't throw - allow extension to work even if registration fails
    }
  }

  /**
   * Get authenticated headers for API requests
   */
  async getAuthHeaders(): Promise<AuthHeaders | Record<string, string>> {
    try {
      const { token, identity } = await this.getAuthToken()
      const { v4: uuidv4 } = await import('uuid')
      
      return {
        'X-Extension-Token': token,
        'X-Extension-ID': identity.extensionId,
        'X-Extension-Version': identity.extensionVersion,
        'X-Extension-Fingerprint': identity.fingerprint,
        'X-Request-ID': uuidv4(),
        'Content-Type': 'application/json'
      }
    } catch (error) {
      console.error('Error getting auth headers:', error)
      // Return minimal headers for fallback
      return {
        'Content-Type': 'application/json',
        'X-Extension-ID': 'unknown'
      }
    }
  }

  /**
   * Make authenticated API request
   */
  async authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    try {
      const headers = await this.getAuthHeaders()
      
      console.log('🔐 Making authenticated request to:', url)
      console.log('🔑 Auth headers:', headers)
      
      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...(options.headers || {})
        }
      })

      // If we get a 401 with "Extension not registered", try re-registration ONCE
      if (response.status === 401) {
        // Check if we already tried to re-register recently (within last 5 minutes)
        const lastRetry = await this.getFromStorage<number>('last_auth_retry')
        const now = Date.now()
        
        if (lastRetry && (now - lastRetry) < 5 * 60 * 1000) {
          console.log('⚠️ Already tried re-registration recently, skipping retry')
          return response
        }
        
        const text = await response.clone().text()
        if (text.includes('Extension not registered') || text.includes('inactive')) {
          console.log('🔄 Extension not registered, attempting re-registration...')
          
          // Mark retry attempt
          await this.setInStorage('last_auth_retry', now)
          
          // Clear registration flag and get fresh token
          await this.removeFromStorage('backend_registered')
          
          try {
            const { token, identity } = await this.getAuthToken()
            
            // Try to register
            await this.registerExtension(token, identity)
            
            // Retry the original request once
            console.log('🔄 Retrying request after registration...')
            const retryHeaders = await this.getAuthHeaders()
            return fetch(url, {
              ...options,
              headers: {
                ...retryHeaders,
                ...(options.headers || {})
              }
            })
          } catch (retryError) {
            console.error('Failed to re-register:', retryError)
            return response // Return original 401 response
          }
        }
      }

      return response
    } catch (error) {
      console.error('authenticatedFetch error:', error)
      throw error
    }
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(): Promise<AuthToken> {
    await this.clearAuth()
    return this.getAuthToken()
  }

  /**
   * Clear authentication data
   */
  async clearAuth(): Promise<void> {
    await this.removeFromStorage(this.storageKey)
    await this.removeFromStorage(this.identityKey)
    await this.removeFromStorage(this.sessionKey)
  }

  /**
   * Validate current token
   */
  async validateToken(): Promise<boolean> {
    try {
      const response = await this.authenticatedFetch(`${this.baseUrl}/auth/validate`)
      return response.ok
    } catch (error) {
      console.warn('Token validation failed:', error)
      return false
    }
  }

  /**
   * Storage helpers
   */
  private async getFromStorage<T>(key: string): Promise<T | null> {
    try {
      if (chrome?.storage?.local) {
        const result = await chrome.storage.local.get(key)
        return result[key] || null
      } else {
        // Fallback to localStorage for development
        const item = localStorage.getItem(key)
        return item ? JSON.parse(item) : null
      }
    } catch (error) {
      console.warn('Storage get error:', error)
      return null
    }
  }

  private async setInStorage<T>(key: string, value: T): Promise<void> {
    try {
      if (chrome?.storage?.local) {
        await chrome.storage.local.set({ [key]: value })
      } else {
        // Fallback to localStorage for development
        localStorage.setItem(key, JSON.stringify(value))
      }
    } catch (error) {
      console.error('Storage set error:', error)
    }
  }

  private async removeFromStorage(key: string): Promise<void> {
    try {
      if (chrome?.storage?.local) {
        await chrome.storage.local.remove(key)
      } else {
        // Fallback to localStorage for development
        localStorage.removeItem(key)
      }
    } catch (error) {
      console.warn('Storage remove error:', error)
    }
  }

  /**
   * Get extension statistics for security monitoring
   */
  async getExtensionStats(): Promise<ExtensionStats> {
    try {
      const identity = await this.getFromStorage<ExtensionIdentity>(this.identityKey)
      const installTime = await this.getInstallTime()
      const usage = await this.getFromStorage<UsageStats>('usage_stats') || { requests: 0, lastActivity: Date.now() }
      
      return {
        identity,
        installTime,
        uptime: Date.now() - installTime,
        requestCount: usage.requests || 0,
        lastActivity: usage.lastActivity || Date.now()
      }
    } catch (error) {
      console.warn('Error getting extension stats:', error)
      return {
        installTime: Date.now(),
        uptime: 0,
        requestCount: 0,
        lastActivity: Date.now()
      }
    }
  }

  /**
   * Update usage statistics
   */
  async updateUsageStats(): Promise<void> {
    try {
      const stats = await this.getFromStorage<UsageStats>('usage_stats') || { requests: 0, lastActivity: Date.now() }
      stats.requests = (stats.requests || 0) + 1
      stats.lastActivity = Date.now()
      
      await this.setInStorage('usage_stats', stats)
    } catch (error) {
      console.warn('Error updating usage stats:', error)
    }
  }
}

// Create singleton instance
const authService = new ExtensionAuthService()

export default authService
export { ExtensionAuthService }
export type { ExtensionIdentity, AuthToken, AuthHeaders, ExtensionStats }