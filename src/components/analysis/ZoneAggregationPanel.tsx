// src/components/analysis/ZoneAggregationPanel.tsx
// Component for displaying zone aggregation across working set parts
// AC-3.9.1 through AC-3.9.5: Zone counts, depth range, feature size, chart, empty state

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useZoneAggregation } from '@/hooks/useZoneAggregation'
import { FaceZoneChart } from '@/components/charts/FaceZoneChart'
import { SeriesZoneChart } from '@/components/charts/SeriesZoneChart'
import type { ZoneAggregation } from '@/lib/analysis/zoneAggregation'
import {
  FACE_ORDER,
  FACE_COLORS,
  aggregateByFace,
  countZonesBySeriesForFace,
} from '@/lib/analysis/zoneAggregation'
import type { InspectionFace, Part } from '@/types/domain'

// =============================================================================
// Formatting Utilities
// =============================================================================

/**
 * Formats depth value with 2 decimal places (AC-3.9.2)
 */
function formatDepth(value: number): string {
  return value.toFixed(2)
}

/**
 * Formats feature size in microns (AC-3.9.3)
 */
function formatFeatureSize(value: number): string {
  return `${Math.round(value)} µm`
}

/**
 * Formats zone counts per face as text summary (AC-3.9.1)
 * Example: "Top: 12, Front: 8, Back: 3"
 */
function formatZoneCounts(
  zonesByFace: Partial<Record<InspectionFace, number>>
): string {
  return FACE_ORDER.filter((face) => zonesByFace[face] !== undefined && zonesByFace[face]! > 0)
    .map((face) => `${face}: ${zonesByFace[face]}`)
    .join(', ')
}

// =============================================================================
// Face Selector Component
// =============================================================================

interface FaceSelectorProps {
  availableFaces: InspectionFace[]
  selectedFace: InspectionFace | null
  onFaceChange: (face: InspectionFace | null) => void
}

function FaceSelector({ availableFaces, selectedFace, onFaceChange }: FaceSelectorProps) {
  return (
    <div className="py-2 border-b">
      <span className="font-medium block mb-2">Zone Details by Face</span>
      <Select
        value={selectedFace ?? ''}
        onValueChange={(value) => onFaceChange(value === '' ? null : (value as InspectionFace))}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a face to view details..." />
        </SelectTrigger>
        <SelectContent>
          {availableFaces.map((face) => (
            <SelectItem key={face} value={face}>
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: FACE_COLORS[face] }}
                />
                {face}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

// =============================================================================
// Face-Specific Metrics Component
// =============================================================================

interface FaceMetricsProps {
  face: InspectionFace
  parts: Part[]
}

function FaceMetrics({ face, parts }: FaceMetricsProps) {
  const faceAggregation = useMemo(() => aggregateByFace(parts, face), [parts, face])
  const seriesData = useMemo(() => countZonesBySeriesForFace(parts, face), [parts, face])

  return (
    <div className="space-y-4 pt-2">
      {/* Face-specific depth range */}
      <div className="flex justify-between items-baseline py-2 border-b">
        <span className="font-medium">Depth Range</span>
        <span className="text-lg font-semibold">
          {faceAggregation.depthRange
            ? `${formatDepth(faceAggregation.depthRange.min)} – ${formatDepth(faceAggregation.depthRange.max)} mm`
            : 'N/A'}
        </span>
      </div>

      {/* Face-specific smallest lateral feature */}
      <div className="flex justify-between items-baseline py-2 border-b">
        <span className="font-medium">Smallest Lateral Feature</span>
        <span className="text-lg font-semibold">
          {faceAggregation.smallestLateral_um !== null
            ? formatFeatureSize(faceAggregation.smallestLateral_um)
            : 'N/A'}
        </span>
      </div>

      {/* Face-specific smallest depth feature */}
      <div className="flex justify-between items-baseline py-2 border-b">
        <span className="font-medium">Smallest Depth Feature</span>
        <span className="text-lg font-semibold">
          {faceAggregation.smallestDepth_um !== null
            ? formatFeatureSize(faceAggregation.smallestDepth_um)
            : 'N/A'}
        </span>
      </div>

      {/* Series distribution chart */}
      <div className="pt-2">
        <span className="font-medium block mb-2">Distribution by Series</span>
        {Object.keys(seriesData).length > 0 ? (
          <SeriesZoneChart data={seriesData} face={face} height={180} />
        ) : (
          <p className="text-sm text-muted-foreground">No zones for this face</p>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// Content Component (for CollapsiblePanel wrapper)
// =============================================================================

interface ZoneAggregationPanelContentInnerProps {
  aggregation: ZoneAggregation | null
  parts: Part[]
  isLoading: boolean
  isEmpty: boolean
}

/**
 * Inner content component without Card wrapper.
 * Supports face selection for detailed metrics.
 */
function ZoneAggregationPanelContentInner({
  aggregation,
  parts,
  isLoading,
  isEmpty,
}: ZoneAggregationPanelContentInnerProps) {
  const [selectedFace, setSelectedFace] = useState<InspectionFace | null>(null)

  // Get faces that have zones
  const availableFaces = useMemo(() => {
    if (!aggregation) return []
    return FACE_ORDER.filter(
      (face) => aggregation.zonesByFace[face] !== undefined && aggregation.zonesByFace[face]! > 0
    )
  }, [aggregation])

  // Loading state
  if (isLoading) {
    return <p className="text-muted-foreground">Loading...</p>
  }

  // Empty state (AC-3.9.5)
  if (isEmpty || !aggregation) {
    return <p className="text-muted-foreground">No inspection zones defined</p>
  }

  return (
    <div className="space-y-4">
      {/* Overall zone distribution - text summary (AC-3.9.1) */}
      <div className="py-2 border-b">
        <span className="font-medium block mb-1">Overall Zone Distribution</span>
        <span className="text-sm text-muted-foreground">
          {formatZoneCounts(aggregation.zonesByFace)}
        </span>
      </div>

      {/* Face zone bar chart (AC-3.9.4) */}
      <div className="py-2 border-b">
        <FaceZoneChart data={aggregation.zonesByFace} height={180} />
      </div>

      {/* Face selector dropdown */}
      <FaceSelector
        availableFaces={availableFaces}
        selectedFace={selectedFace}
        onFaceChange={setSelectedFace}
      />

      {/* Face-specific metrics when a face is selected */}
      {selectedFace && <FaceMetrics face={selectedFace} parts={parts} />}
    </div>
  )
}

/**
 * Content-only component for use with CollapsiblePanel wrapper.
 * Uses the useZoneAggregation hook internally.
 */
export function ZoneAggregationPanelContent() {
  const { aggregation, parts, isLoading, isEmpty } = useZoneAggregation()

  return (
    <ZoneAggregationPanelContentInner
      aggregation={aggregation}
      parts={parts}
      isLoading={isLoading}
      isEmpty={isEmpty}
    />
  )
}

// =============================================================================
// Standalone Component (for testing)
// =============================================================================

export interface ZoneAggregationPanelStandaloneProps {
  aggregation: ZoneAggregation | null
  isLoading: boolean
  isEmpty: boolean
}

/**
 * Standalone component that accepts props directly (for testing without hook)
 * Note: Does not support face selection - use ZoneAggregationPanel for full functionality
 */
export function ZoneAggregationPanelStandalone({
  aggregation,
  isLoading,
  isEmpty,
}: ZoneAggregationPanelStandaloneProps) {
  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Inspection Zone Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    )
  }

  // Empty state (AC-3.9.5)
  if (isEmpty || !aggregation) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Inspection Zone Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No inspection zones defined</p>
        </CardContent>
      </Card>
    )
  }

  // Aggregation display (overall view only for standalone)
  return (
    <Card>
      <CardHeader>
        <CardTitle>Inspection Zone Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall zone distribution - text summary (AC-3.9.1) */}
        <div className="py-2 border-b">
          <span className="font-medium block mb-1">Overall Zone Distribution</span>
          <span className="text-sm text-muted-foreground">
            {formatZoneCounts(aggregation.zonesByFace)}
          </span>
        </div>

        {/* Face zone bar chart (AC-3.9.4) */}
        <div className="pt-2">
          <FaceZoneChart data={aggregation.zonesByFace} height={180} />
        </div>
      </CardContent>
    </Card>
  )
}

// =============================================================================
// Main Component (with hook and face selection)
// =============================================================================

/**
 * Main component that uses the useZoneAggregation hook.
 * Auto-updates when working set changes.
 * Supports face selection for detailed metrics view.
 */
export function ZoneAggregationPanel() {
  const { aggregation, parts, isLoading, isEmpty } = useZoneAggregation()
  const [selectedFace, setSelectedFace] = useState<InspectionFace | null>(null)

  // Get faces that have zones
  const availableFaces = useMemo(() => {
    if (!aggregation) return []
    return FACE_ORDER.filter(
      (face) => aggregation.zonesByFace[face] !== undefined && aggregation.zonesByFace[face]! > 0
    )
  }, [aggregation])

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Inspection Zone Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    )
  }

  // Empty state (AC-3.9.5)
  if (isEmpty || !aggregation) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Inspection Zone Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No inspection zones defined</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inspection Zone Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall zone distribution - text summary (AC-3.9.1) */}
        <div className="py-2 border-b">
          <span className="font-medium block mb-1">Overall Zone Distribution</span>
          <span className="text-sm text-muted-foreground">
            {formatZoneCounts(aggregation.zonesByFace)}
          </span>
        </div>

        {/* Face zone bar chart (AC-3.9.4) */}
        <div className="py-2 border-b">
          <FaceZoneChart data={aggregation.zonesByFace} height={180} />
        </div>

        {/* Face selector dropdown */}
        <FaceSelector
          availableFaces={availableFaces}
          selectedFace={selectedFace}
          onFaceChange={setSelectedFace}
        />

        {/* Face-specific metrics when a face is selected */}
        {selectedFace && <FaceMetrics face={selectedFace} parts={parts} />}
      </CardContent>
    </Card>
  )
}
