// src/hooks/useWorkerCalculation.ts
// Generic hook for running calculations in Web Worker with threshold-based routing
// Story 3.14 AC1, AC3, AC4, AC6: Worker calculation hook with loading state

import { useState, useEffect, useRef, useCallback } from 'react'
import { canUseWorkers, warnWorkerFallback } from '@/lib/workers'
import type { AnalysisRequestPayload, AnalysisResponsePayload } from '@/lib/workers/analysis.worker'
import type { WorkerRequest, WorkerResponse } from '@/lib/workers/types'

// =============================================================================
// Types
// =============================================================================

/**
 * Options for the useWorkerCalculation hook.
 */
export interface UseWorkerCalculationOptions<TInput, TResult> {
  /** The input data for the calculation */
  input: TInput | null
  /** Function to get the size of the input for threshold comparison */
  getInputSize: (input: TInput) => number
  /** Threshold above which to use worker (default: 500) */
  threshold?: number
  /** Synchronous fallback function for small datasets or when workers unavailable */
  syncFallback: (input: TInput) => TResult
  /** Transform input to worker payload */
  toWorkerPayload: (input: TInput) => AnalysisRequestPayload
  /** Extract result from worker response */
  fromWorkerResponse: (response: AnalysisResponsePayload) => TResult
  /** Debounce delay in ms (default: 100) */
  debounceMs?: number
  /** Whether the calculation is enabled (default: true) */
  enabled?: boolean
}

/**
 * Result of the useWorkerCalculation hook.
 */
export interface UseWorkerCalculationResult<TResult> {
  result: TResult | null
  isCalculating: boolean
  error: Error | null
}

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_THRESHOLD = 500
const DEFAULT_DEBOUNCE_MS = 100

// =============================================================================
// Worker Singleton
// =============================================================================

// Singleton worker instance - created lazily
let analysisWorker: Worker | null = null
let workerRequestId = 0
const pendingRequests = new Map<
  string,
  {
    resolve: (value: AnalysisResponsePayload) => void
    reject: (reason: Error) => void
  }
>()

/**
 * Gets or creates the singleton analysis worker.
 */
function getAnalysisWorker(): Worker | null {
  if (!canUseWorkers()) {
    return null
  }

  if (!analysisWorker) {
    try {
      // Vite's ?worker import pattern creates a worker constructor
      // Use relative path from hooks/ to lib/workers/
      analysisWorker = new Worker(
        new URL('../lib/workers/analysis.worker.ts', import.meta.url),
        { type: 'module' }
      )

      // Set up message handler
      analysisWorker.onmessage = (event: MessageEvent<WorkerResponse<AnalysisResponsePayload>>) => {
        const response = event.data
        const pending = pendingRequests.get(response.id)

        if (pending) {
          pendingRequests.delete(response.id)

          if (response.error) {
            const error = new Error(response.error.message)
            error.name = response.error.name ?? 'WorkerError'
            pending.reject(error)
          } else if (response.result) {
            pending.resolve(response.result)
          }
        }
      }

      // Set up error handler
      analysisWorker.onerror = (event: ErrorEvent) => {
        console.error('[useWorkerCalculation] Worker error:', event.message)
        // Reject all pending requests
        const error = new Error(event.message || 'Worker error')
        for (const [id, pending] of pendingRequests) {
          pending.reject(error)
          pendingRequests.delete(id)
        }
      }
    } catch (err) {
      console.error('[useWorkerCalculation] Failed to create worker:', err)
      return null
    }
  }

  return analysisWorker
}

/**
 * Sends a request to the analysis worker.
 */
function sendToWorker(payload: AnalysisRequestPayload): Promise<AnalysisResponsePayload> {
  return new Promise((resolve, reject) => {
    const worker = getAnalysisWorker()
    if (!worker) {
      reject(new Error('Worker not available'))
      return
    }

    const id = `req-${++workerRequestId}-${Date.now()}`

    pendingRequests.set(id, { resolve, reject })

    const request: WorkerRequest<AnalysisRequestPayload> = {
      id,
      type: 'request',
      payload,
    }

    try {
      worker.postMessage(request)
    } catch (err) {
      pendingRequests.delete(id)
      reject(err instanceof Error ? err : new Error(String(err)))
    }
  })
}

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * Hook for running calculations in a Web Worker with threshold-based routing.
 *
 * Features:
 * - Threshold-based routing: small datasets use sync, large datasets use worker
 * - Debounce to prevent worker thrashing on rapid input changes
 * - Graceful fallback when workers unavailable (AC5)
 * - Loading state for UI feedback (AC3)
 * - Integrates with TanStack Query cache invalidation patterns (AC4)
 *
 * @example
 * ```typescript
 * const { result, isCalculating, error } = useWorkerCalculation({
 *   input: selectedParts,
 *   getInputSize: (parts) => parts.length,
 *   threshold: 500,
 *   syncFallback: calculateAggregateStats,
 *   toWorkerPayload: (parts) => ({ type: 'stats', parts }),
 *   fromWorkerResponse: (response) => response.type === 'stats' ? response.result : null,
 * })
 * ```
 */
export function useWorkerCalculation<TInput, TResult>(
  options: UseWorkerCalculationOptions<TInput, TResult>
): UseWorkerCalculationResult<TResult> {
  const {
    input,
    getInputSize,
    threshold = DEFAULT_THRESHOLD,
    syncFallback,
    toWorkerPayload,
    fromWorkerResponse,
    debounceMs = DEFAULT_DEBOUNCE_MS,
    enabled = true,
  } = options

  const [result, setResult] = useState<TResult | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Track the latest input to handle race conditions
  const latestInputRef = useRef<TInput | null>(null)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isMountedRef = useRef(true)

  // Store callback functions in refs to avoid infinite re-render loops.
  // These callbacks may be inline arrow functions that create new references
  // on every render. By storing them in refs, we prevent them from triggering
  // the useEffect/useCallback dependency chains.
  const getInputSizeRef = useRef(getInputSize)
  const syncFallbackRef = useRef(syncFallback)
  const toWorkerPayloadRef = useRef(toWorkerPayload)
  const fromWorkerResponseRef = useRef(fromWorkerResponse)

  // Update refs when callbacks change (keeps them current without triggering effects)
  useEffect(() => {
    getInputSizeRef.current = getInputSize
    syncFallbackRef.current = syncFallback
    toWorkerPayloadRef.current = toWorkerPayload
    fromWorkerResponseRef.current = fromWorkerResponse
  })

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  // Memoized calculation runner
  // Uses refs for callback functions to prevent infinite re-render loops
  const runCalculation = useCallback(
    async (currentInput: TInput) => {
      if (!isMountedRef.current) return

      const inputSize = getInputSizeRef.current(currentInput)
      const shouldUseWorker = canUseWorkers() && inputSize >= threshold

      try {
        let calculatedResult: TResult

        if (shouldUseWorker) {
          // Use worker for large datasets
          setIsCalculating(true)
          const workerPayload = toWorkerPayloadRef.current(currentInput)
          const workerResponse = await sendToWorker(workerPayload)
          calculatedResult = fromWorkerResponseRef.current(workerResponse)
        } else {
          // Use sync fallback for small datasets or when workers unavailable
          if (!canUseWorkers() && inputSize >= threshold) {
            warnWorkerFallback('Web Workers not available')
          }
          calculatedResult = syncFallbackRef.current(currentInput)
        }

        // Only update if this is still the latest request and component is mounted
        if (isMountedRef.current && currentInput === latestInputRef.current) {
          setResult(calculatedResult)
          setError(null)
        }
      } catch (err) {
        // Only update error if this is still the latest request and component is mounted
        if (isMountedRef.current && currentInput === latestInputRef.current) {
          console.error('[useWorkerCalculation] Calculation error, falling back to sync:', err)

          // Try sync fallback on worker error
          try {
            const fallbackResult = syncFallbackRef.current(currentInput)
            setResult(fallbackResult)
            setError(null)
          } catch (fallbackErr) {
            setError(fallbackErr instanceof Error ? fallbackErr : new Error(String(fallbackErr)))
            setResult(null)
          }
        }
      } finally {
        if (isMountedRef.current && currentInput === latestInputRef.current) {
          setIsCalculating(false)
        }
      }
    },
    [threshold]
  )

  // Effect to trigger calculation on input change
  useEffect(() => {
    // Clear any pending debounce
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }

    // Handle null/disabled cases
    if (!enabled || input === null) {
      setResult(null)
      setIsCalculating(false)
      setError(null)
      latestInputRef.current = null
      return
    }

    // Store latest input for race condition handling
    latestInputRef.current = input

    // Debounce the calculation to avoid worker thrashing
    debounceTimerRef.current = setTimeout(() => {
      runCalculation(input)
    }, debounceMs)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [input, enabled, debounceMs, runCalculation])

  return { result, isCalculating, error }
}

// =============================================================================
// Cleanup Utility
// =============================================================================

/**
 * Terminates the singleton worker (useful for testing or app shutdown).
 */
export function terminateAnalysisWorker(): void {
  if (analysisWorker) {
    // Reject all pending requests
    const error = new Error('Worker terminated')
    for (const [id, pending] of pendingRequests) {
      pending.reject(error)
      pendingRequests.delete(id)
    }

    analysisWorker.terminate()
    analysisWorker = null
  }
}

/**
 * Resets the worker state (useful for testing).
 */
export function resetWorkerState(): void {
  terminateAnalysisWorker()
  workerRequestId = 0
}

// =============================================================================
// Integration Pattern Documentation
// =============================================================================

/**
 * ## Worker Integration Pattern (Story 3.14 AC6)
 *
 * This hook provides a reusable pattern for offloading heavy calculations
 * to Web Workers while maintaining UI responsiveness.
 *
 * ### When to Use Workers
 *
 * Use workers when calculations:
 * 1. Process significant data volume (100+ parts with complex operations)
 * 2. Take >16ms (one frame budget) to complete
 * 3. Are pure functions with serializable inputs/outputs
 * 4. Don't require DOM access or React state
 *
 * ### Integration Steps
 *
 * 1. **Add calculation type to analysis.worker.ts:**
 *    ```typescript
 *    // In AnalysisRequestPayload union:
 *    | { type: 'your-calc'; data: YourInput }
 *
 *    // In AnalysisResponsePayload union:
 *    | { type: 'your-calc'; result: YourResult }
 *
 *    // In handleMessage switch:
 *    case 'your-calc':
 *      return { type: 'your-calc', result: calculateYourThing(payload.data) }
 *    ```
 *
 * 2. **Create your hook using useWorkerCalculation:**
 *    ```typescript
 *    import { useWorkerCalculation } from './useWorkerCalculation'
 *    import { calculateYourThing } from '@/lib/analysis/yourThing'
 *
 *    export function useYourCalculation(input: YourInput | null) {
 *      return useWorkerCalculation<YourInput, YourResult>({
 *        input,
 *        getInputSize: (data) => data.items.length,
 *        threshold: 500,  // Customize based on calculation complexity
 *        syncFallback: calculateYourThing,
 *        toWorkerPayload: (data) => ({ type: 'your-calc', data }),
 *        fromWorkerResponse: (response) => {
 *          if (response.type === 'your-calc') return response.result
 *          throw new Error('Unexpected response type')
 *        },
 *        debounceMs: 100,
 *      })
 *    }
 *    ```
 *
 * 3. **Update component for isCalculating state:**
 *    ```typescript
 *    function YourComponent() {
 *      const { result, isCalculating, error } = useYourCalculation(input)
 *
 *      return (
 *        <div className="relative">
 *          {isCalculating && <LoadingOverlay />}
 *          {result && <ResultDisplay data={result} />}
 *        </div>
 *      )
 *    }
 *    ```
 *
 * ### Key Considerations
 *
 * - **Threshold**: Set based on calculation complexity. Start with 500, adjust based on profiling.
 * - **Debounce**: Prevents worker thrashing. 100ms is a good default.
 * - **Error handling**: Hook falls back to sync on worker errors.
 * - **TanStack Query**: Works seamlessly - cache invalidation triggers hook re-run.
 * - **SSR/Fallback**: Automatically uses sync when workers unavailable.
 *
 * ### Example: useAggregateStats Integration
 *
 * See `src/hooks/useAggregateStats.ts` for a complete integration example
 * demonstrating the POC pattern for Story 3.14.
 */
