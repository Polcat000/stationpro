// src/test/setup.ts
// PURPOSE: Global test setup - runs before each test file
// SOURCE: architecture.md "Testing Framework" section

// Import fake-indexeddb for IndexedDB storage tests (Story 3.13)
import 'fake-indexeddb/auto'

// Import jest-dom matchers for DOM assertions
// This adds matchers like: toBeInTheDocument(), toHaveTextContent(), etc.
import '@testing-library/jest-dom'

// Mock navigator.clipboard for jsdom (not available by default)
// Using plain functions - tests can spy on these if they need to assert calls
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: () => Promise.resolve(),
    readText: () => Promise.resolve(''),
  },
  configurable: true,
})

// Mock pointer capture methods for radix-ui Select components in jsdom
// These methods don't exist in jsdom but are used by radix-ui
if (typeof Element.prototype.hasPointerCapture !== 'function') {
  Element.prototype.hasPointerCapture = () => false
}
if (typeof Element.prototype.setPointerCapture !== 'function') {
  Element.prototype.setPointerCapture = () => {}
}
if (typeof Element.prototype.releasePointerCapture !== 'function') {
  Element.prototype.releasePointerCapture = () => {}
}

// Mock scrollIntoView for radix-ui Select components
if (typeof Element.prototype.scrollIntoView !== 'function') {
  Element.prototype.scrollIntoView = () => {}
}

// Mock getBoundingClientRect for @tanstack/react-virtual (Story 3.12)
// Virtualizer needs actual dimensions; jsdom returns all zeros by default
// This mock provides a reasonable viewport for virtualization tests
const originalGetBoundingClientRect = Element.prototype.getBoundingClientRect
Element.prototype.getBoundingClientRect = function () {
  // Check if this is a virtualized table container
  if (this.getAttribute('data-testid')?.includes('data-grid') ||
      this.getAttribute('data-slot') === 'virtualized-table-container') {
    return {
      width: 1000,
      height: 600, // Enough to show ~15 rows at 41px each
      top: 0,
      left: 0,
      bottom: 600,
      right: 1000,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }
  }
  return originalGetBoundingClientRect.call(this)
}

// Mock ResizeObserver for @tanstack/react-virtual
// jsdom doesn't implement ResizeObserver; virtualizer uses it for dynamic sizing
class MockResizeObserver {
  callback: ResizeObserverCallback
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback
  }
  observe(target: Element) {
    // Immediately call with mock entry for virtualized containers
    if (target.getAttribute('data-testid')?.includes('data-grid') ||
        target.getAttribute('data-slot') === 'virtualized-table-container') {
      this.callback([{
        target,
        contentRect: { width: 1000, height: 600, top: 0, left: 0, bottom: 600, right: 1000, x: 0, y: 0, toJSON: () => ({}) } as DOMRectReadOnly,
        borderBoxSize: [{ blockSize: 600, inlineSize: 1000 }],
        contentBoxSize: [{ blockSize: 600, inlineSize: 1000 }],
        devicePixelContentBoxSize: [{ blockSize: 600, inlineSize: 1000 }],
      }], this)
    }
  }
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver

// Silence console.error and console.warn in tests unless explicitly testing them
// This keeps test output clean while still allowing console.log for debugging
const originalError = console.error
const originalWarn = console.warn

beforeAll(() => {
  console.error = (...args: unknown[]) => {
    // Allow React's act() warnings through for debugging
    if (typeof args[0] === 'string' && args[0].includes('act(')) {
      originalError(...args)
    }
  }
  console.warn = () => {} // Silence all warnings
})

afterAll(() => {
  console.error = originalError
  console.warn = originalWarn
})
