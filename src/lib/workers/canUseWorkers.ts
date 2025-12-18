// src/lib/workers/canUseWorkers.ts
// Feature detection for Web Worker support
// Story 3.14 AC5: Fallback Behavior

/**
 * Checks if Web Workers are available in the current environment.
 * Returns false for:
 * - Server-side rendering (no window/Worker)
 * - Very old browsers without Worker support
 * - Environments where Workers are blocked
 */
export function canUseWorkers(): boolean {
  // Check for SSR - no window object
  if (typeof window === 'undefined') {
    return false
  }

  // Check for Worker constructor
  if (typeof Worker === 'undefined') {
    return false
  }

  // Check for URL.createObjectURL (needed for inline workers)
  if (typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
    return false
  }

  // Check for Blob (needed for inline workers)
  if (typeof Blob === 'undefined') {
    return false
  }

  return true
}

/**
 * Logs a warning when falling back to synchronous execution.
 * Only logs once per session to avoid spam.
 */
let hasWarnedFallback = false

export function warnWorkerFallback(reason: string): void {
  if (hasWarnedFallback) return
  hasWarnedFallback = true

  console.warn(
    `[WebWorker] Falling back to synchronous execution: ${reason}. ` +
    'This may cause UI lag during heavy calculations.'
  )
}

/**
 * Resets the fallback warning (useful for testing).
 */
export function resetFallbackWarning(): void {
  hasWarnedFallback = false
}
