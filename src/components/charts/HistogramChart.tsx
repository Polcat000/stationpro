// src/components/charts/HistogramChart.tsx
// Histogram chart component using Nivo for single-series distribution visualization
// AC-3.7a.2: Histogram drill-down with bucketed bars
// AC-3.7a.5: Tooltip with bin range and part callouts
// AC-3.7a.6: Theme compliance with CSS variables

import { useMemo, useCallback } from 'react'
import { ResponsiveBar } from '@nivo/bar'
import type { BarDatum, BarTooltipProps, ComputedDatum } from '@nivo/bar'
import type { Dimension } from '@/lib/analysis/boxPlotStats'

// =============================================================================
// Bar Data Types
// =============================================================================

/**
 * Nivo-compliant bar datum with only string/number values.
 * Metadata (partCallouts, hasOutliers) stored externally in binMetadataMap.
 */
interface NivoBarDatum extends BarDatum {
  id: string
  binLabel: string
  count: number
  binStart: number
  binEnd: number
}

/**
 * Bin metadata stored externally to avoid Nivo type constraints.
 * Keyed by bin id (e.g., "bin-0", "bin-1").
 */
interface BinMetadata {
  partCallouts: string[]
  hasOutliers: boolean
}

// =============================================================================
// Types
// =============================================================================

/**
 * Data point for a histogram bin.
 * AC-3.7a.5: Includes part callouts for tooltip display.
 */
export interface HistogramBin {
  /** Bin start value (mm) */
  binStart: number
  /** Bin end value (mm) */
  binEnd: number
  /** Bin center for bar positioning */
  binCenter: number
  /** Number of parts in this bin */
  count: number
  /** Part callouts in this bin (for tooltip) */
  partCallouts: string[]
  /** Whether any part in this bin is an outlier */
  hasOutliers: boolean
  /** Display label for X-axis */
  binLabel: string
}

/**
 * Props for HistogramChart component.
 */
export interface HistogramChartProps {
  /** Histogram bin data */
  data: HistogramBin[]
  /** Dimension being displayed */
  dimension: Dimension
  /** Series name being displayed */
  seriesName: string
  /** Optional height override (default 250px) */
  height?: number
}

// =============================================================================
// Constants
// =============================================================================

/**
 * Bar color using CSS variable for theme compliance.
 * AC-3.7a.6: All colors use CSS variables.
 */
const BAR_COLOR = 'hsl(var(--chart-1))'

/**
 * Outlier bar color using destructive theme variable.
 * AC-3.7a.2: Outliers highlighted with destructive color.
 */
const OUTLIER_COLOR = 'hsl(var(--destructive))'

/** Dimension labels for display */
const DIMENSION_LABELS: Record<Dimension, string> = {
  width: 'Width',
  height: 'Height',
  length: 'Length',
}

/** Maximum parts to show individual callouts in tooltip */
const MAX_CALLOUTS_IN_TOOLTIP = 5

// =============================================================================
// Custom Tooltip Factory
// =============================================================================

/**
 * Creates a custom tooltip component with access to bin metadata.
 * AC-3.7a.5: Shows bin range, part count, and callouts for small bins.
 */
function createCustomTooltip(binMetadataMap: Map<string, BinMetadata>) {
  return function CustomTooltip({ data, value, color }: BarTooltipProps<NivoBarDatum>) {
    const binData = data as NivoBarDatum
    const metadata = binMetadataMap.get(binData.id) || { partCallouts: [], hasOutliers: false }
    const callouts = metadata.partCallouts
    const showAllCallouts = callouts.length <= MAX_CALLOUTS_IN_TOOLTIP

    return (
      <div className="bg-popover text-popover-foreground border rounded px-3 py-2 shadow-md min-w-[160px]">
        {/* Bin range */}
        <div className="font-medium mb-1">
          {binData.binStart.toFixed(1)} - {binData.binEnd.toFixed(1)} mm
        </div>

        {/* Part count */}
        <div className="flex items-center gap-2 text-sm mb-1">
          <div
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: color }}
          />
          <span>{value} part{value !== 1 ? 's' : ''}</span>
        </div>

        {/* Part callouts */}
        {callouts.length > 0 && (
          <div className="text-xs mt-2 pt-2 border-t">
            {showAllCallouts ? (
              <div className="space-y-0.5">
                {callouts.map((callout) => (
                  <div key={callout} className="text-muted-foreground">
                    {callout}
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-0.5">
                {callouts.slice(0, MAX_CALLOUTS_IN_TOOLTIP).map((callout) => (
                  <div key={callout} className="text-muted-foreground">
                    {callout}
                  </div>
                ))}
                <div className="text-muted-foreground italic">
                  +{callouts.length - MAX_CALLOUTS_IN_TOOLTIP} more parts
                </div>
              </div>
            )}
          </div>
        )}

        {/* Outlier indicator */}
        {metadata.hasOutliers && (
          <div className="text-xs text-destructive mt-1">
            Contains outliers
          </div>
        )}
      </div>
    )
  }
}

// =============================================================================
// Main Component
// =============================================================================

/**
 * Histogram chart component for single-series distribution visualization.
 *
 * Per AC-3.7a.2:
 * - Bucketed bars with configurable bin count
 * - X-axis showing dimension value ranges (bin edges)
 * - Y-axis showing part count per bin
 * - Outlier bins styled with destructive color
 *
 * Per AC-3.7a.5:
 * - Tooltip shows bin range, part count
 * - Part callouts shown for bins with ≤5 parts
 * - "X parts" summary for bins with >5 parts
 *
 * @example
 * function DistributionDrilldown({ seriesName }: { seriesName: string }) {
 *   const { bins } = useHistogramDistribution(seriesName)
 *   return (
 *     <HistogramChart
 *       data={bins}
 *       dimension="width"
 *       seriesName={seriesName}
 *     />
 *   )
 * }
 */
export function HistogramChart({
  data,
  dimension,
  seriesName,
  height = 250,
}: HistogramChartProps) {
  // Build external metadata map (like BoxPlotChart's seriesOutliers pattern)
  const binMetadataMap = useMemo(() => {
    const map = new Map<string, BinMetadata>()
    data.forEach((bin, index) => {
      map.set(`bin-${index}`, {
        partCallouts: bin.partCallouts,
        hasOutliers: bin.hasOutliers,
      })
    })
    return map
  }, [data])

  // Transform data for Nivo bar chart (only BarDatum-compliant fields)
  const chartData = useMemo((): NivoBarDatum[] => {
    return data.map((bin, index) => ({
      id: `bin-${index}`,
      binLabel: bin.binLabel,
      count: bin.count,
      binStart: bin.binStart,
      binEnd: bin.binEnd,
    }))
  }, [data])

  // Color function: lookup outlier status from external map
  const getBarColor = useCallback((datum: ComputedDatum<NivoBarDatum>) => {
    const metadata = binMetadataMap.get(datum.data.id)
    return metadata?.hasOutliers ? OUTLIER_COLOR : BAR_COLOR
  }, [binMetadataMap])

  // Create tooltip with access to metadata map
  const CustomTooltip = useMemo(() => createCustomTooltip(binMetadataMap), [binMetadataMap])

  // Empty state
  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-muted-foreground bg-muted rounded-lg"
        style={{ height }}
        data-testid={`${dimension}-histogram-empty`}
      >
        No data for {DIMENSION_LABELS[dimension].toLowerCase()} distribution
      </div>
    )
  }

  return (
    <div
      className="relative"
      data-testid={`${dimension}-histogram`}
      aria-label={`Histogram showing ${DIMENSION_LABELS[dimension]} distribution for ${seriesName}`}
    >
      <div
        className="bg-muted rounded-lg"
        style={{ height }}
      >
        <ResponsiveBar<NivoBarDatum>
          data={chartData}
          keys={['count']}
          indexBy="binLabel"
          margin={{ top: 20, right: 20, bottom: 50, left: 60 }}
          padding={0.1}
          valueScale={{ type: 'linear' }}
          indexScale={{ type: 'band', round: true }}
          colors={getBarColor}
          borderRadius={2}
          borderWidth={1}
          borderColor={{ from: 'color', modifiers: [['darker', 0.3]] }}
          axisTop={null}
          axisRight={null}
          axisBottom={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: data.length > 8 ? -45 : 0,
            legend: `${DIMENSION_LABELS[dimension]} (mm)`,
            legendPosition: 'middle',
            legendOffset: 40,
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: 'Part Count',
            legendPosition: 'middle',
            legendOffset: -50,
            format: (v) => Math.round(v as number),
          }}
          enableGridY={true}
          enableGridX={false}
          enableLabel={false}
          isInteractive={true}
          tooltip={CustomTooltip}
          theme={{
            axis: {
              ticks: {
                text: {
                  fill: 'hsl(var(--muted-foreground))',
                  fontSize: 11,
                },
              },
              legend: {
                text: {
                  fill: 'hsl(var(--muted-foreground))',
                  fontSize: 12,
                },
              },
            },
            grid: {
              line: {
                stroke: 'hsl(var(--border))',
                strokeWidth: 1,
              },
            },
            tooltip: {
              container: {
                background: 'transparent',
                boxShadow: 'none',
                padding: 0,
              },
            },
          }}
          role="img"
          ariaLabel={`Histogram showing ${DIMENSION_LABELS[dimension]} distribution for ${seriesName} with ${data.length} bins`}
        />
      </div>
    </div>
  )
}

// Re-export utility functions from histogramUtils for backwards compatibility
// eslint-disable-next-line react-refresh/only-export-components
export { createHistogramBins, DEFAULT_BIN_COUNT } from '@/lib/analysis/histogramUtils'
