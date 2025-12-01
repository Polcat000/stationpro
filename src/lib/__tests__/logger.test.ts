// src/lib/__tests__/logger.test.ts
// Unit tests for Logger utility
// Tests AC-2.1.5

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { logger } from '../logger'

describe('logger', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  describe('debug()', () => {
    it('logs in DEV mode', () => {
      vi.stubEnv('DEV', true)
      // Need to re-import or the module caches import.meta.env
      // For this test, we'll check the behavior directly

      // Since import.meta.env.DEV is already true in test env
      logger.debug('Debug message')
      expect(consoleLogSpy).toHaveBeenCalled()
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('[DEBUG]'))
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Debug message'))
    })

    it('includes log level prefix [DEBUG]', () => {
      logger.debug('Test message')
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringMatching(/^\[DEBUG\]/))
    })

    it('includes context in output when provided', () => {
      logger.debug('Loading data', { component: 'DataLoader', action: 'fetch' })
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('"component":"DataLoader"')
      )
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('"action":"fetch"')
      )
    })
  })

  describe('info()', () => {
    it('logs in DEV mode', () => {
      logger.info('Info message')
      expect(consoleLogSpy).toHaveBeenCalled()
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('[INFO]'))
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Info message'))
    })

    it('includes log level prefix [INFO]', () => {
      logger.info('Test message')
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringMatching(/^\[INFO\]/))
    })

    it('includes context in output when provided', () => {
      logger.info('Operation complete', { component: 'App', success: true })
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('"component":"App"')
      )
    })
  })

  describe('warn()', () => {
    it('always logs regardless of environment', () => {
      logger.warn('Warning message')
      expect(consoleWarnSpy).toHaveBeenCalled()
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('[WARN]'))
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Warning message'))
    })

    it('includes log level prefix [WARN]', () => {
      logger.warn('Deprecated API')
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringMatching(/^\[WARN\]/))
    })

    it('includes context in output when provided', () => {
      logger.warn('Rate limit approaching', { remaining: 10 })
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('"remaining":10')
      )
    })
  })

  describe('error()', () => {
    it('always logs regardless of environment', () => {
      logger.error('Error message')
      expect(consoleErrorSpy).toHaveBeenCalled()
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('[ERROR]'))
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Error message'))
    })

    it('includes log level prefix [ERROR]', () => {
      logger.error('Critical failure')
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringMatching(/^\[ERROR\]/))
    })

    it('logs Error object separately when provided', () => {
      const error = new Error('Network failure')
      logger.error('Failed to fetch data', error)

      // First call should be the formatted message
      expect(consoleErrorSpy).toHaveBeenNthCalledWith(1,
        expect.stringContaining('[ERROR] Failed to fetch data')
      )
      // Second call should be the Error object itself
      expect(consoleErrorSpy).toHaveBeenNthCalledWith(2, error)
    })

    it('includes context in output when provided', () => {
      const error = new Error('Timeout')
      logger.error('Request failed', error, { url: '/api/data', timeout: 5000 })

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('"url":"/api/data"')
      )
    })

    it('works without Error object', () => {
      logger.error('Simple error message')
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR] Simple error message')
      )
    })

    it('works with context but no Error object', () => {
      logger.error('Validation failed', undefined, { field: 'email' })
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('"field":"email"')
      )
    })
  })

  describe('message formatting', () => {
    it('formats message without context', () => {
      logger.warn('Simple message')
      expect(consoleWarnSpy).toHaveBeenCalledWith('[WARN] Simple message')
    })

    it('formats message with context object', () => {
      logger.warn('Message with context', { key: 'value' })
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[WARN] Message with context {"key":"value"}'
      )
    })

    it('handles complex context objects', () => {
      logger.warn('Complex context', {
        component: 'TestComponent',
        action: 'test',
        nested: { a: 1, b: 2 },
        array: [1, 2, 3],
      })
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('"nested":{"a":1,"b":2}')
      )
    })
  })

  describe('LogContext interface', () => {
    it('accepts component field', () => {
      logger.info('Test', { component: 'MyComponent' })
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('"component":"MyComponent"')
      )
    })

    it('accepts action field', () => {
      logger.info('Test', { action: 'initialize' })
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('"action":"initialize"')
      )
    })

    it('accepts additional metadata fields', () => {
      logger.info('Test', {
        component: 'Parser',
        action: 'parse',
        fileSize: 1024,
        format: 'json',
      })
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('"fileSize":1024')
      )
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('"format":"json"')
      )
    })
  })
})
