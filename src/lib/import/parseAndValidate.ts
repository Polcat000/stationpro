// src/lib/import/parseAndValidate.ts
// JSON parsing and Zod validation for parts import
// Canonical reference: docs/active/arch/forms.md#JSON-Import-Pattern

import { partsImportSchema, partSchema, type Part } from '@/lib/schemas/part'
import { componentsImportSchema, componentSchema, type Component } from '@/lib/schemas/component'
import { logger } from '@/lib/logger'

/**
 * Represents a validation error for a specific field
 */
export interface ImportError {
  /** Dot-notation path to the invalid field (e.g., "0.InspectionZones.0.Face") */
  path: string
  /** Human-readable error message */
  message: string
}

/**
 * Result type for import operations
 * Uses discriminated union - never throws, always returns structured result
 */
export type ImportResult<T> =
  | { success: true; data: T }
  | { success: false; errors: ImportError[] }

/**
 * Parses and validates a JSON string containing parts data.
 *
 * Flow:
 * 1. Parse JSON string (catch SyntaxError)
 * 2. Validate against partsImportSchema with safeParse
 * 3. Map Zod errors to ImportError[] with dot-notation paths
 *
 * @param jsonString - Raw JSON string to parse
 * @returns ImportResult with validated Part[] or ImportError[]
 *
 * @example
 * const result = parsePartsJson('[{"PartCallout": "TEST-001", ...}]')
 * if (result.success) {
 *   console.log(`Parsed ${result.data.length} parts`)
 * } else {
 *   console.error('Errors:', result.errors)
 * }
 */
export function parsePartsJson(jsonString: string): ImportResult<Part[]> {
  // Step 1: Parse JSON
  let parsed: unknown
  try {
    parsed = JSON.parse(jsonString)
  } catch (error) {
    const message = error instanceof SyntaxError
      ? `Invalid JSON: ${error.message}`
      : 'Failed to parse JSON'
    logger.warn('JSON parse failed', { component: 'parsePartsJson', error: message })
    return {
      success: false,
      errors: [{ path: 'root', message }],
    }
  }

  // Step 2: Validate against schema
  const result = partsImportSchema.safeParse(parsed)

  if (result.success) {
    logger.info(`Parsed ${result.data.length} parts successfully`, { component: 'parsePartsJson' })
    return { success: true, data: result.data }
  }

  // Step 3: Map Zod errors to ImportError[]
  const errors: ImportError[] = result.error.issues.map((issue) => ({
    path: issue.path.join('.') || 'root',
    message: issue.message,
  }))

  logger.warn(`Validation failed with ${errors.length} errors`, { component: 'parsePartsJson' })
  return { success: false, errors }
}

/**
 * Validates parts individually, separating valid from invalid.
 * Useful for partial imports where some parts are valid and some are not.
 *
 * @param parts - Array of unknown objects to validate
 * @returns Object with validParts, invalidParts with their errors, and summary counts
 */
export function validatePartsIndividually(parts: unknown[]): {
  validParts: Part[]
  invalidParts: Array<{ index: number; data: unknown; errors: ImportError[] }>
  validCount: number
  invalidCount: number
} {
  const validParts: Part[] = []
  const invalidParts: Array<{ index: number; data: unknown; errors: ImportError[] }> = []

  parts.forEach((part, index) => {
    const result = partSchema.safeParse(part)
    if (result.success) {
      validParts.push(result.data)
    } else {
      invalidParts.push({
        index,
        data: part,
        errors: result.error.issues.map((issue) => {
          const fieldPath = issue.path.map(String).join('.')
          return {
            path: fieldPath ? `${index}.${fieldPath}` : `${index}`,
            message: issue.message,
          }
        }),
      })
    }
  })

  return {
    validParts,
    invalidParts,
    validCount: validParts.length,
    invalidCount: invalidParts.length,
  }
}

/**
 * Parses JSON and validates parts individually for partial import support.
 *
 * @param jsonString - Raw JSON string to parse
 * @returns ImportResult with validation breakdown or parse errors
 */
export function parseAndValidatePartsIndividually(jsonString: string): ImportResult<{
  validParts: Part[]
  invalidParts: Array<{ index: number; data: unknown; errors: ImportError[] }>
  validCount: number
  invalidCount: number
}> {
  // Step 1: Parse JSON
  let parsed: unknown
  try {
    parsed = JSON.parse(jsonString)
  } catch (error) {
    const message = error instanceof SyntaxError
      ? `Invalid JSON: ${error.message}`
      : 'Failed to parse JSON'
    return {
      success: false,
      errors: [{ path: 'root', message }],
    }
  }

  // Step 2: Ensure it's an array
  if (!Array.isArray(parsed)) {
    return {
      success: false,
      errors: [{ path: 'root', message: 'Expected an array of parts' }],
    }
  }

  // Step 3: Validate each part individually
  const result = validatePartsIndividually(parsed)

  return { success: true, data: result }
}

/**
 * Parses and validates a JSON string containing components data.
 * Components JSON uses { Components: [...] } wrapper structure.
 *
 * Flow:
 * 1. Parse JSON string (catch SyntaxError)
 * 2. Validate against componentsImportSchema with safeParse
 * 3. Map Zod errors to ImportError[] with Components.X.field path format
 *
 * @param jsonString - Raw JSON string to parse
 * @returns ImportResult with validated Component[] or ImportError[]
 *
 * @example
 * const result = parseComponentsJson('{"Components": [{"componentType": "LaserLineProfiler", ...}]}')
 * if (result.success) {
 *   console.log(`Parsed ${result.data.length} components`)
 * } else {
 *   console.error('Errors:', result.errors)
 * }
 */
export function parseComponentsJson(jsonString: string): ImportResult<Component[]> {
  // Step 1: Parse JSON
  let parsed: unknown
  try {
    parsed = JSON.parse(jsonString)
  } catch (error) {
    const message = error instanceof SyntaxError
      ? `Invalid JSON: ${error.message}`
      : 'Failed to parse JSON'
    logger.warn('JSON parse failed', { component: 'parseComponentsJson', error: message })
    return {
      success: false,
      errors: [{ path: 'root', message }],
    }
  }

  // Step 2: Validate against schema
  const result = componentsImportSchema.safeParse(parsed)

  if (result.success) {
    logger.info(`Parsed ${result.data.Components.length} components successfully`, { component: 'parseComponentsJson' })
    return { success: true, data: result.data.Components }
  }

  // Step 3: Map Zod errors to ImportError[] with Components.X.field path format
  // z.union() returns nested errors in issue.errors array - flatten them for field-specific paths
  const errors: ImportError[] = []

  for (const issue of result.error.issues) {
    if (issue.code === 'invalid_union' && 'errors' in issue) {
      // For union errors, extract errors from the first matching variant (most relevant)
      // Each variant's errors are an array of ZodIssue[]
      const unionErrors = issue.errors as unknown[][]
      // Parent path from the union issue (e.g., ['Components', 0])
      const parentPath = issue.path.join('.')

      if (unionErrors.length > 0 && unionErrors[0].length > 0) {
        // Use first variant's errors (typically the closest match)
        for (const nestedIssue of unionErrors[0] as { path: (string | number)[]; message: string }[]) {
          const fieldPath = nestedIssue.path.join('.')
          // Combine parent path with field path
          const fullPath = parentPath
            ? (fieldPath ? `${parentPath}.${fieldPath}` : parentPath)
            : (fieldPath || 'root')
          errors.push({
            path: fullPath,
            message: nestedIssue.message,
          })
        }
      } else {
        // Fallback for empty union errors
        errors.push({
          path: parentPath || 'root',
          message: issue.message,
        })
      }
    } else {
      // Regular errors
      errors.push({
        path: issue.path.join('.') || 'root',
        message: issue.message,
      })
    }
  }

  logger.warn(`Validation failed with ${errors.length} errors`, { component: 'parseComponentsJson' })
  return { success: false, errors }
}

/**
 * Validates components individually, separating valid from invalid.
 * Useful for partial imports where some components are valid and some are not.
 *
 * @param components - Array of unknown objects to validate
 * @returns Object with validComponents, invalidComponents with their errors, and summary counts
 */
export function validateComponentsIndividually(components: unknown[]): {
  validComponents: Component[]
  invalidComponents: Array<{ index: number; data: unknown; errors: ImportError[] }>
  validCount: number
  invalidCount: number
} {
  const validComponents: Component[] = []
  const invalidComponents: Array<{ index: number; data: unknown; errors: ImportError[] }> = []

  components.forEach((component, index) => {
    const result = componentSchema.safeParse(component)
    if (result.success) {
      validComponents.push(result.data)
    } else {
      invalidComponents.push({
        index,
        data: component,
        errors: result.error.issues.map((issue) => {
          const fieldPath = issue.path.map(String).join('.')
          return {
            path: fieldPath ? `Components.${index}.${fieldPath}` : `Components.${index}`,
            message: issue.message,
          }
        }),
      })
    }
  })

  return {
    validComponents,
    invalidComponents,
    validCount: validComponents.length,
    invalidCount: invalidComponents.length,
  }
}

/**
 * Parses JSON and validates components individually for partial import support.
 * Components JSON uses { Components: [...] } wrapper structure.
 *
 * @param jsonString - Raw JSON string to parse
 * @returns ImportResult with validation breakdown or parse errors
 */
export function parseAndValidateComponentsIndividually(jsonString: string): ImportResult<{
  validComponents: Component[]
  invalidComponents: Array<{ index: number; data: unknown; errors: ImportError[] }>
  validCount: number
  invalidCount: number
}> {
  // Step 1: Parse JSON
  let parsed: unknown
  try {
    parsed = JSON.parse(jsonString)
  } catch (error) {
    const message = error instanceof SyntaxError
      ? `Invalid JSON: ${error.message}`
      : 'Failed to parse JSON'
    return {
      success: false,
      errors: [{ path: 'root', message }],
    }
  }

  // Step 2: Ensure it has Components array wrapper
  if (typeof parsed !== 'object' || parsed === null || !('Components' in parsed)) {
    return {
      success: false,
      errors: [{ path: 'root', message: 'Expected object with "Components" array' }],
    }
  }

  const componentsArray = (parsed as { Components: unknown }).Components
  if (!Array.isArray(componentsArray)) {
    return {
      success: false,
      errors: [{ path: 'Components', message: 'Expected "Components" to be an array' }],
    }
  }

  // Step 3: Validate each component individually
  const result = validateComponentsIndividually(componentsArray)

  return { success: true, data: result }
}
