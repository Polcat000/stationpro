// src/lib/workers/workerPool.ts
// Worker pool management for concurrent calculations
// Story 3.14 AC1: Worker Infrastructure

import type {
  WorkerPoolConfig,
  WorkerMetadata,
  QueuedTask,
  WorkerRequest,
  WorkerResponse,
} from './types'
import { DEFAULT_POOL_CONFIG } from './types'
import { canUseWorkers, warnWorkerFallback } from './canUseWorkers'

/**
 * Generates a unique worker ID.
 */
function generateWorkerId(): string {
  return `worker-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/**
 * Generates a unique request ID.
 */
function generateRequestId(): string {
  return `req-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

/**
 * Manages a pool of web workers for concurrent task execution.
 * Handles task queuing, worker recycling, and graceful fallback.
 */
export class WorkerPool<TRequest = unknown, TResponse = unknown> {
  private config: Required<WorkerPoolConfig>
  private workers: Map<string, Worker> = new Map()
  private workerMetadata: Map<string, WorkerMetadata> = new Map()
  private taskQueue: QueuedTask<TRequest, TResponse>[] = []
  private pendingRequests: Map<
    string,
    {
      workerId: string
      resolve: (value: TResponse) => void
      reject: (reason: Error) => void
      timeoutId: ReturnType<typeof setTimeout>
    }
  > = new Map()
  private workerFactory: () => Worker
  private isShutdown = false
  private syncFallback?: (request: TRequest) => TResponse

  constructor(
    workerFactory: () => Worker,
    config: WorkerPoolConfig = {},
    syncFallback?: (request: TRequest) => TResponse
  ) {
    this.workerFactory = workerFactory
    this.config = { ...DEFAULT_POOL_CONFIG, ...config }
    this.syncFallback = syncFallback

    // Pre-create minimum workers if Web Workers are available
    if (canUseWorkers()) {
      for (let i = 0; i < this.config.minWorkers; i++) {
        this.createWorker()
      }
    }
  }

  /**
   * Creates a new worker and adds it to the pool.
   */
  private createWorker(): string | null {
    if (!canUseWorkers()) {
      return null
    }

    try {
      const worker = this.workerFactory()
      const workerId = generateWorkerId()

      // Set up message handler
      worker.onmessage = (event: MessageEvent<WorkerResponse<TResponse>>) => {
        this.handleWorkerMessage(workerId, event.data)
      }

      // Set up error handler
      worker.onerror = (event: ErrorEvent) => {
        this.handleWorkerError(workerId, event)
      }

      this.workers.set(workerId, worker)
      this.workerMetadata.set(workerId, {
        id: workerId,
        status: 'idle',
        taskCount: 0,
        createdAt: Date.now(),
        lastTaskAt: null,
      })

      return workerId
    } catch (err) {
      console.error('[WorkerPool] Failed to create worker:', err)
      return null
    }
  }

  /**
   * Handles a message from a worker.
   */
  private handleWorkerMessage(workerId: string, response: WorkerResponse<TResponse>): void {
    const pending = this.pendingRequests.get(response.id)
    if (!pending) return

    // Clean up
    clearTimeout(pending.timeoutId)
    this.pendingRequests.delete(response.id)

    // Update worker metadata
    const metadata = this.workerMetadata.get(workerId)
    if (metadata) {
      metadata.status = 'idle'
      metadata.taskCount++
      metadata.lastTaskAt = Date.now()

      // Check if worker needs recycling
      if (metadata.taskCount >= this.config.tasksBeforeRecycle) {
        this.recycleWorker(workerId)
      }
    }

    // Resolve or reject
    if (response.error) {
      const error = new Error(response.error.message)
      error.name = response.error.name ?? 'WorkerError'
      pending.reject(error)
    } else {
      pending.resolve(response.result as TResponse)
    }

    // Process next queued task
    this.processQueue()
  }

  /**
   * Handles an error from a worker.
   */
  private handleWorkerError(workerId: string, event: ErrorEvent): void {
    console.error(`[WorkerPool] Worker ${workerId} error:`, event.message)

    // Find and reject any pending request for this worker
    for (const [requestId, pending] of this.pendingRequests) {
      if (pending.workerId === workerId) {
        clearTimeout(pending.timeoutId)
        this.pendingRequests.delete(requestId)
        const error = new Error(event.message || 'Worker error')
        error.name = 'WorkerError'
        pending.reject(error)
      }
    }

    // Recycle the problematic worker
    this.recycleWorker(workerId)

    // Process queue in case there are waiting tasks
    this.processQueue()
  }

  /**
   * Recycles a worker (terminates and creates new one).
   */
  private recycleWorker(workerId: string): void {
    const worker = this.workers.get(workerId)
    if (worker) {
      worker.terminate()
    }
    this.workers.delete(workerId)
    this.workerMetadata.delete(workerId)

    // Create replacement if we're below minimum
    if (this.workers.size < this.config.minWorkers && !this.isShutdown) {
      this.createWorker()
    }
  }

  /**
   * Gets an available worker or creates one if possible.
   */
  private getAvailableWorker(): string | null {
    // Find an idle worker
    for (const [workerId, metadata] of this.workerMetadata) {
      if (metadata.status === 'idle') {
        return workerId
      }
    }

    // Try to create a new worker if under max
    if (this.workers.size < this.config.maxWorkers) {
      return this.createWorker()
    }

    return null
  }

  /**
   * Processes the task queue.
   */
  private processQueue(): void {
    if (this.isShutdown || this.taskQueue.length === 0) return

    const workerId = this.getAvailableWorker()
    if (!workerId) return

    const task = this.taskQueue.shift()
    if (!task) return

    this.executeOnWorker(workerId, task)
  }

  /**
   * Executes a task on a specific worker.
   */
  private executeOnWorker(
    workerId: string,
    task: QueuedTask<TRequest, TResponse>
  ): void {
    const worker = this.workers.get(workerId)
    const metadata = this.workerMetadata.get(workerId)

    if (!worker || !metadata) {
      // Worker was removed, re-queue the task
      this.taskQueue.unshift(task)
      this.processQueue()
      return
    }

    metadata.status = 'busy'

    // Set up timeout
    const timeoutId = setTimeout(() => {
      const pending = this.pendingRequests.get(task.request.id)
      if (pending) {
        this.pendingRequests.delete(task.request.id)
        const error = new Error(`Worker request timed out after ${task.timeout}ms`)
        error.name = 'WorkerTimeoutError'
        pending.reject(error)

        // Recycle the timed-out worker
        this.recycleWorker(workerId)
        this.processQueue()
      }
    }, task.timeout)

    // Store pending request
    this.pendingRequests.set(task.request.id, {
      workerId,
      resolve: task.resolve,
      reject: task.reject,
      timeoutId,
    })

    // Send request to worker
    try {
      worker.postMessage(task.request)
    } catch (err) {
      clearTimeout(timeoutId)
      this.pendingRequests.delete(task.request.id)
      task.reject(err instanceof Error ? err : new Error(String(err)))
      metadata.status = 'idle'
    }
  }

  /**
   * Executes a request using the worker pool.
   * Falls back to synchronous execution if workers unavailable.
   */
  execute(request: TRequest, timeout?: number): Promise<TResponse> {
    if (this.isShutdown) {
      return Promise.reject(new Error('Worker pool has been shut down'))
    }

    // Check if we should fall back to sync
    if (!canUseWorkers()) {
      if (this.syncFallback) {
        warnWorkerFallback('Web Workers not available')
        try {
          const result = this.syncFallback(request)
          return Promise.resolve(result)
        } catch (err) {
          return Promise.reject(err)
        }
      }
      return Promise.reject(new Error('Web Workers not available and no fallback provided'))
    }

    return new Promise((resolve, reject) => {
      const workerRequest: WorkerRequest<TRequest> = {
        id: generateRequestId(),
        type: 'request',
        payload: request,
      }

      const task: QueuedTask<TRequest, TResponse> = {
        request: workerRequest,
        resolve,
        reject,
        timeout: timeout ?? this.config.defaultTimeout,
        createdAt: Date.now(),
      }

      // Try to execute immediately or queue
      const workerId = this.getAvailableWorker()
      if (workerId) {
        this.executeOnWorker(workerId, task)
      } else {
        this.taskQueue.push(task)
      }
    })
  }

  /**
   * Gets the current pool statistics.
   */
  getStats(): {
    totalWorkers: number
    idleWorkers: number
    busyWorkers: number
    queuedTasks: number
    pendingRequests: number
  } {
    let idleCount = 0
    let busyCount = 0

    for (const metadata of this.workerMetadata.values()) {
      if (metadata.status === 'idle') idleCount++
      else if (metadata.status === 'busy') busyCount++
    }

    return {
      totalWorkers: this.workers.size,
      idleWorkers: idleCount,
      busyWorkers: busyCount,
      queuedTasks: this.taskQueue.length,
      pendingRequests: this.pendingRequests.size,
    }
  }

  /**
   * Shuts down the pool, terminating all workers.
   */
  shutdown(): void {
    this.isShutdown = true

    // Reject all queued tasks
    const error = new Error('Worker pool shut down')
    error.name = 'WorkerPoolShutdownError'

    for (const task of this.taskQueue) {
      task.reject(error)
    }
    this.taskQueue = []

    // Reject all pending requests
    for (const [, pending] of this.pendingRequests) {
      clearTimeout(pending.timeoutId)
      pending.reject(error)
    }
    this.pendingRequests.clear()

    // Terminate all workers
    for (const worker of this.workers.values()) {
      worker.terminate()
    }
    this.workers.clear()
    this.workerMetadata.clear()
  }
}

/**
 * Creates a worker pool with the given configuration.
 */
export function createWorkerPool<TRequest, TResponse>(
  workerFactory: () => Worker,
  config?: WorkerPoolConfig,
  syncFallback?: (request: TRequest) => TResponse
): WorkerPool<TRequest, TResponse> {
  return new WorkerPool(workerFactory, config, syncFallback)
}
