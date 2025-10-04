// Chrome storage API wrapper with fallback for development

const isDevelopment = !window.chrome || !window.chrome.storage

// Mock storage for development
const mockStorage = {
  sync: {
    get: (keys, callback) => {
      const result = {}
      keys.forEach(key => {
        const stored = localStorage.getItem(key)
        if (stored) {
          result[key] = JSON.parse(stored)
        }
      })
      callback(result)
    },
    set: (items, callback) => {
      Object.entries(items).forEach(([key, value]) => {
        localStorage.setItem(key, JSON.stringify(value))
      })
      if (callback) callback()
    }
  }
}

export const storage = isDevelopment ? mockStorage : chrome.storage