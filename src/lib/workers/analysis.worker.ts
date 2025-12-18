// src/lib/workers/analysis.worker.ts
// Web Worker for analysis calculations
// Story 3.14 AC1, AC2, AC6: Extensible worker with type-safe message routing

// Worker files use relative imports because path aliases don't resolve in worker bundle
import type { Part } from '../../types/domain'
import type { AggregateStatistics } from '../analysis/statistics'
import { calculateAggregateStats } from '../analysis/statistics'
import type { WorkerRequest, WorkerResponse, WorkerError } from './types'

// =============================================================================
// Worker Message Types (Extensible)
// =============================================================================

/**
 * Analysis worker request types.
 * Add new calculation types here as the application evolves.
 *
 * @example Adding a new calculation type:
 * ```typescript
 * // 1. Add to AnalysisRequestPayload union:
 * | { type: 'compatibility'; parts: Part[]; components: Component[] }
 *
 * // 2. Add to AnalysisResponsePayload union:
 * | { type: 'compatibility'; result: CompatibilityResult }
 *
 * // 3. Add handler in handleMessage switch:
 * case 'compatibility':
 *   return { type: 'compatibility', result: calculateCompatibility(payload.parts, payload.components) }
 * ```
 */
export type AnalysisRequestPayload =
  | { type: 'stats'; parts: Part[] }
// Future calculation types (uncomment when implemented):
// | { type: 'compatibility'; parts: Part[]; components: Component[] }
// | { type: 'tolerance-stackup'; parts: Part[]; tolerances: ToleranceConfig }
// | { type: 'monte-carlo'; parts: Part[]; iterations: number }

export type AnalysisResponsePayload =
  | { type: 'stats'; result: AggregateStatistics }
// Future response types:
// | { type: 'compatibility'; result: CompatibilityResult }
// | { type: 'tolerance-stackup'; result: ToleranceStackupResult }
// | { type: 'monte-carlo'; result: MonteCarloResult }

// =============================================================================
// Message Handler
// =============================================================================

/**
 * Handles incoming analysis requests by routing to appropriate calculation.
 * Designed for easy extension with new calculation types.
 */
function handleMessage(payload: AnalysisRequestPayload): AnalysisResponsePayload {
  switch (payload.type) {
    case 'stats':
      return {
        type: 'stats',
        result: calculateAggregateStats(payload.parts),
      }

    // Future handlers - add new cases here:
    // case 'compatibility':
    //   return { type: 'compatibility', result: calculateCompatibility(payload.parts, payload.components) }

    default: {
      // TypeScript exhaustiveness check - cast to access type for error message
      const unknownPayload = payload as { type: string }
      throw new Error(`Unknown calculation type: ${unknownPayload.type}`)
    }
  }
}

// =============================================================================
// Worker Entry Point
// =============================================================================

/**
 * Worker message listener.
 * Receives WorkerRequest, processes it, and sends WorkerResponse.
 */
self.onmessage = (event: MessageEvent<WorkerRequest<AnalysisRequestPayload>>) => {
  const request = event.data

  try {
    const responsePayload = handleMessage(request.payload)

    const response: WorkerResponse<AnalysisResponsePayload> = {
      id: request.id,
      type: responsePayload.type,
      result: responsePayload,
    }

    self.postMessage(response)
  } catch (error) {
    const workerError: WorkerError = {
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : 'WorkerError',
      stack: error instanceof Error ? error.stack : undefined,
    }

    const errorResponse: WorkerResponse<AnalysisResponsePayload> = {
      id: request.id,
      type: 'error',
      error: workerError,
    }

    self.postMessage(errorResponse)
  }
}

// =============================================================================
// Documentation: Adding New Calculation Types
// =============================================================================

/**
 * ## Adding New Worker Calculations
 *
 * This worker is designed for easy extension. To add a new calculation type:
 *
 * ### Step 1: Define Message Types
 * Add new types to AnalysisRequestPayload and AnalysisResponsePayload unions above.
 *
 * ### Step 2: Import Pure Calculation Function
 * ```typescript
 * import { calculateNewThing } from '@/lib/analysis/newThing'
 * ```
 *
 * ### Step 3: Add Message Handler Case
 * Add a case in the handleMessage switch statement:
 * ```typescript
 * case 'new-thing':
 *   return { type: 'new-thing', result: calculateNewThing(payload.data) }
 * ```
 *
 * ### Step 4: Use in Hook
 * Use useWorkerCalculation hook with the new type:
 * ```typescript
 * const { result, isCalculating } = useWorkerCalculation({
 *   type: 'new-thing',
 *   input: { type: 'new-thing', data: myData },
 *   syncFallback: (input) => calculateNewThing(input.data),
 * })
 * ```
 *
 * ### Requirements for Worker-Compatible Calculations:
 * - Pure functions (no side effects)
 * - Serializable inputs (no functions, no circular references)
 * - Serializable outputs (plain objects, arrays, primitives)
 * - No DOM access
 * - No React state or hooks
 */
