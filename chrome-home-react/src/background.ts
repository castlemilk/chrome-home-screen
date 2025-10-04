/**
 * Chrome Extension Background Service Worker
 * Handles extension lifecycle events, token generation, and authentication
 */

interface ExtensionIdentity {
  extensionId: string
  extensionVersion: string
  installTime: number
  fingerprint: string
  userAgent: string
  timezone: string
}

interface TokenPayload {
  ext: string
  fp: string
  ts: number
  nonce: string
}

interface AuthState {
  auth_init_failed?: boolean
  auth_error?: string
  retry_count?: number
  backend_registered?: boolean
  registration_time?: number
  last_registration_response?: any
}

interface ExtensionLog {
  eventType: string
  timestamp: number
  extensionVersion: string
  [key: string]: any
}

// Extension lifecycle events
chrome.runtime.onInstalled.addListener(async (details: chrome.runtime.InstalledDetails) => {
  console.log('Extension installed:', details)
  
  try {
    switch (details.reason) {
      case chrome.runtime.OnInstalledReason.INSTALL:
        await handleExtensionInstall()
        break
      case chrome.runtime.OnInstalledReason.UPDATE:
        await handleExtensionUpdate(details.previousVersion)
        break
      case chrome.runtime.OnInstalledReason.CHROME_UPDATE:
        await handleChromeUpdate()
        break
    }
  } catch (error) {
    console.error('Error handling installation event:', error)
  }
})

chrome.runtime.onStartup.addListener(async () => {
  console.log('Extension startup')
  await validateAndRefreshAuth()
})

// Handle new extension installation
async function handleExtensionInstall(): Promise<void> {
  console.log('🚀 Extension installed - generating initial authentication')
  
  try {
    // Generate extension identity and token immediately
    const identity = await generateExtensionIdentity()
    const token = await generateSecureToken(identity)
    
    // Store authentication data
    await chrome.storage.local.set({
      ext_auth_token: token,
      ext_identity: identity,
      install_time: Date.now(),
      ext_version: chrome.runtime.getManifest().version
    })
    
    // Register with backend immediately
    await registerWithBackend(token, identity)
    
    // Set up periodic token refresh
    scheduleTokenRefresh()
    
    console.log('✅ Extension authentication initialized successfully')
    
    // Log installation event
    await logExtensionEvent('EXTENSION_INSTALLED', {
      extensionId: identity.extensionId,
      version: identity.extensionVersion,
      installTime: identity.installTime
    })
    
  } catch (error) {
    console.error('❌ Failed to initialize extension authentication:', error)
    // Store error state for later retry
    await chrome.storage.local.set({
      auth_init_failed: true,
      auth_error: error instanceof Error ? error.message : String(error),
      retry_count: 0
    })
  }
}

// Handle extension updates
async function handleExtensionUpdate(previousVersion?: string): Promise<void> {
  console.log(`📦 Extension updated from ${previousVersion} to ${chrome.runtime.getManifest().version}`)
  
  try {
    // Check if we need to regenerate token due to version change
    const stored = await chrome.storage.local.get(['ext_auth_token', 'ext_identity'])
    
    if (stored.ext_identity) {
      // Update version in identity
      stored.ext_identity.extensionVersion = chrome.runtime.getManifest().version
      
      // Generate new token with updated version
      const newToken = await generateSecureToken(stored.ext_identity)
      
      // Update stored data
      await chrome.storage.local.set({
        ext_auth_token: newToken,
        ext_identity: stored.ext_identity,
        last_update: Date.now(),
        previous_version: previousVersion
      })
      
      // Re-register with backend
      await registerWithBackend(newToken, stored.ext_identity)
      
      console.log('✅ Extension authentication updated for new version')
    } else {
      // No previous auth data, treat as fresh install
      await handleExtensionInstall()
    }
    
  } catch (error) {
    console.error('❌ Failed to update extension authentication:', error)
  }
}

// Handle Chrome browser updates
async function handleChromeUpdate(): Promise<void> {
  console.log('🔄 Chrome updated - validating authentication')
  await validateAndRefreshAuth()
}

// Generate unique extension identity
async function generateExtensionIdentity(): Promise<ExtensionIdentity> {
  const extensionId = chrome.runtime.id
  const extensionVersion = chrome.runtime.getManifest().version
  const installTime = Math.floor(Date.now() / 1000) // Convert to seconds for backend compatibility
  const userAgent = navigator.userAgent
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  
  // Create a unique fingerprint
  const fingerprintData = {
    extensionId,
    extensionVersion,
    installTime,
    userAgent: sanitizeUserAgent(userAgent),
    timezone
  }
  
  const fingerprint = await generateFingerprint(fingerprintData)
  
  return {
    extensionId,
    extensionVersion,
    installTime,
    fingerprint,
    userAgent: sanitizeUserAgent(userAgent),
    timezone
  }
}

// Generate cryptographic fingerprint
async function generateFingerprint(data: Record<string, any>): Promise<string> {
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

// Generate SHA256 hash of a string (for token signatures)
async function generateStringHash(data: string): Promise<string> {
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

// Generate secure authentication token
async function generateSecureToken(identity: ExtensionIdentity): Promise<string> {
  const timestamp = Math.floor(Date.now() / 1000) // Convert to seconds for backend compatibility
  const nonce = generateUUID()
  
  const payload: TokenPayload = {
    ext: identity.extensionId,
    fp: identity.fingerprint,
    ts: timestamp,
    nonce
  }
  
  const tokenData = btoa(JSON.stringify(payload))
  const signature = await generateStringHash(tokenData + identity.fingerprint)
  
  return `${tokenData}.${signature.substring(0, 32)}`
}

// Register extension with backend
async function registerWithBackend(token: string, identity: ExtensionIdentity, retryCount: number = 0): Promise<any> {
  const MAX_RETRIES = 3
  
  try {
    const response = await fetch('https://weather-service-fws6uj4tlq-uc.a.run.app/api/auth/register', {
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
    
    if (response.ok) {
      const result = await response.json()
      console.log('✅ Extension registered with backend:', result.message)
      
      await chrome.storage.local.set({
        backend_registered: true,
        registration_time: Date.now(),
        last_registration_response: result,
        registration_retry_count: 0
      })
      
      return result
    } else {
      throw new Error(`Registration failed: ${response.status}`)
    }
    
  } catch (error) {
    console.warn(`⚠️ Backend registration failed (attempt ${retryCount + 1}/${MAX_RETRIES}):`, error)
    
    // Store failure info for retry logic
    await chrome.storage.local.set({
      backend_registered: false,
      registration_failed: true,
      last_registration_error: error instanceof Error ? error.message : String(error),
      last_registration_attempt: Date.now(),
      registration_retry_count: retryCount + 1
    })
    
    // Schedule retry only if we haven't exceeded max retries
    if (retryCount < MAX_RETRIES - 1) {
      const retryDelay = Math.min(30000 * Math.pow(2, retryCount), 300000) // Exponential backoff, max 5 minutes
      console.log(`⏰ Will retry registration in ${retryDelay / 1000} seconds`)
      setTimeout(() => registerWithBackend(token, identity, retryCount + 1), retryDelay)
    } else {
      console.error('❌ Max registration retries exceeded. Extension will work in offline mode.')
    }
  }
}

// Validate and refresh authentication if needed
async function validateAndRefreshAuth(): Promise<void> {
  try {
    const stored = await chrome.storage.local.get(['ext_auth_token', 'ext_identity', 'install_time'])
    
    if (!stored.ext_auth_token || !stored.ext_identity) {
      console.log('🔄 No authentication found, initializing...')
      await handleExtensionInstall()
      return
    }
    
    // Check if token is still valid (24 hours)
    const tokenAge = Date.now() - (stored.install_time || Date.now())
    const TOKEN_MAX_AGE = 24 * 60 * 60 * 1000 // 24 hours
    
    if (tokenAge > TOKEN_MAX_AGE) {
      console.log('🔄 Token expired, refreshing...')
      const newToken = await generateSecureToken(stored.ext_identity)
      
      await chrome.storage.local.set({
        ext_auth_token: newToken,
        token_refreshed: Date.now()
      })
      
      await registerWithBackend(newToken, stored.ext_identity)
    }
    
    console.log('✅ Authentication validation complete')
    
  } catch (error) {
    console.error('❌ Authentication validation failed:', error)
  }
}

// Schedule periodic token refresh
function scheduleTokenRefresh(): void {
  // Refresh token every 20 hours (before 24-hour expiry)
  const REFRESH_INTERVAL = 20 * 60 * 60 * 1000 // 20 hours
  
  setInterval(async () => {
    console.log('⏰ Scheduled token refresh')
    await validateAndRefreshAuth()
  }, REFRESH_INTERVAL)
}

// Sanitize user agent
function sanitizeUserAgent(userAgent: string): string {
  return userAgent
    .replace(/\s+/g, ' ')
    .replace(/Chrome\/[\d.]+/, 'Chrome/xxx')
    .replace(/Safari\/[\d.]+/, 'Safari/xxx')
    .substring(0, 200)
}

// Simple UUID generator for service workers
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c == 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

// Log extension events
async function logExtensionEvent(eventType: string, data: Record<string, any>): Promise<void> {
  try {
    const logEntry: ExtensionLog = {
      eventType,
      timestamp: Date.now(),
      extensionVersion: chrome.runtime.getManifest().version,
      ...data
    }
    
    // Store in local storage for debugging
    const stored = await chrome.storage.local.get(['extension_logs'])
    const logs = stored.extension_logs || []
    logs.push(logEntry)
    
    // Keep last 100 logs
    const recentLogs = logs.slice(-100)
    
    await chrome.storage.local.set({ extension_logs: recentLogs })
    
    console.log(`📊 Extension Event: ${eventType}`, data)
    
  } catch (error) {
    console.error('Failed to log extension event:', error)
  }
}

// Handle retry logic for failed authentication
async function retryFailedAuthentication(): Promise<void> {
  try {
    const authState = await chrome.storage.local.get(['auth_init_failed', 'retry_count']) as AuthState
    
    if (authState.auth_init_failed) {
      const retryCount = (authState.retry_count || 0) + 1
      const MAX_RETRIES = 5
      
      if (retryCount <= MAX_RETRIES) {
        console.log(`🔄 Retrying authentication (attempt ${retryCount}/${MAX_RETRIES})`)
        
        await chrome.storage.local.set({ retry_count: retryCount })
        await handleExtensionInstall()
        
      } else {
        console.error('❌ Max authentication retries exceeded')
        await logExtensionEvent('AUTH_RETRY_FAILED', { retryCount })
      }
    }
  } catch (error) {
    console.error('Retry logic failed:', error)
  }
}

// Initialize on service worker startup
console.log('🔧 Chrome Extension Background Service Worker loaded')

// Set up retry mechanism for failed auth
setTimeout(retryFailedAuthentication, 5000) // Check for failed auth after 5 seconds

// Schedule periodic validation
setTimeout(() => {
  validateAndRefreshAuth()
  scheduleTokenRefresh()
}, 2000) // Start validation after 2 seconds