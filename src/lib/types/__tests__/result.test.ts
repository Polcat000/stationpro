// src/lib/types/__tests__/result.test.ts
// Unit tests for Result type and helper functions
// Tests AC-2.1.4

import { describe, it, expect } from 'vitest'
import { ok, err, isOk, isErr, type Result } from '../result'

describe('Result type', () => {
  describe('ok() helper', () => {
    it('returns success: true with data', () => {
      const result = ok({ id: 1, name: 'Test' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual({ id: 1, name: 'Test' })
      }
    })

    it('works with primitive values', () => {
      const stringResult = ok('hello')
      expect(stringResult.success).toBe(true)
      if (stringResult.success) {
        expect(stringResult.data).toBe('hello')
      }

      const numberResult = ok(42)
      expect(numberResult.success).toBe(true)
      if (numberResult.success) {
        expect(numberResult.data).toBe(42)
      }

      const boolResult = ok(true)
      expect(boolResult.success).toBe(true)
      if (boolResult.success) {
        expect(boolResult.data).toBe(true)
      }
    })

    it('works with null value', () => {
      const result = ok(null)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBeNull()
      }
    })

    it('works with undefined value', () => {
      const result = ok(undefined)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBeUndefined()
      }
    })

    it('works with array values', () => {
      const result = ok([1, 2, 3])
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual([1, 2, 3])
      }
    })
  })

  describe('err() helper', () => {
    it('returns success: false with error', () => {
      const result = err('Something went wrong')
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Something went wrong')
      }
    })

    it('works with Error object', () => {
      const error = new Error('Network error')
      const result = err(error)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe(error)
        expect(result.error.message).toBe('Network error')
      }
    })

    it('works with custom error objects', () => {
      const customError = { code: 'NOT_FOUND', message: 'Resource not found' }
      const result = err(customError)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toEqual(customError)
      }
    })
  })

  describe('type narrowing', () => {
    it('narrows type with if (result.success)', () => {
      const result: Result<{ name: string }, string> = ok({ name: 'Test' })

      if (result.success) {
        // TypeScript should know result.data exists here
        expect(result.data.name).toBe('Test')
      } else {
        // This branch shouldn't execute
        expect.fail('Should not reach error branch')
      }
    })

    it('narrows type with if (!result.success)', () => {
      const result: Result<{ name: string }, string> = err('Error occurred')

      if (!result.success) {
        // TypeScript should know result.error exists here
        expect(result.error).toBe('Error occurred')
      } else {
        // This branch shouldn't execute
        expect.fail('Should not reach success branch')
      }
    })

    it('narrowing works in switch-like pattern', () => {
      function processResult<T>(result: Result<T, string>): string {
        if (result.success) {
          return `Success: ${JSON.stringify(result.data)}`
        }
        return `Error: ${result.error}`
      }

      expect(processResult(ok({ id: 1 }))).toBe('Success: {"id":1}')
      expect(processResult(err('Failed'))).toBe('Error: Failed')
    })
  })

  describe('isOk() type guard', () => {
    it('returns true for success result', () => {
      const result = ok('data')
      expect(isOk(result)).toBe(true)
    })

    it('returns false for error result', () => {
      const result = err('error')
      expect(isOk(result)).toBe(false)
    })

    it('narrows type when used in condition', () => {
      const result: Result<number, string> = ok(42)

      if (isOk(result)) {
        // TypeScript should know result.data is number
        expect(result.data + 1).toBe(43)
      }
    })
  })

  describe('isErr() type guard', () => {
    it('returns true for error result', () => {
      const result = err('error')
      expect(isErr(result)).toBe(true)
    })

    it('returns false for success result', () => {
      const result = ok('data')
      expect(isErr(result)).toBe(false)
    })

    it('narrows type when used in condition', () => {
      const result: Result<number, { code: number }> = err({ code: 404 })

      if (isErr(result)) {
        // TypeScript should know result.error has code property
        expect(result.error.code).toBe(404)
      }
    })
  })

  describe('real-world usage patterns', () => {
    it('works with async operations', async () => {
      async function fetchData(): Promise<Result<{ id: number }, Error>> {
        try {
          // Simulating successful fetch
          return ok({ id: 1 })
        } catch (e) {
          return err(e instanceof Error ? e : new Error('Unknown error'))
        }
      }

      const result = await fetchData()
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.id).toBe(1)
      }
    })

    it('works with validation functions', () => {
      function validateEmail(email: string): Result<string, string> {
        if (!email.includes('@')) {
          return err('Invalid email format')
        }
        return ok(email.toLowerCase())
      }

      const validResult = validateEmail('Test@Example.com')
      expect(validResult.success).toBe(true)
      if (validResult.success) {
        expect(validResult.data).toBe('test@example.com')
      }

      const invalidResult = validateEmail('invalid-email')
      expect(invalidResult.success).toBe(false)
      if (!invalidResult.success) {
        expect(invalidResult.error).toBe('Invalid email format')
      }
    })

    it('can chain results', () => {
      function step1(input: string): Result<number, string> {
        const num = parseInt(input)
        if (isNaN(num)) return err('Not a number')
        return ok(num)
      }

      function step2(num: number): Result<number, string> {
        if (num < 0) return err('Must be positive')
        return ok(num * 2)
      }

      function pipeline(input: string): Result<number, string> {
        const result1 = step1(input)
        if (!result1.success) return result1

        return step2(result1.data)
      }

      expect(pipeline('5')).toEqual({ success: true, data: 10 })
      expect(pipeline('abc')).toEqual({ success: false, error: 'Not a number' })
      expect(pipeline('-3')).toEqual({ success: false, error: 'Must be positive' })
    })
  })
})
