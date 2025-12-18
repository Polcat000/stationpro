// src/components/analysis/AggregateStatsPanel.tsx
// Component for displaying aggregate statistics across working set parts
// AC 3.5.1, 3.5.2, 3.5.4, 3.5.5: Statistics display with empty/single-part handling
// Story 3.14 AC3: Loading state pattern for worker-backed calculations

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { useAggregateStats } from '@/hooks/useAggregateStats'
import type { DimensionStats, AggregateStatistics } from '@/lib/analysis/statistics'

// =============================================================================
// Formatting Utilities
// =============================================================================

/**
 * Formats a numeric value with specified decimal places
 */
function formatValue(value: number, decimals: number = 2): string {
  return value.toFixed(decimals)
}

/**
 * Formats standard deviation, showing N/A for null values (single part case)
 * AC 3.5.5: Single part shows N/A for Std Dev
 */
function formatStdDev(stdDev: number | null, unit: string): string {
  if (stdDev === null) return 'N/A'
  return `${formatValue(stdDev)} ${unit}`
}

// =============================================================================
// Sub-Components
// =============================================================================

interface DimensionRowProps {
  label: string
  stats: DimensionStats
  unit: string
}

/**
 * Renders a single dimension row with all 6 statistics
 * AC 3.5.1: Count, Min, Max, Mean, Median, Std Dev
 */
function DimensionRow({ label, stats, unit }: DimensionRowProps) {
  return (
    <tr className="border-b last:border-b-0">
      <td className="py-2 pr-4 font-medium">{label}</td>
      <td className="py-2 px-2 text-right tabular-nums">{stats.count}</td>
      <td className="py-2 px-2 text-right tabular-nums">
        {formatValue(stats.min)} {unit}
      </td>
      <td className="py-2 px-2 text-right tabular-nums">
        {formatValue(stats.max)} {unit}
      </td>
      <td className="py-2 px-2 text-right tabular-nums">
        {formatValue(stats.mean)} {unit}
      </td>
      <td className="py-2 px-2 text-right tabular-nums">
        {formatValue(stats.median)} {unit}
      </td>
      <td className="py-2 pl-2 text-right tabular-nums">
        {formatStdDev(stats.stdDev, unit)}
      </td>
    </tr>
  )
}

// =============================================================================
// Content Component (for CollapsiblePanel wrapper)
// =============================================================================

interface AggregateStatsPanelContentInnerProps {
  stats: AggregateStatistics | null
  isLoading: boolean
  isCalculating: boolean
  isEmpty: boolean
}

/**
 * Inner content component without Card wrapper.
 * Used by both AggregateStatsPanelContent and AggregateStatsPanelStandalone.
 *
 * Story 3.14 AC3: Shows subtle loading indicator during worker calculation.
 */
function AggregateStatsPanelContentInner({
  stats,
  isLoading,
  isCalculating,
  isEmpty,
}: AggregateStatsPanelContentInnerProps) {
  // Loading state (initial data fetch)
  if (isLoading) {
    return <p className="text-muted-foreground">Loading...</p>
  }

  // Empty state (AC 3.5.4)
  if (isEmpty || !stats) {
    return (
      <p className="text-muted-foreground">Select parts to view statistics</p>
    )
  }

  // Statistics display (AC 3.5.1, 3.5.2)
  // Story 3.14 AC3: Relative positioning for calculating overlay
  return (
    <div className="relative overflow-x-auto">
      {/* Calculating indicator - subtle overlay with spinner */}
      {isCalculating && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center bg-background/50"
          aria-label="Calculating statistics"
        >
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}
      <table
        className="w-full text-sm"
        aria-label="Aggregate statistics for selected parts"
      >
        <thead>
          <tr className="border-b text-muted-foreground">
            <th className="py-2 pr-4 text-left font-medium">Dimension</th>
            <th className="py-2 px-2 text-right font-medium">Count</th>
            <th className="py-2 px-2 text-right font-medium">Min</th>
            <th className="py-2 px-2 text-right font-medium">Max</th>
            <th className="py-2 px-2 text-right font-medium">Mean</th>
            <th className="py-2 px-2 text-right font-medium">Median</th>
            <th className="py-2 pl-2 text-right font-medium">Std Dev</th>
          </tr>
        </thead>
        <tbody>
          {/* AC 3.5.2: All four dimensions */}
          <DimensionRow label="Width" stats={stats.width} unit="mm" />
          <DimensionRow label="Height" stats={stats.height} unit="mm" />
          <DimensionRow label="Length" stats={stats.length} unit="mm" />
          <DimensionRow
            label="Smallest Feature"
            stats={stats.smallestFeature}
            unit="µm"
          />
        </tbody>
      </table>
    </div>
  )
}

/**
 * Content-only component for use with CollapsiblePanel wrapper.
 * Uses the useAggregateStats hook internally.
 */
export function AggregateStatsPanelContent() {
  const { stats, isLoading, isCalculating, isEmpty } = useAggregateStats()

  return (
    <AggregateStatsPanelContentInner
      stats={stats}
      isLoading={isLoading}
      isCalculating={isCalculating}
      isEmpty={isEmpty}
    />
  )
}

// =============================================================================
// Standalone Component (for testing)
// =============================================================================

export interface AggregateStatsPanelStandaloneProps {
  stats: AggregateStatistics | null
  isLoading: boolean
  isCalculating?: boolean
  isEmpty: boolean
}

/**
 * Standalone component that accepts props directly (for testing without hook)
 * Story 3.14 AC3: Supports isCalculating prop for loading indicator
 */
export function AggregateStatsPanelStandalone({
  stats,
  isLoading,
  isCalculating = false,
  isEmpty,
}: AggregateStatsPanelStandaloneProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Aggregate Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <AggregateStatsPanelContentInner
          stats={stats}
          isLoading={isLoading}
          isCalculating={isCalculating}
          isEmpty={isEmpty}
        />
      </CardContent>
    </Card>
  )
}

// =============================================================================
// Main Component (with hook)
// =============================================================================

/**
 * Main component that uses the useAggregateStats hook
 * AC 3.5.3: Auto-update on working set change (via hook)
 * Story 3.14 AC3: Loading state pattern with isCalculating
 */
export function AggregateStatsPanel() {
  const { stats, isLoading, isCalculating, isEmpty } = useAggregateStats()

  return (
    <AggregateStatsPanelStandalone
      stats={stats}
      isLoading={isLoading}
      isCalculating={isCalculating}
      isEmpty={isEmpty}
    />
  )
}
