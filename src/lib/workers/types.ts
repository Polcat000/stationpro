// src/lib/workers/types.ts
// Type-safe message interfaces for Web Worker communication
// Story 3.14 AC1: Worker Infrastructure

/**
 * Message from main thread to worker.
 * Uses id for request/response correlation.
 */
export interface WorkerRequest<T = unknown> {
  id: string
  type: string
  payload: T
}

/**
 * Message from worker to main thread.
 * Either contains result on success or error on failure.
 */
export interface WorkerResponse<T = unknown> {
  id: string
  type: string
  result?: T
  error?: WorkerError
}

/**
 * Error structure returned from worker.
 */
export interface WorkerError {
  message: string
  name?: string
  stack?: string
}

/**
 * Options for worker execution.
 */
export interface WorkerExecuteOptions {
  timeout?: number
  signal?: AbortSignal
}

/**
 * Status of a worker in the pool.
 */
export type WorkerStatus = 'idle' | 'busy' | 'terminated'

/**
 * Metadata for tracking worker state in the pool.
 */
export interface WorkerMetadata {
  id: string
  status: WorkerStatus
  taskCount: number
  createdAt: number
  lastTaskAt: number | null
}

/**
 * Task queued for execution in the worker pool.
 */
export interface QueuedTask<TRequest = unknown, TResponse = unknown> {
  request: WorkerRequest<TRequest>
  resolve: (value: TResponse) => void
  reject: (reason: Error) => void
  timeout: number
  createdAt: number
}

/**
 * Configuration for the worker pool.
 */
export interface WorkerPoolConfig {
  /** Minimum number of workers to maintain */
  minWorkers?: number
  /** Maximum number of workers to create */
  maxWorkers?: number
  /** Number of tasks before recycling a worker (memory management) */
  tasksBeforeRecycle?: number
  /** Default timeout for tasks in milliseconds */
  defaultTimeout?: number
}

/**
 * Default pool configuration values.
 */
export const DEFAULT_POOL_CONFIG: Required<WorkerPoolConfig> = {
  minWorkers: 1,
  maxWorkers: Math.min(4, typeof navigator !== 'undefined' ? navigator.hardwareConcurrency ?? 2 : 2),
  tasksBeforeRecycle: 100,
  defaultTimeout: 30000,
}
