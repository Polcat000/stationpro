// src/hooks/__tests__/useWorkerCalculation.test.ts
// Unit tests for useWorkerCalculation hook
// Story 3.14 AC1, AC3, AC4, AC5, AC6: Worker calculation hook tests

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import {
  useWorkerCalculation,
  terminateAnalysisWorker,
  resetWorkerState,
} from '../useWorkerCalculation'
import type { AnalysisRequestPayload, AnalysisResponsePayload } from '@/lib/workers/analysis.worker'
import * as canUseWorkersModule from '@/lib/workers/canUseWorkers'

// =============================================================================
// Test Types
// =============================================================================

type TestInput = { values: number[] }
type TestResult = { sum: number }

// =============================================================================
// Mock Worker
// =============================================================================

class MockWorker {
  onmessage: ((event: MessageEvent) => void) | null = null
  onerror: ((event: ErrorEvent) => void) | null = null
  private delay: number
  private shouldFail: boolean

  constructor(url: URL | string, options?: WorkerOptions) {
    // Store URL for potential validation (not used in mock)
    void url
    void options
    this.delay = 10
    this.shouldFail = false
  }

  postMessage(message: { id: string; payload: AnalysisRequestPayload }): void {
    setTimeout(() => {
      if (this.shouldFail) {
        if (this.onerror) {
          this.onerror(new ErrorEvent('error', { message: 'Worker failed' }))
        }
        return
      }

      if (this.onmessage) {
        // Mock stats calculation response
        const payload = message.payload
        if (payload.type === 'stats') {
          const response = {
            id: message.id,
            type: 'stats',
            result: {
              type: 'stats',
              result: {
                width: { count: payload.parts.length, min: 0, max: 100, mean: 50, median: 50, stdDev: 25 },
                height: { count: payload.parts.length, min: 0, max: 100, mean: 50, median: 50, stdDev: 25 },
                length: { count: payload.parts.length, min: 0, max: 100, mean: 50, median: 50, stdDev: 25 },
                smallestFeature: { count: payload.parts.length, min: 0, max: 100, mean: 50, median: 50, stdDev: 25 },
              },
            },
          }
          this.onmessage(new MessageEvent('message', { data: response }))
        }
      }
    }, this.delay)
  }

  terminate(): void {
    // Mock terminate
  }

  // Test helpers
  setDelay(ms: number): void {
    this.delay = ms
  }

  setShouldFail(fail: boolean): void {
    this.shouldFail = fail
  }
}

// =============================================================================
// Test Setup
// =============================================================================

// Store original Worker
const OriginalWorker = globalThis.Worker

beforeEach(() => {
  // Reset worker state before each test
  resetWorkerState()

  // Mock Worker constructor
  globalThis.Worker = MockWorker as unknown as typeof Worker

  // Mock canUseWorkers to return true by default
  vi.spyOn(canUseWorkersModule, 'canUseWorkers').mockReturnValue(true)
  vi.spyOn(canUseWorkersModule, 'warnWorkerFallback').mockImplementation(() => {})
})

afterEach(() => {
  // Restore original Worker
  globalThis.Worker = OriginalWorker
  vi.restoreAllMocks()
  terminateAnalysisWorker()
})

// =============================================================================
// Helper Functions
// =============================================================================

function createTestOptions(overrides: Partial<Parameters<typeof useWorkerCalculation<TestInput, TestResult>>[0]> = {}) {
  return {
    input: { values: [1, 2, 3] } as TestInput | null,
    getInputSize: (input: TestInput) => input.values.length,
    threshold: 5,
    syncFallback: (input: TestInput) => ({ sum: input.values.reduce((a, b) => a + b, 0) }),
    toWorkerPayload: (input: TestInput): AnalysisRequestPayload => {
      void input
      return { type: 'stats', parts: [] }
    },
    fromWorkerResponse: (response: AnalysisResponsePayload): TestResult => {
      void response
      return { sum: 100 }
    },
    debounceMs: 10,
    ...overrides,
  }
}

// =============================================================================
// Tests
// =============================================================================

describe('useWorkerCalculation', () => {
  describe('threshold-based routing (AC1, AC3)', () => {
    it('uses sync fallback when input size is below threshold', async () => {
      const syncFallback = vi.fn((input: TestInput) => ({
        sum: input.values.reduce((a, b) => a + b, 0),
      }))

      const { result } = renderHook(() =>
        useWorkerCalculation(
          createTestOptions({
            input: { values: [1, 2, 3] }, // Size 3, below threshold of 5
            threshold: 5,
            syncFallback,
          })
        )
      )

      await waitFor(() => {
        expect(result.current.result).toEqual({ sum: 6 })
      })

      expect(syncFallback).toHaveBeenCalled()
    })

    it('uses worker when input size is at or above threshold', async () => {
      const syncFallback = vi.fn()

      const { result } = renderHook(() =>
        useWorkerCalculation(
          createTestOptions({
            input: { values: [1, 2, 3, 4, 5, 6] }, // Size 6, above threshold of 5
            threshold: 5,
            syncFallback,
            fromWorkerResponse: () => ({ sum: 100 }), // Worker returns 100
          })
        )
      )

      await waitFor(() => {
        expect(result.current.result).toEqual({ sum: 100 })
      })

      // Sync fallback should NOT be called when worker succeeds
      expect(syncFallback).not.toHaveBeenCalled()
    })

    it('shows isCalculating while worker is processing', async () => {
      const { result } = renderHook(() =>
        useWorkerCalculation(
          createTestOptions({
            input: { values: [1, 2, 3, 4, 5, 6] }, // Above threshold
            threshold: 5,
            debounceMs: 0, // No debounce for this test
          })
        )
      )

      // Initially should be calculating (after debounce)
      await waitFor(() => {
        expect(result.current.isCalculating).toBe(true)
      })

      // Eventually should complete
      await waitFor(() => {
        expect(result.current.isCalculating).toBe(false)
        expect(result.current.result).not.toBeNull()
      })
    })
  })

  describe('debounce behavior (AC3, AC4)', () => {
    it('debounces rapid input changes', async () => {
      const syncFallback = vi.fn((input: TestInput) => ({
        sum: input.values.reduce((a, b) => a + b, 0),
      }))

      const { result, rerender } = renderHook(
        ({ input }) =>
          useWorkerCalculation(
            createTestOptions({
              input,
              threshold: 100, // Force sync for this test
              syncFallback,
              debounceMs: 50,
            })
          ),
        { initialProps: { input: { values: [1] } as TestInput | null } }
      )

      // Rapid updates
      rerender({ input: { values: [1, 2] } })
      rerender({ input: { values: [1, 2, 3] } })
      rerender({ input: { values: [1, 2, 3, 4] } })

      // Wait for debounce to settle
      await waitFor(
        () => {
          expect(result.current.result).toEqual({ sum: 10 }) // 1+2+3+4
        },
        { timeout: 200 }
      )

      // Sync fallback should only be called once or twice (not 4 times)
      expect(syncFallback.mock.calls.length).toBeLessThanOrEqual(2)
    })
  })

  describe('fallback behavior (AC5)', () => {
    it('falls back to sync when workers unavailable', async () => {
      vi.spyOn(canUseWorkersModule, 'canUseWorkers').mockReturnValue(false)
      const warnSpy = vi.spyOn(canUseWorkersModule, 'warnWorkerFallback')

      const syncFallback = vi.fn((input: TestInput) => ({
        sum: input.values.reduce((a, b) => a + b, 0),
      }))

      const { result } = renderHook(() =>
        useWorkerCalculation(
          createTestOptions({
            input: { values: [1, 2, 3, 4, 5, 6] }, // Above threshold, but workers unavailable
            threshold: 5,
            syncFallback,
          })
        )
      )

      await waitFor(() => {
        expect(result.current.result).toEqual({ sum: 21 })
      })

      expect(syncFallback).toHaveBeenCalled()
      expect(warnSpy).toHaveBeenCalled()
    })

    it('falls back to sync on worker error', async () => {
      // Create a worker that will fail when postMessage is called
      globalThis.Worker = class FailingWorker {
        onmessage: ((event: MessageEvent) => void) | null = null
        onerror: ((event: ErrorEvent) => void) | null = null

        constructor(url: URL | string, options?: WorkerOptions) {
          // Worker created successfully, but will fail on postMessage
          void url
          void options
        }

        postMessage(message: unknown): void {
          void message
          // Simulate error when trying to process message
          setTimeout(() => {
            if (this.onerror) {
              this.onerror(new ErrorEvent('error', { message: 'Worker crashed' }))
            }
          }, 10)
        }

        terminate(): void {}
      } as unknown as typeof Worker

      const syncFallback = vi.fn((input: TestInput) => ({
        sum: input.values.reduce((a, b) => a + b, 0),
      }))

      const { result } = renderHook(() =>
        useWorkerCalculation(
          createTestOptions({
            input: { values: [1, 2, 3, 4, 5, 6] },
            threshold: 5,
            syncFallback,
            debounceMs: 5, // Short debounce for faster test
          })
        )
      )

      // Should eventually fall back to sync after worker error
      await waitFor(
        () => {
          expect(result.current.result).toEqual({ sum: 21 })
        },
        { timeout: 1000 }
      )

      // Verify sync fallback was called
      expect(syncFallback).toHaveBeenCalled()
    })
  })

  describe('null/disabled handling', () => {
    it('returns null result when input is null', () => {
      const { result } = renderHook(() =>
        useWorkerCalculation(
          createTestOptions({
            input: null,
          })
        )
      )

      expect(result.current.result).toBeNull()
      expect(result.current.isCalculating).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('returns null result when disabled', () => {
      const { result } = renderHook(() =>
        useWorkerCalculation(
          createTestOptions({
            input: { values: [1, 2, 3] },
            enabled: false,
          })
        )
      )

      expect(result.current.result).toBeNull()
      expect(result.current.isCalculating).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('clears result when input becomes null', async () => {
      const { result, rerender } = renderHook(
        ({ input }) =>
          useWorkerCalculation(
            createTestOptions({
              input,
              threshold: 100, // Force sync
            })
          ),
        { initialProps: { input: { values: [1, 2, 3] } as TestInput | null } }
      )

      await waitFor(() => {
        expect(result.current.result).toEqual({ sum: 6 })
      })

      rerender({ input: null })

      expect(result.current.result).toBeNull()
      expect(result.current.isCalculating).toBe(false)
    })
  })

  describe('input change handling', () => {
    it('updates result when input changes', async () => {
      const { result, rerender } = renderHook(
        ({ input }) =>
          useWorkerCalculation(
            createTestOptions({
              input,
              threshold: 100, // Force sync
              debounceMs: 5,
            })
          ),
        { initialProps: { input: { values: [1, 2, 3] } as TestInput | null } }
      )

      await waitFor(() => {
        expect(result.current.result).toEqual({ sum: 6 })
      })

      rerender({ input: { values: [10, 20, 30] } })

      await waitFor(() => {
        expect(result.current.result).toEqual({ sum: 60 })
      })
    })
  })

  describe('error handling', () => {
    it('sets error state when sync fallback throws', async () => {
      const syncFallback = vi.fn(() => {
        throw new Error('Sync calculation failed')
      })

      const { result } = renderHook(() =>
        useWorkerCalculation(
          createTestOptions({
            input: { values: [1, 2, 3] },
            threshold: 100, // Force sync
            syncFallback,
          })
        )
      )

      await waitFor(() => {
        expect(result.current.error).not.toBeNull()
        expect(result.current.error?.message).toContain('Sync calculation failed')
      })

      expect(result.current.result).toBeNull()
    })
  })
})

describe('terminateAnalysisWorker', () => {
  it('can be called multiple times safely', () => {
    expect(() => {
      terminateAnalysisWorker()
      terminateAnalysisWorker()
      terminateAnalysisWorker()
    }).not.toThrow()
  })
})

describe('resetWorkerState', () => {
  it('resets worker and request counter', () => {
    expect(() => {
      resetWorkerState()
    }).not.toThrow()
  })
})
