// src/lib/schemas/part.ts
// Zod schemas for Part and InspectionZone
// Canonical reference: docs/active/data-schemas.md

import { z } from 'zod'

/**
 * Inspection zone face enum - which side of the part to inspect
 */
export const inspectionFaceSchema = z.enum([
  'Top',
  'Bottom',
  'Front',
  'Back',
  'Left',
  'Right',
])

export type InspectionFace = z.infer<typeof inspectionFaceSchema>

/**
 * InspectionZone schema
 * Uses center-plane offset model:
 * - ZoneOffset_mm: distance from part face to zone center (non-negative)
 * - ZoneDepth_mm: thickness of zone (positive, extends ±ZoneDepth_mm/2 from center)
 */
export const inspectionZoneSchema = z.object({
  ZoneID: z.string().min(1, 'Zone ID is required'),
  Name: z.string().min(1, 'Zone name is required'),
  Face: inspectionFaceSchema,
  ZoneDepth_mm: z.number().positive('Zone depth must be positive'),
  ZoneOffset_mm: z.number().nonnegative('Zone offset must be non-negative'),
  SmallestLateralFeature_um: z.number().positive().optional(),
  SmallestDepthFeature_um: z.number().positive().optional(),
  RequiredCoverage_pct: z.number().min(0).max(100).default(100),
  MinPixelsPerFeature: z.number().int().positive().default(3),
})

export type InspectionZone = z.infer<typeof inspectionZoneSchema>

/**
 * Form input schema for InspectionZone - no .default() values
 * Used with react-hook-form where defaults are provided via defaultValues prop.
 * This avoids Zod 4.1 + @hookform/resolvers type mismatch on input/output types.
 */
export const inspectionZoneFormSchema = z.object({
  ZoneID: z.string().min(1, 'Zone ID is required'),
  Name: z.string().min(1, 'Zone name is required'),
  Face: inspectionFaceSchema,
  ZoneDepth_mm: z.number().positive('Zone depth must be positive'),
  ZoneOffset_mm: z.number().nonnegative('Zone offset must be non-negative'),
  SmallestLateralFeature_um: z.number().positive().optional(),
  SmallestDepthFeature_um: z.number().positive().optional(),
  RequiredCoverage_pct: z.number().min(0).max(100).optional(),
  MinPixelsPerFeature: z.number().int().positive().optional(),
})

export type InspectionZoneFormInput = z.infer<typeof inspectionZoneFormSchema>

/**
 * Part schema
 * Dimensions follow X/Y/Z axis convention:
 * - Width: X-axis
 * - Height: Y-axis
 * - Length: Z-axis (scan direction)
 */
export const partSchema = z.object({
  PartCallout: z.string().min(1, 'Part callout is required'),
  PartSeries: z.string().optional(),
  PartWidth_mm: z.number().positive('Width must be positive'),
  PartHeight_mm: z.number().positive('Height must be positive'),
  PartLength_mm: z.number().positive('Length must be positive'),
  SmallestLateralFeature_um: z.number().positive('Smallest lateral feature must be positive'),
  SmallestDepthFeature_um: z.number().positive().optional(),
  InspectionZones: z.array(inspectionZoneSchema).min(1, 'At least one inspection zone required'),
})

export type Part = z.infer<typeof partSchema>

/**
 * Form input schema for Part - uses inspectionZoneFormSchema
 * Used with react-hook-form to avoid Zod 4.1 type mismatch.
 */
export const partFormSchema = z.object({
  PartCallout: z.string().min(1, 'Part callout is required'),
  PartSeries: z.string().optional(),
  PartWidth_mm: z.number().positive('Width must be positive'),
  PartHeight_mm: z.number().positive('Height must be positive'),
  PartLength_mm: z.number().positive('Length must be positive'),
  SmallestLateralFeature_um: z.number().positive('Smallest lateral feature must be positive'),
  SmallestDepthFeature_um: z.number().positive().optional(),
  InspectionZones: z.array(inspectionZoneFormSchema).min(1, 'At least one inspection zone required'),
})

export type PartFormInput = z.infer<typeof partFormSchema>

/**
 * Parts import schema - for bulk JSON import
 * Parts are imported as a simple array
 */
export const partsImportSchema = z.array(partSchema)

export type PartsImport = z.infer<typeof partsImportSchema>
