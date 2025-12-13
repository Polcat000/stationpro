// src/hooks/__tests__/usePanelPersistence.test.ts
// Tests for usePanelPersistence hook
// AC-3.10.3: State Persistence, AC-3.10.4: Restore on Load

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePanelPersistence } from '../usePanelPersistence'

const STORAGE_KEY = 'stationpro-analysis-panels'

describe('usePanelPersistence', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('initial state (AC-3.10.4)', () => {
    it('defaults to expanded when no localStorage data exists', () => {
      const { result } = renderHook(() => usePanelPersistence('stats'))

      expect(result.current.isExpanded).toBe(true)
    })

    it('uses provided defaultExpanded value when no localStorage data exists', () => {
      const { result } = renderHook(() => usePanelPersistence('stats', false))

      expect(result.current.isExpanded).toBe(false)
    })

    it('restores state from localStorage when data exists', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ stats: false, envelope: true }))

      const { result } = renderHook(() => usePanelPersistence('stats'))

      expect(result.current.isExpanded).toBe(false)
    })

    it('restores different panel states correctly', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ stats: false, envelope: true }))

      const { result: statsResult } = renderHook(() => usePanelPersistence('stats'))
      const { result: envelopeResult } = renderHook(() => usePanelPersistence('envelope'))

      expect(statsResult.current.isExpanded).toBe(false)
      expect(envelopeResult.current.isExpanded).toBe(true)
    })

    it('uses default when panel not in stored state', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ stats: false }))

      const { result } = renderHook(() => usePanelPersistence('envelope', true))

      expect(result.current.isExpanded).toBe(true)
    })
  })

  describe('state updates', () => {
    it('setExpanded updates isExpanded state', () => {
      const { result } = renderHook(() => usePanelPersistence('stats'))

      act(() => {
        result.current.setExpanded(false)
      })

      expect(result.current.isExpanded).toBe(false)
    })

    it('toggleExpanded toggles state', () => {
      const { result } = renderHook(() => usePanelPersistence('stats', true))

      expect(result.current.isExpanded).toBe(true)

      act(() => {
        result.current.toggleExpanded()
      })

      expect(result.current.isExpanded).toBe(false)

      act(() => {
        result.current.toggleExpanded()
      })

      expect(result.current.isExpanded).toBe(true)
    })
  })

  describe('localStorage persistence (AC-3.10.3)', () => {
    it('persists state to localStorage after debounce', async () => {
      const { result } = renderHook(() => usePanelPersistence('stats'))

      act(() => {
        result.current.setExpanded(false)
      })

      // Before debounce
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull()

      // After debounce
      act(() => {
        vi.advanceTimersByTime(100)
      })

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
      expect(stored.stats).toBe(false)
    })

    it('preserves other panel states when updating one', async () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ envelope: false, charts: true }))

      const { result } = renderHook(() => usePanelPersistence('stats'))

      act(() => {
        result.current.setExpanded(false)
        vi.advanceTimersByTime(100)
      })

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
      expect(stored.stats).toBe(false)
      expect(stored.envelope).toBe(false)
      expect(stored.charts).toBe(true)
    })

    it('debounces rapid updates', () => {
      const { result } = renderHook(() => usePanelPersistence('stats'))

      // Rapid toggles
      act(() => {
        result.current.setExpanded(false)
        result.current.setExpanded(true)
        result.current.setExpanded(false)
      })

      // Only final value should be persisted after debounce
      act(() => {
        vi.advanceTimersByTime(100)
      })

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
      expect(stored.stats).toBe(false)
    })

    it('uses correct localStorage key format', () => {
      const { result } = renderHook(() => usePanelPersistence('stats'))

      act(() => {
        result.current.setExpanded(false)
        vi.advanceTimersByTime(100)
      })

      // Key should be 'stationpro-analysis-panels'
      expect(localStorage.getItem('stationpro-analysis-panels')).toBeTruthy()
      // Format should be { [panelId]: boolean }
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
      expect(typeof stored.stats).toBe('boolean')
    })
  })

  describe('error handling (AC-3.10.4)', () => {
    it('handles invalid JSON in localStorage gracefully', () => {
      localStorage.setItem(STORAGE_KEY, 'invalid json {{{')

      const { result } = renderHook(() => usePanelPersistence('stats', true))

      // Should use default instead of crashing
      expect(result.current.isExpanded).toBe(true)
    })

    it('handles non-object JSON gracefully', () => {
      localStorage.setItem(STORAGE_KEY, '"just a string"')

      const { result } = renderHook(() => usePanelPersistence('stats', true))

      expect(result.current.isExpanded).toBe(true)
    })

    it('handles array JSON gracefully', () => {
      localStorage.setItem(STORAGE_KEY, '[1, 2, 3]')

      const { result } = renderHook(() => usePanelPersistence('stats', true))

      expect(result.current.isExpanded).toBe(true)
    })

    it('handles null JSON gracefully', () => {
      localStorage.setItem(STORAGE_KEY, 'null')

      const { result } = renderHook(() => usePanelPersistence('stats', true))

      expect(result.current.isExpanded).toBe(true)
    })

    it('filters out non-boolean values from stored state', () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          stats: false,
          envelope: 'string-value',
          charts: 123,
          zones: null,
        })
      )

      const { result: statsResult } = renderHook(() => usePanelPersistence('stats'))
      const { result: envelopeResult } = renderHook(() => usePanelPersistence('envelope', true))
      const { result: chartsResult } = renderHook(() => usePanelPersistence('charts', true))
      const { result: zonesResult } = renderHook(() => usePanelPersistence('zones', true))

      expect(statsResult.current.isExpanded).toBe(false) // Valid boolean
      expect(envelopeResult.current.isExpanded).toBe(true) // Invalid, use default
      expect(chartsResult.current.isExpanded).toBe(true) // Invalid, use default
      expect(zonesResult.current.isExpanded).toBe(true) // Invalid, use default
    })

    it('handles localStorage quota exceeded gracefully', () => {
      // Mock localStorage.setItem to throw
      const originalSetItem = localStorage.setItem
      localStorage.setItem = vi.fn(() => {
        throw new Error('QuotaExceededError')
      })

      const { result } = renderHook(() => usePanelPersistence('stats'))

      // Should not throw
      expect(() => {
        act(() => {
          result.current.setExpanded(false)
          vi.advanceTimersByTime(100)
        })
      }).not.toThrow()

      // State should still update locally
      expect(result.current.isExpanded).toBe(false)

      localStorage.setItem = originalSetItem
    })
  })

  describe('cleanup', () => {
    it('clears pending timeout on unmount', () => {
      const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout')
      const { result, unmount } = renderHook(() => usePanelPersistence('stats'))

      act(() => {
        result.current.setExpanded(false)
      })

      unmount()

      expect(clearTimeoutSpy).toHaveBeenCalled()
      clearTimeoutSpy.mockRestore()
    })
  })

  describe('multiple panels', () => {
    it('independent hooks manage separate state', () => {
      const { result: stats } = renderHook(() => usePanelPersistence('stats'))
      const { result: envelope } = renderHook(() => usePanelPersistence('envelope'))

      act(() => {
        stats.current.setExpanded(false)
      })

      expect(stats.current.isExpanded).toBe(false)
      expect(envelope.current.isExpanded).toBe(true)
    })

    it('multiple hooks for same panel share localStorage state', () => {
      const { result: hook1 } = renderHook(() => usePanelPersistence('stats'))

      act(() => {
        hook1.current.setExpanded(false)
        vi.advanceTimersByTime(100)
      })

      // New hook should read persisted state
      const { result: hook2 } = renderHook(() => usePanelPersistence('stats'))

      expect(hook2.current.isExpanded).toBe(false)
    })
  })
})
