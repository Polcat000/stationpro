// src/lib/schemas/helpers.ts
// Utility functions for schema transformations at import boundaries
// Canonical reference: docs/active/arch/forms.md

import { z } from 'zod'

/**
 * Transforms null values to undefined at import boundaries.
 *
 * Problem: JSON data often has explicit null values for optional fields,
 * but TypeScript/Zod idiom prefers undefined for optional fields.
 *
 * Solution: Use this wrapper ONLY in import schemas to accept null from JSON
 * while preserving clean `field?: T` types in the output.
 *
 * @example
 * // In import schema only:
 * SmallestDepthFeature_um: nullToUndefined(z.number().positive().optional())
 *
 * // Accepts: { SmallestDepthFeature_um: null } or { SmallestDepthFeature_um: 5 }
 * // Output type: { SmallestDepthFeature_um?: number }
 */
export function nullToUndefined<T extends z.ZodTypeAny>(schema: T) {
  return z
    .union([schema, z.null()])
    .transform((val): z.infer<T> => (val === null ? undefined : val) as z.infer<T>)
}

/**
 * Recursively converts null values to undefined in a plain object.
 * Use this as a pre-processing step before schema validation if you
 * prefer to transform the data rather than the schema.
 *
 * @example
 * const cleanedData = convertNullsToUndefined(jsonData)
 * const result = partSchema.safeParse(cleanedData)
 */
export function convertNullsToUndefined<T>(obj: T): T {
  if (obj === null) {
    return undefined as T
  }

  if (Array.isArray(obj)) {
    return obj.map(convertNullsToUndefined) as T
  }

  if (typeof obj === 'object' && obj !== null) {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj)) {
      result[key] = convertNullsToUndefined(value)
    }
    return result as T
  }

  return obj
}
