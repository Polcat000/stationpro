// src/lib/workers/createTypedWorker.ts
// Factory for creating typed worker wrappers with promise-based request/response
// Story 3.14 AC1: Worker Infrastructure

import type { WorkerRequest, WorkerResponse, WorkerExecuteOptions } from './types'

/**
 * Options for creating a typed worker.
 */
export interface CreateTypedWorkerOptions {
  /** Default timeout for requests in milliseconds (default: 30000) */
  timeout?: number
}

/**
 * Interface for a typed worker wrapper.
 */
export interface TypedWorker<TRequest, TResponse> {
  /** Execute a request and get a promise for the response */
  execute: (request: TRequest, options?: WorkerExecuteOptions) => Promise<TResponse>
  /** Terminate the worker */
  terminate: () => void
  /** Check if worker is still alive */
  isAlive: () => boolean
}

/**
 * Generates a unique request ID.
 */
function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

/**
 * Creates a typed worker wrapper with promise-based request/response pattern.
 * Handles lifecycle management, timeouts, and error recovery.
 *
 * @param worker - The raw Worker instance
 * @param options - Configuration options
 * @returns Typed worker wrapper
 */
export function createTypedWorker<TRequest, TResponse>(
  worker: Worker,
  options: CreateTypedWorkerOptions = {}
): TypedWorker<TRequest, TResponse> {
  const { timeout: defaultTimeout = 30000 } = options

  // Track pending requests by ID
  const pendingRequests = new Map<
    string,
    {
      resolve: (value: TResponse) => void
      reject: (reason: Error) => void
      timeoutId: ReturnType<typeof setTimeout>
    }
  >()

  let isTerminated = false

  // Handle messages from worker
  worker.onmessage = (event: MessageEvent<WorkerResponse<TResponse>>) => {
    const response = event.data
    const pending = pendingRequests.get(response.id)

    if (!pending) {
      // Response for unknown request - might be late after timeout
      return
    }

    // Clean up
    clearTimeout(pending.timeoutId)
    pendingRequests.delete(response.id)

    // Resolve or reject based on response
    if (response.error) {
      const error = new Error(response.error.message)
      error.name = response.error.name ?? 'WorkerError'
      if (response.error.stack) {
        error.stack = response.error.stack
      }
      pending.reject(error)
    } else {
      pending.resolve(response.result as TResponse)
    }
  }

  // Handle worker errors
  worker.onerror = (event: ErrorEvent) => {
    // Reject all pending requests
    const error = new Error(event.message || 'Worker error')
    error.name = 'WorkerError'

    for (const [id, pending] of pendingRequests) {
      clearTimeout(pending.timeoutId)
      pending.reject(error)
      pendingRequests.delete(id)
    }
  }

  return {
    execute(request: TRequest, execOptions: WorkerExecuteOptions = {}): Promise<TResponse> {
      return new Promise((resolve, reject) => {
        if (isTerminated) {
          reject(new Error('Worker has been terminated'))
          return
        }

        const id = generateRequestId()
        const timeout = execOptions.timeout ?? defaultTimeout

        // Set up timeout
        const timeoutId = setTimeout(() => {
          const pending = pendingRequests.get(id)
          if (pending) {
            pendingRequests.delete(id)
            const error = new Error(`Worker request timed out after ${timeout}ms`)
            error.name = 'WorkerTimeoutError'
            pending.reject(error)
          }
        }, timeout)

        // Handle abort signal
        if (execOptions.signal) {
          execOptions.signal.addEventListener('abort', () => {
            const pending = pendingRequests.get(id)
            if (pending) {
              clearTimeout(pending.timeoutId)
              pendingRequests.delete(id)
              const error = new Error('Worker request was aborted')
              error.name = 'AbortError'
              pending.reject(error)
            }
          })
        }

        // Store pending request
        pendingRequests.set(id, { resolve, reject, timeoutId })

        // Send request to worker
        const workerRequest: WorkerRequest<TRequest> = {
          id,
          type: 'request',
          payload: request,
        }

        try {
          worker.postMessage(workerRequest)
        } catch (err) {
          clearTimeout(timeoutId)
          pendingRequests.delete(id)
          reject(err instanceof Error ? err : new Error(String(err)))
        }
      })
    },

    terminate(): void {
      if (isTerminated) return

      isTerminated = true

      // Reject all pending requests
      const error = new Error('Worker was terminated')
      error.name = 'WorkerTerminatedError'

      for (const [id, pending] of pendingRequests) {
        clearTimeout(pending.timeoutId)
        pending.reject(error)
        pendingRequests.delete(id)
      }

      worker.terminate()
    },

    isAlive(): boolean {
      return !isTerminated
    },
  }
}

/**
 * Creates a worker from a URL and wraps it with typed interface.
 *
 * @param workerUrl - URL to the worker script (from ?worker import)
 * @param options - Configuration options
 * @returns Typed worker wrapper
 */
export function createTypedWorkerFromUrl<TRequest, TResponse>(
  workerUrl: URL | string,
  options: CreateTypedWorkerOptions = {}
): TypedWorker<TRequest, TResponse> {
  const worker = new Worker(workerUrl, { type: 'module' })
  return createTypedWorker<TRequest, TResponse>(worker, options)
}
