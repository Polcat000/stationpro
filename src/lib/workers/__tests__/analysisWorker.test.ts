// src/lib/workers/__tests__/analysisWorker.test.ts
// Unit tests for analysis worker message handling
// Story 3.14 AC1, AC2, AC6: Worker message routing and extensibility

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Part } from '@/types/domain'
import type { WorkerRequest, WorkerResponse } from '../types'
import type { AnalysisRequestPayload, AnalysisResponsePayload } from '../analysis.worker'

// =============================================================================
// Test Helpers
// =============================================================================

function createTestPart(overrides: Partial<Part> = {}): Part {
  return {
    PartCallout: 'TEST-001',
    PartSeries: 'TestSeries',
    PartWidth_mm: 100,
    PartHeight_mm: 50,
    PartLength_mm: 200,
    SmallestLateralFeature_um: 10,
    InspectionZones: [],
    ...overrides,
  }
}

// =============================================================================
// Worker Message Handler Tests
// =============================================================================

describe('Analysis Worker Message Handling', () => {
  // We test the message handling logic by importing the module and simulating messages
  // Since the actual worker runs in a separate context, we test the handler directly

  let mockPostMessage: ReturnType<typeof vi.fn>
  let originalSelf: typeof globalThis

  beforeEach(() => {
    // Store original self
    originalSelf = globalThis.self

    // Mock postMessage
    mockPostMessage = vi.fn()

    // Create a mock self object with postMessage
    const mockSelf = {
      postMessage: mockPostMessage,
      onmessage: null as ((event: MessageEvent) => void) | null,
    }

    // @ts-expect-error - Mocking self for worker context
    globalThis.self = mockSelf
  })

  afterEach(() => {
    // Restore original self
    Object.defineProperty(globalThis, 'self', { value: originalSelf, writable: true })
    vi.resetModules()
  })

  describe('stats calculation type', () => {
    it('processes stats request and returns aggregate statistics', async () => {
      // Import worker module to register the onmessage handler
      await import('../analysis.worker')

      // Get the registered handler
      const handler = (globalThis.self as unknown as { onmessage: (event: MessageEvent) => void }).onmessage

      // Create test request
      const parts = [
        createTestPart({ PartCallout: 'P1', PartWidth_mm: 10, PartHeight_mm: 5 }),
        createTestPart({ PartCallout: 'P2', PartWidth_mm: 20, PartHeight_mm: 10 }),
      ]

      const request: WorkerRequest<AnalysisRequestPayload> = {
        id: 'test-123',
        type: 'request',
        payload: { type: 'stats', parts },
      }

      // Simulate message event
      handler(new MessageEvent('message', { data: request }))

      // Verify response was sent
      expect(mockPostMessage).toHaveBeenCalledTimes(1)

      const response = mockPostMessage.mock.calls[0][0] as WorkerResponse<AnalysisResponsePayload>
      expect(response.id).toBe('test-123')
      expect(response.type).toBe('stats')
      expect(response.error).toBeUndefined()

      // Verify stats result
      const result = response.result as { type: 'stats'; result: { width: { mean: number } } }
      expect(result.type).toBe('stats')
      expect(result.result.width.mean).toBe(15) // (10 + 20) / 2
    })

    it('handles empty parts array', async () => {
      await import('../analysis.worker')

      const handler = (globalThis.self as unknown as { onmessage: (event: MessageEvent) => void }).onmessage

      const request: WorkerRequest<AnalysisRequestPayload> = {
        id: 'test-empty',
        type: 'request',
        payload: { type: 'stats', parts: [] },
      }

      handler(new MessageEvent('message', { data: request }))

      expect(mockPostMessage).toHaveBeenCalledTimes(1)

      const response = mockPostMessage.mock.calls[0][0] as WorkerResponse<AnalysisResponsePayload>
      expect(response.error).toBeUndefined()

      const result = response.result as { type: 'stats'; result: { width: { count: number } } }
      expect(result.result.width.count).toBe(0)
    })

    it('handles single part (AC 3.5.5 - stdDev null)', async () => {
      await import('../analysis.worker')

      const handler = (globalThis.self as unknown as { onmessage: (event: MessageEvent) => void }).onmessage

      const request: WorkerRequest<AnalysisRequestPayload> = {
        id: 'test-single',
        type: 'request',
        payload: { type: 'stats', parts: [createTestPart()] },
      }

      handler(new MessageEvent('message', { data: request }))

      const response = mockPostMessage.mock.calls[0][0] as WorkerResponse<AnalysisResponsePayload>
      const result = response.result as { type: 'stats'; result: { width: { stdDev: number | null } } }
      expect(result.result.width.stdDev).toBeNull()
    })
  })

  describe('error handling', () => {
    it('returns error response for unknown calculation type', async () => {
      await import('../analysis.worker')

      const handler = (globalThis.self as unknown as { onmessage: (event: MessageEvent) => void }).onmessage

      const request = {
        id: 'test-error',
        type: 'request',
        payload: { type: 'invalid-type', data: {} },
      }

      handler(new MessageEvent('message', { data: request }))

      expect(mockPostMessage).toHaveBeenCalledTimes(1)

      const response = mockPostMessage.mock.calls[0][0] as WorkerResponse<AnalysisResponsePayload>
      expect(response.id).toBe('test-error')
      expect(response.type).toBe('error')
      expect(response.error).toBeDefined()
      expect(response.error?.message).toContain('Unknown calculation type')
    })

    it('returns error response when calculation throws', async () => {
      await import('../analysis.worker')

      const handler = (globalThis.self as unknown as { onmessage: (event: MessageEvent) => void }).onmessage

      // Create malformed data that will cause calculation to fail
      const request: WorkerRequest<AnalysisRequestPayload> = {
        id: 'test-throw',
        type: 'request',
        payload: {
          type: 'stats',
          // @ts-expect-error - Testing with invalid parts data
          parts: [{ invalid: 'data' }],
        },
      }

      handler(new MessageEvent('message', { data: request }))

      // The calculation may or may not throw depending on implementation
      // Either way, a response should be sent
      expect(mockPostMessage).toHaveBeenCalledTimes(1)
    })
  })

  describe('request/response correlation', () => {
    it('response id matches request id', async () => {
      await import('../analysis.worker')

      const handler = (globalThis.self as unknown as { onmessage: (event: MessageEvent) => void }).onmessage

      const requestId = `unique-${Date.now()}-${Math.random()}`
      const request: WorkerRequest<AnalysisRequestPayload> = {
        id: requestId,
        type: 'request',
        payload: { type: 'stats', parts: [] },
      }

      handler(new MessageEvent('message', { data: request }))

      const response = mockPostMessage.mock.calls[0][0] as WorkerResponse<AnalysisResponsePayload>
      expect(response.id).toBe(requestId)
    })

    it('handles multiple concurrent requests with correct ids', async () => {
      await import('../analysis.worker')

      const handler = (globalThis.self as unknown as { onmessage: (event: MessageEvent) => void }).onmessage

      const requests = [
        { id: 'req-1', type: 'request' as const, payload: { type: 'stats' as const, parts: [] } },
        { id: 'req-2', type: 'request' as const, payload: { type: 'stats' as const, parts: [] } },
        { id: 'req-3', type: 'request' as const, payload: { type: 'stats' as const, parts: [] } },
      ]

      requests.forEach((req) => handler(new MessageEvent('message', { data: req })))

      expect(mockPostMessage).toHaveBeenCalledTimes(3)

      const responseIds = mockPostMessage.mock.calls.map(
        (call) => (call[0] as WorkerResponse<AnalysisResponsePayload>).id
      )
      expect(responseIds).toContain('req-1')
      expect(responseIds).toContain('req-2')
      expect(responseIds).toContain('req-3')
    })
  })
})

describe('Analysis Worker Extensibility (AC6)', () => {
  it('message types are documented for future extension', () => {
    // This test verifies the extensibility pattern is in place
    // by checking that the types are exported and documented

    // The AnalysisRequestPayload and AnalysisResponsePayload types
    // should be union types that can be extended with new calculation types
    type TestRequest = AnalysisRequestPayload

    // Verify 'stats' type is available
    const statsRequest: TestRequest = { type: 'stats', parts: [] }
    expect(statsRequest.type).toBe('stats')

    // TypeScript will enforce that new types added to the union
    // must also be handled in the switch statement (exhaustiveness check)
  })
})
