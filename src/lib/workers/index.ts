// src/lib/workers/index.ts
// Barrel exports for Web Worker infrastructure
// Story 3.14: Web Workers for Heavy Calculations

// Types
export type {
  WorkerRequest,
  WorkerResponse,
  WorkerError,
  WorkerExecuteOptions,
  WorkerStatus,
  WorkerMetadata,
  QueuedTask,
  WorkerPoolConfig,
} from './types'
export { DEFAULT_POOL_CONFIG } from './types'

// Feature detection
export { canUseWorkers, warnWorkerFallback, resetFallbackWarning } from './canUseWorkers'

// Typed worker factory
export type { CreateTypedWorkerOptions, TypedWorker } from './createTypedWorker'
export { createTypedWorker, createTypedWorkerFromUrl } from './createTypedWorker'

// Worker pool
export { WorkerPool, createWorkerPool } from './workerPool'

// Analysis worker types (for use with useWorkerCalculation hook)
export type {
  AnalysisRequestPayload,
  AnalysisResponsePayload,
} from './analysis.worker'
