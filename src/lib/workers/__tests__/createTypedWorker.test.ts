// src/lib/workers/__tests__/createTypedWorker.test.ts
// Unit tests for typed worker wrapper factory
// Story 3.14 AC1: Worker Infrastructure

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createTypedWorker, type TypedWorker } from '../createTypedWorker'
import type { WorkerRequest, WorkerResponse } from '../types'

// =============================================================================
// Mock Worker Implementation
// =============================================================================

type TestRequest = { data: string }
type TestResponse = { result: string }

class MockWorker {
  onmessage: ((event: MessageEvent) => void) | null = null
  onerror: ((event: ErrorEvent) => void) | null = null
  private isTerminated = false

  postMessage(message: WorkerRequest<TestRequest>): void {
    if (this.isTerminated) {
      throw new Error('Worker is terminated')
    }
    // Simulate async response
    setTimeout(() => {
      if (this.onmessage && !this.isTerminated) {
        const response: WorkerResponse<TestResponse> = {
          id: message.id,
          type: 'response',
          result: { result: `processed: ${message.payload.data}` },
        }
        this.onmessage(new MessageEvent('message', { data: response }))
      }
    }, 10)
  }

  terminate(): void {
    this.isTerminated = true
  }

  // Helper for testing - simulate error
  simulateError(errorMessage: string): void {
    if (this.onerror) {
      this.onerror(new ErrorEvent('error', { message: errorMessage }))
    }
  }

  // Helper for testing - simulate error response
  simulateErrorResponse(requestId: string, errorMessage: string): void {
    if (this.onmessage) {
      const response: WorkerResponse<TestResponse> = {
        id: requestId,
        type: 'response',
        error: { message: errorMessage, name: 'TestError' },
      }
      this.onmessage(new MessageEvent('message', { data: response }))
    }
  }
}

// =============================================================================
// Tests
// =============================================================================

describe('createTypedWorker', () => {
  let mockWorker: MockWorker
  let typedWorker: TypedWorker<TestRequest, TestResponse>

  beforeEach(() => {
    mockWorker = new MockWorker()
    typedWorker = createTypedWorker<TestRequest, TestResponse>(
      mockWorker as unknown as Worker
    )
  })

  afterEach(() => {
    typedWorker.terminate()
  })

  describe('execute', () => {
    it('sends request and receives response', async () => {
      const result = await typedWorker.execute({ data: 'test' })
      expect(result).toEqual({ result: 'processed: test' })
    })

    it('handles multiple concurrent requests', async () => {
      const results = await Promise.all([
        typedWorker.execute({ data: 'a' }),
        typedWorker.execute({ data: 'b' }),
        typedWorker.execute({ data: 'c' }),
      ])

      expect(results).toHaveLength(3)
      expect(results[0]).toEqual({ result: 'processed: a' })
      expect(results[1]).toEqual({ result: 'processed: b' })
      expect(results[2]).toEqual({ result: 'processed: c' })
    })

    it('rejects on timeout', async () => {
      // Create worker with very short timeout
      const shortTimeoutWorker = createTypedWorker<TestRequest, TestResponse>(
        mockWorker as unknown as Worker,
        { timeout: 1 } // 1ms timeout
      )

      // Mock worker that never responds
      mockWorker.postMessage = vi.fn()

      await expect(shortTimeoutWorker.execute({ data: 'test' })).rejects.toThrow(
        /timed out/i
      )

      shortTimeoutWorker.terminate()
    })

    it('uses custom timeout from options', async () => {
      // Mock worker that never responds
      mockWorker.postMessage = vi.fn()

      const promise = typedWorker.execute({ data: 'test' }, { timeout: 5 })

      await expect(promise).rejects.toThrow(/timed out after 5ms/)
    })

    it('rejects when worker is terminated', async () => {
      typedWorker.terminate()

      await expect(typedWorker.execute({ data: 'test' })).rejects.toThrow(
        /terminated/i
      )
    })

    it('rejects with error from worker response', async () => {
      // Override postMessage to return error response
      mockWorker.postMessage = vi.fn((message: WorkerRequest<TestRequest>) => {
        setTimeout(() => {
          mockWorker.simulateErrorResponse(message.id, 'Worker calculation failed')
        }, 5)
      })

      await expect(typedWorker.execute({ data: 'test' })).rejects.toThrow(
        'Worker calculation failed'
      )
    })

    it('handles abort signal', async () => {
      const controller = new AbortController()

      // Mock worker that never responds
      mockWorker.postMessage = vi.fn()

      const promise = typedWorker.execute(
        { data: 'test' },
        { signal: controller.signal }
      )

      // Abort after a short delay
      setTimeout(() => controller.abort(), 5)

      await expect(promise).rejects.toThrow(/aborted/i)
    })
  })

  describe('terminate', () => {
    it('terminates the worker', () => {
      expect(typedWorker.isAlive()).toBe(true)
      typedWorker.terminate()
      expect(typedWorker.isAlive()).toBe(false)
    })

    it('rejects pending requests on terminate', async () => {
      // Mock worker that never responds
      mockWorker.postMessage = vi.fn()

      const promise = typedWorker.execute({ data: 'test' })

      // Terminate while request is pending
      typedWorker.terminate()

      await expect(promise).rejects.toThrow(/terminated/i)
    })

    it('can be called multiple times safely', () => {
      expect(() => {
        typedWorker.terminate()
        typedWorker.terminate()
        typedWorker.terminate()
      }).not.toThrow()
    })
  })

  describe('isAlive', () => {
    it('returns true for active worker', () => {
      expect(typedWorker.isAlive()).toBe(true)
    })

    it('returns false after termination', () => {
      typedWorker.terminate()
      expect(typedWorker.isAlive()).toBe(false)
    })
  })

  describe('error handling', () => {
    it('rejects all pending requests on worker error', async () => {
      // Mock worker that never responds
      mockWorker.postMessage = vi.fn()

      const promise1 = typedWorker.execute({ data: 'a' })
      const promise2 = typedWorker.execute({ data: 'b' })

      // Simulate worker error
      mockWorker.simulateError('Worker crashed')

      await expect(promise1).rejects.toThrow('Worker crashed')
      await expect(promise2).rejects.toThrow('Worker crashed')
    })

    it('handles postMessage failure', async () => {
      mockWorker.postMessage = vi.fn(() => {
        throw new Error('postMessage failed')
      })

      await expect(typedWorker.execute({ data: 'test' })).rejects.toThrow(
        'postMessage failed'
      )
    })
  })
})
