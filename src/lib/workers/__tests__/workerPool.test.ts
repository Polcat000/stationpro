// src/lib/workers/__tests__/workerPool.test.ts
// Unit tests for worker pool management
// Story 3.14 AC1: Worker Infrastructure

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { WorkerPool, createWorkerPool } from '../workerPool'
import type { WorkerRequest, WorkerResponse } from '../types'
import * as canUseWorkersModule from '../canUseWorkers'

// =============================================================================
// Mock Worker Implementation
// =============================================================================

type TestRequest = { value: number }
type TestResponse = { doubled: number }

class MockPoolWorker {
  onmessage: ((event: MessageEvent) => void) | null = null
  onerror: ((event: ErrorEvent) => void) | null = null
  private isTerminated = false
  private delay: number

  constructor(delay = 10) {
    this.delay = delay
  }

  postMessage(message: WorkerRequest<TestRequest>): void {
    if (this.isTerminated) {
      throw new Error('Worker is terminated')
    }
    // Simulate async processing
    setTimeout(() => {
      if (this.onmessage && !this.isTerminated) {
        const response: WorkerResponse<TestResponse> = {
          id: message.id,
          type: 'response',
          result: { doubled: message.payload.value * 2 },
        }
        this.onmessage(new MessageEvent('message', { data: response }))
      }
    }, this.delay)
  }

  terminate(): void {
    this.isTerminated = true
  }
}

// =============================================================================
// Tests
// =============================================================================

describe('WorkerPool', () => {
  let pool: WorkerPool<TestRequest, TestResponse>
  const mockWorkerFactory = () => new MockPoolWorker(5) as unknown as Worker

  beforeEach(() => {
    vi.spyOn(canUseWorkersModule, 'canUseWorkers').mockReturnValue(true)
    pool = createWorkerPool<TestRequest, TestResponse>(mockWorkerFactory, {
      minWorkers: 1,
      maxWorkers: 3,
      tasksBeforeRecycle: 5,
      defaultTimeout: 1000,
    })
  })

  afterEach(() => {
    pool.shutdown()
    vi.restoreAllMocks()
  })

  describe('execute', () => {
    it('executes a single task', async () => {
      const result = await pool.execute({ value: 5 })
      expect(result).toEqual({ doubled: 10 })
    })

    it('executes multiple tasks concurrently', async () => {
      const results = await Promise.all([
        pool.execute({ value: 1 }),
        pool.execute({ value: 2 }),
        pool.execute({ value: 3 }),
      ])

      expect(results).toEqual([
        { doubled: 2 },
        { doubled: 4 },
        { doubled: 6 },
      ])
    })

    it('queues tasks when all workers are busy', async () => {
      // Create pool with only 1 worker max
      const smallPool = createWorkerPool<TestRequest, TestResponse>(
        () => new MockPoolWorker(20) as unknown as Worker, // Slower workers
        { minWorkers: 1, maxWorkers: 1 }
      )

      // Submit more tasks than workers
      const results = await Promise.all([
        smallPool.execute({ value: 1 }),
        smallPool.execute({ value: 2 }),
        smallPool.execute({ value: 3 }),
      ])

      expect(results).toEqual([
        { doubled: 2 },
        { doubled: 4 },
        { doubled: 6 },
      ])

      smallPool.shutdown()
    })

    it('rejects on timeout', async () => {
      // Create pool with very short timeout
      const shortTimeoutPool = createWorkerPool<TestRequest, TestResponse>(
        () => {
          const worker = new MockPoolWorker(1000) // Very slow
          return worker as unknown as Worker
        },
        { defaultTimeout: 1 }
      )

      await expect(shortTimeoutPool.execute({ value: 5 })).rejects.toThrow(
        /timed out/i
      )

      shortTimeoutPool.shutdown()
    })

    it('rejects after shutdown', async () => {
      pool.shutdown()

      await expect(pool.execute({ value: 5 })).rejects.toThrow(/shut down/i)
    })
  })

  describe('fallback behavior (AC5)', () => {
    it('falls back to sync when workers unavailable', async () => {
      vi.spyOn(canUseWorkersModule, 'canUseWorkers').mockReturnValue(false)
      const warnSpy = vi.spyOn(canUseWorkersModule, 'warnWorkerFallback')

      const syncFallback = (req: TestRequest) => ({ doubled: req.value * 2 })
      const fallbackPool = createWorkerPool<TestRequest, TestResponse>(
        mockWorkerFactory,
        {},
        syncFallback
      )

      const result = await fallbackPool.execute({ value: 7 })

      expect(result).toEqual({ doubled: 14 })
      expect(warnSpy).toHaveBeenCalled()

      fallbackPool.shutdown()
    })

    it('rejects if no fallback provided and workers unavailable', async () => {
      vi.spyOn(canUseWorkersModule, 'canUseWorkers').mockReturnValue(false)

      const noFallbackPool = createWorkerPool<TestRequest, TestResponse>(
        mockWorkerFactory
      )

      await expect(noFallbackPool.execute({ value: 5 })).rejects.toThrow(
        /not available/i
      )

      noFallbackPool.shutdown()
    })
  })

  describe('getStats', () => {
    it('returns pool statistics', () => {
      const stats = pool.getStats()

      expect(stats).toHaveProperty('totalWorkers')
      expect(stats).toHaveProperty('idleWorkers')
      expect(stats).toHaveProperty('busyWorkers')
      expect(stats).toHaveProperty('queuedTasks')
      expect(stats).toHaveProperty('pendingRequests')
    })

    it('shows correct initial state', () => {
      const stats = pool.getStats()

      expect(stats.totalWorkers).toBeGreaterThanOrEqual(1)
      expect(stats.idleWorkers).toBe(stats.totalWorkers)
      expect(stats.busyWorkers).toBe(0)
      expect(stats.queuedTasks).toBe(0)
    })
  })

  describe('shutdown', () => {
    it('terminates all workers', () => {
      const initialStats = pool.getStats()
      expect(initialStats.totalWorkers).toBeGreaterThan(0)

      pool.shutdown()

      const finalStats = pool.getStats()
      expect(finalStats.totalWorkers).toBe(0)
    })

    it('rejects pending requests', async () => {
      // Mock slow worker
      const slowPool = createWorkerPool<TestRequest, TestResponse>(
        () => new MockPoolWorker(1000) as unknown as Worker,
        { minWorkers: 1, maxWorkers: 1 }
      )

      const promise = slowPool.execute({ value: 5 })

      // Shutdown while request is pending
      slowPool.shutdown()

      await expect(promise).rejects.toThrow(/shut down/i)
    })

    it('can be called multiple times safely', () => {
      expect(() => {
        pool.shutdown()
        pool.shutdown()
        pool.shutdown()
      }).not.toThrow()
    })
  })

  describe('worker recycling', () => {
    it('recycles workers after task threshold', async () => {
      // Create pool that recycles after 2 tasks
      const recyclePool = createWorkerPool<TestRequest, TestResponse>(
        () => new MockPoolWorker(1) as unknown as Worker,
        { minWorkers: 1, maxWorkers: 1, tasksBeforeRecycle: 2 }
      )

      // Execute tasks to trigger recycling
      await recyclePool.execute({ value: 1 })
      await recyclePool.execute({ value: 2 }) // Should trigger recycle

      // Pool should still work after recycling
      const result = await recyclePool.execute({ value: 3 })
      expect(result).toEqual({ doubled: 6 })

      recyclePool.shutdown()
    })
  })
})

describe('createWorkerPool factory', () => {
  beforeEach(() => {
    vi.spyOn(canUseWorkersModule, 'canUseWorkers').mockReturnValue(true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('creates a worker pool with default config', () => {
    const pool = createWorkerPool<TestRequest, TestResponse>(
      () => new MockPoolWorker() as unknown as Worker
    )

    expect(pool).toBeInstanceOf(WorkerPool)

    pool.shutdown()
  })

  it('creates a worker pool with custom config', () => {
    const pool = createWorkerPool<TestRequest, TestResponse>(
      () => new MockPoolWorker() as unknown as Worker,
      { minWorkers: 2, maxWorkers: 4 }
    )

    const stats = pool.getStats()
    expect(stats.totalWorkers).toBeGreaterThanOrEqual(2)

    pool.shutdown()
  })
})
