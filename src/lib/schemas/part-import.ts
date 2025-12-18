// src/lib/schemas/part-import.ts
// Import-specific schemas that handle null values from JSON data
// Canonical reference: docs/active/arch/forms.md#JSON-Import-Pattern
//
// Architecture Decision:
// JSON data often contains explicit null values for optional fields.
// TypeScript/Zod idiom prefers undefined for optional fields (field?: T).
// This module provides schemas that accept null at the import boundary
// and transform to undefined, keeping internal types clean.

import { z } from 'zod'
import { inspectionFaceSchema, type Part, type InspectionZone } from './part'
import { convertNullsToUndefined } from './helpers'

/**
 * InspectionZone schema for import - accepts null for optional fields
 * Transforms null → undefined to match internal Part type
 */
export const inspectionZoneImportSchema = z.object({
  ZoneID: z.string().min(1, 'Zone ID is required'),
  Name: z.string().min(1, 'Zone name is required'),
  Face: inspectionFaceSchema,
  ZoneDepth_mm: z.number().positive('Zone depth must be positive'),
  ZoneOffset_mm: z.number().nonnegative('Zone offset must be non-negative'),
  SmallestLateralFeature_um: z.number().positive().nullable().optional()
    .transform((val): number | undefined => val ?? undefined),
  SmallestDepthFeature_um: z.number().positive().nullable().optional()
    .transform((val): number | undefined => val ?? undefined),
  RequiredCoverage_pct: z.number().min(0).max(100).nullable().optional()
    .transform((val): number => val ?? 100),
  MinPixelsPerFeature: z.number().int().positive().nullable().optional()
    .transform((val): number => val ?? 3),
})

/**
 * Part schema for import - accepts null for optional fields
 * Transforms null → undefined to match internal Part type
 */
export const partImportSchema = z.object({
  PartCallout: z.string().min(1, 'Part callout is required'),
  PartSeries: z.string().nullable().optional()
    .transform((val): string | undefined => val ?? undefined),
  PartFamily: z.string().nullable().optional()
    .transform((val): string | undefined => val ?? undefined),
  PartWidth_mm: z.number().positive('Width must be positive'),
  PartHeight_mm: z.number().positive('Height must be positive'),
  PartLength_mm: z.number().positive('Length must be positive'),
  SmallestLateralFeature_um: z.number().positive('Smallest lateral feature must be positive'),
  SmallestDepthFeature_um: z.number().positive().nullable().optional()
    .transform((val): number | undefined => val ?? undefined),
  InspectionZones: z.array(inspectionZoneImportSchema).min(1, 'At least one inspection zone required'),
})

/**
 * Array schema for bulk import
 */
export const partsImportBulkSchema = z.array(partImportSchema)

/**
 * Alternative approach: Pre-process raw JSON to convert nulls before validation.
 * Use this with the standard partSchema if you prefer data transformation
 * over schema transformation.
 *
 * @example
 * const cleanedData = preprocessImportData(rawJsonData)
 * const result = partsImportSchema.safeParse(cleanedData)
 */
export function preprocessImportData<T>(data: T): T {
  return convertNullsToUndefined(data)
}

export type { Part, InspectionZone }
