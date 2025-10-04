import '@testing-library/jest-dom'

// Mock Chrome API for testing
global.chrome = {
  storage: {
    sync: {
      get: vi.fn((keys, callback) => {
        if (callback) callback({})
        return Promise.resolve({})
      }),
      set: vi.fn((items, callback) => {
        if (callback) callback()
        return Promise.resolve()
      }),
      remove: vi.fn((keys, callback) => {
        if (callback) callback()
        return Promise.resolve()
      })
    },
    local: {
      get: vi.fn((keys, callback) => {
        if (callback) callback({})
        return Promise.resolve({})
      }),
      set: vi.fn((items, callback) => {
        if (callback) callback()
        return Promise.resolve()
      })
    }
  },
  runtime: {
    id: 'test-extension-id'
  }
}

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})