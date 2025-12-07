// src/components/analysis/AggregateStatsPanel.tsx
// Component for displaying aggregate statistics across working set parts
// AC 3.5.1, 3.5.2, 3.5.4, 3.5.5: Statistics display with empty/single-part handling

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
// Standalone Component (for testing)
// =============================================================================

export interface AggregateStatsPanelStandaloneProps {
  stats: AggregateStatistics | null
  isLoading: boolean
  isEmpty: boolean
}

/**
 * Standalone component that accepts props directly (for testing without hook)
 */
export function AggregateStatsPanelStandalone({
  stats,
  isLoading,
  isEmpty,
}: AggregateStatsPanelStandaloneProps) {
  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Aggregate Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    )
  }

  // Empty state (AC 3.5.4)
  if (isEmpty || !stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Aggregate Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Select parts to view statistics
          </p>
        </CardContent>
      </Card>
    )
  }

  // Statistics display (AC 3.5.1, 3.5.2)
  return (
    <Card>
      <CardHeader>
        <CardTitle>Aggregate Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
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
 */
export function AggregateStatsPanel() {
  const { stats, isLoading, isEmpty } = useAggregateStats()

  return (
    <AggregateStatsPanelStandalone
      stats={stats}
      isLoading={isLoading}
      isEmpty={isEmpty}
    />
  )
}
