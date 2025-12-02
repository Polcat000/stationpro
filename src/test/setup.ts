// src/test/setup.ts
// PURPOSE: Global test setup - runs before each test file
// SOURCE: architecture.md "Testing Framework" section

// Import jest-dom matchers for DOM assertions
// This adds matchers like: toBeInTheDocument(), toHaveTextContent(), etc.
import '@testing-library/jest-dom'

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
