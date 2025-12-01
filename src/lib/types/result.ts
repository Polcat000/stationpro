// src/lib/types/result.ts
// Result type for structured error handling
// Canonical reference: docs/active/arch/resilience.md

/**
 * Result type for operations that can fail.
 * Use instead of throwing exceptions for expected error cases.
 *
 * @template T - The success data type
 * @template E - The error type (defaults to Error)
 *
 * @example
 * function parseJson<T>(json: string): Result<T, string> {
 *   try {
 *     return ok(JSON.parse(json))
 *   } catch {
 *     return err('Invalid JSON')
 *   }
 * }
 *
 * const result = parseJson<User>(input)
 * if (result.success) {
 *   console.log(result.data.name) // Type-safe access
 * } else {
 *   console.error(result.error) // Type-safe error
 * }
 */
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E }

/**
 * Creates a success Result with the given data.
 *
 * @param data - The success value
 * @returns A success Result containing the data
 *
 * @example
 * const result = ok({ id: 1, name: 'Test' })
 * // result.success === true
 * // result.data === { id: 1, name: 'Test' }
 */
export function ok<T>(data: T): Result<T, never> {
  return { success: true, data }
}

/**
 * Creates a failure Result with the given error.
 *
 * @param error - The error value
 * @returns A failure Result containing the error
 *
 * @example
 * const result = err('Not found')
 * // result.success === false
 * // result.error === 'Not found'
 */
export function err<E>(error: E): Result<never, E> {
  return { success: false, error }
}

/**
 * Type guard to check if a Result is a success.
 * Useful for narrowing the type in conditional blocks.
 *
 * @param result - The Result to check
 * @returns true if the Result is a success, false otherwise
 *
 * @example
 * if (isOk(result)) {
 *   console.log(result.data) // TypeScript knows data exists
 * }
 */
export function isOk<T, E>(result: Result<T, E>): result is { success: true; data: T } {
  return result.success
}

/**
 * Type guard to check if a Result is a failure.
 * Useful for narrowing the type in conditional blocks.
 *
 * @param result - The Result to check
 * @returns true if the Result is a failure, false otherwise
 *
 * @example
 * if (isErr(result)) {
 *   console.error(result.error) // TypeScript knows error exists
 * }
 */
export function isErr<T, E>(result: Result<T, E>): result is { success: false; error: E } {
  return !result.success
}
