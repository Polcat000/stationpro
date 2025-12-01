// src/lib/logger.ts
// Centralized logging utility with environment-aware behavior
// Canonical reference: docs/active/arch/resilience.md

/**
 * Log levels supported by the logger
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

/**
 * Optional context for structured logging
 */
export interface LogContext {
  /** Component or module name */
  component?: string
  /** Action being performed */
  action?: string
  /** Additional metadata */
  [key: string]: unknown
}

/**
 * Formats a log message with level prefix and optional context
 */
function formatMessage(level: LogLevel, message: string, context?: LogContext): string {
  const prefix = `[${level.toUpperCase()}]`
  const contextStr = context ? ` ${JSON.stringify(context)}` : ''
  return `${prefix} ${message}${contextStr}`
}

/**
 * Logger utility with environment-aware behavior.
 *
 * - debug/info: Only log in development mode (import.meta.env.DEV)
 * - warn/error: Always log regardless of environment
 *
 * @example
 * logger.debug('Loading data', { component: 'DataLoader' })
 * logger.info('Data loaded successfully')
 * logger.warn('Deprecated API usage')
 * logger.error('Failed to load data', new Error('Network error'), { action: 'fetch' })
 */
export const logger = {
  /**
   * Log debug-level message (development only)
   */
  debug(message: string, context?: LogContext): void {
    if (import.meta.env.DEV) {
      console.log(formatMessage('debug', message, context))
    }
  },

  /**
   * Log info-level message (development only)
   */
  info(message: string, context?: LogContext): void {
    if (import.meta.env.DEV) {
      console.log(formatMessage('info', message, context))
    }
  },

  /**
   * Log warning-level message (always logs)
   */
  warn(message: string, context?: LogContext): void {
    console.warn(formatMessage('warn', message, context))
  },

  /**
   * Log error-level message (always logs)
   * Optionally includes an Error object for stack traces
   */
  error(message: string, error?: Error, context?: LogContext): void {
    console.error(formatMessage('error', message, context))
    if (error) {
      console.error(error)
    }
  },
}
