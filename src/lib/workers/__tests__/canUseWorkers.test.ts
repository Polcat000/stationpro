// src/lib/workers/__tests__/canUseWorkers.test.ts
// Unit tests for Web Worker feature detection
// Story 3.14 AC5: Fallback Behavior

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { canUseWorkers, warnWorkerFallback, resetFallbackWarning } from '../canUseWorkers'

describe('canUseWorkers', () => {
  // Store original values
  let originalWorker: typeof globalThis.Worker | undefined
  let originalURL: typeof globalThis.URL | undefined
  let originalBlob: typeof globalThis.Blob | undefined
  let originalWindow: typeof globalThis.window | undefined

  beforeEach(() => {
    originalWorker = globalThis.Worker
    originalURL = globalThis.URL
    originalBlob = globalThis.Blob
    originalWindow = globalThis.window
  })

  afterEach(() => {
    // Restore globals
    if (originalWorker !== undefined) {
      globalThis.Worker = originalWorker
    }
    if (originalURL !== undefined) {
      globalThis.URL = originalURL
    }
    if (originalBlob !== undefined) {
      globalThis.Blob = originalBlob
    }
    if (originalWindow !== undefined) {
      // Restoring window
      Object.defineProperty(globalThis, 'window', { value: originalWindow, writable: true })
    }
  })

  it('returns true when all required APIs are available', () => {
    // Mock Worker to exist (jsdom doesn't have it)
    if (typeof globalThis.Worker === 'undefined') {
      // @ts-expect-error - Mocking Worker
      globalThis.Worker = class MockWorker {}
    }
    expect(canUseWorkers()).toBe(true)
  })

  it('returns false when window is undefined (SSR)', () => {
    // Testing SSR scenario - set window to undefined instead of deleting
    Object.defineProperty(globalThis, 'window', { value: undefined, writable: true, configurable: true })
    expect(canUseWorkers()).toBe(false)
  })

  it('returns false when Worker is undefined', () => {
    // @ts-expect-error - Testing old browser scenario
    delete globalThis.Worker
    expect(canUseWorkers()).toBe(false)
  })

  it('returns false when URL is undefined', () => {
    // @ts-expect-error - Testing old browser scenario
    delete globalThis.URL
    expect(canUseWorkers()).toBe(false)
  })

  it('returns false when URL.createObjectURL is undefined', () => {
    // Create a mock URL without createObjectURL
    const mockURL = function(input: string) { return new URL(input) } as unknown as typeof URL
    mockURL.prototype = URL.prototype
    mockURL.canParse = URL.canParse
    mockURL.parse = URL.parse
    mockURL.revokeObjectURL = URL.revokeObjectURL
    // Intentionally omit createObjectURL
    globalThis.URL = mockURL as typeof URL
    expect(canUseWorkers()).toBe(false)
  })

  it('returns false when Blob is undefined', () => {
    // @ts-expect-error - Testing old browser scenario
    delete globalThis.Blob
    expect(canUseWorkers()).toBe(false)
  })
})

describe('warnWorkerFallback', () => {
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    resetFallbackWarning()
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleWarnSpy.mockRestore()
    resetFallbackWarning()
  })

  it('logs warning on first call', () => {
    warnWorkerFallback('test reason')
    expect(consoleWarnSpy).toHaveBeenCalledTimes(1)
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('test reason')
    )
  })

  it('logs warning only once per session', () => {
    warnWorkerFallback('first reason')
    warnWorkerFallback('second reason')
    warnWorkerFallback('third reason')
    expect(consoleWarnSpy).toHaveBeenCalledTimes(1)
  })

  it('includes helpful message about UI lag', () => {
    warnWorkerFallback('test')
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('UI lag')
    )
  })
})

describe('resetFallbackWarning', () => {
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    resetFallbackWarning()
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleWarnSpy.mockRestore()
    resetFallbackWarning()
  })

  it('allows warning to be shown again after reset', () => {
    warnWorkerFallback('first')
    expect(consoleWarnSpy).toHaveBeenCalledTimes(1)

    resetFallbackWarning()

    warnWorkerFallback('second')
    expect(consoleWarnSpy).toHaveBeenCalledTimes(2)
  })
})
