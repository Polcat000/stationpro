// src/components/charts/BoxPlotChart.tsx
// Box plot chart component using Nivo for multi-series distribution visualization
// AC-3.7a.1: Box plots with IQR, whiskers, median, outliers
// AC-3.7a.4: Outlier detection using 1.5x IQR
// AC-3.7a.6: Theme compliance with CSS variables

import { useMemo, useCallback, useRef, useState } from 'react'
import { ResponsiveBoxPlot } from '@nivo/boxplot'
import type {
  BoxPlotCustomLayerProps,
  BoxPlotDatum,
  ComputedBoxPlotSummary,
  BoxPlotTooltipProps,
} from '@nivo/boxplot'
import type { BoxPlotDimensionData } from '@/hooks/useBoxPlotDistribution'
import type { Dimension, OutlierPoint } from '@/lib/analysis/boxPlotStats'

// =============================================================================
// Types
// =============================================================================

export interface BoxPlotChartProps {
  /** Box plot data for this dimension */
  data: BoxPlotDimensionData
  /** Dimension being displayed */
  dimension: Dimension
  /** Callback when a series box is clicked (for drill-down) */
  onSeriesClick?: (seriesName: string) => void
  /** Optional height override (default 250px) */
  height?: number
}

// =============================================================================
// Constants
// =============================================================================

/**
 * Color scale configuration for part-count-driven coloring.
 * Uses OKLCH for perceptually uniform lightness interpolation.
 * Lightness range: 0.75 (lightest, fewest parts) to 0.50 (darkest, most parts)
 * Chroma and Hue match the theme's green palette (~144 hue).
 */
const COLOR_SCALE = {
  /** Lightness for series with fewest parts (lighter = less data) */
  lightnessMax: 0.65,
  /** Lightness for series with most parts (darker = more data, but not too dark) */
  lightnessMin: 0.50,
  /** Chroma (saturation) - consistent across scale */
  chroma: 0.15,
  /** Hue - green from theme */
  hue: 144,
}

/** Outlier color using destructive theme variable */
const OUTLIER_COLOR = 'var(--destructive)'

/** Dimension labels for display */
const DIMENSION_LABELS: Record<Dimension, string> = {
  width: 'Width',
  height: 'Height',
  length: 'Length',
}

/** Width per series box for scroll calculation */
const BOX_WIDTH_PX = 80

/** Maximum visible series before horizontal scroll */
const MAX_VISIBLE_SERIES = 10

// =============================================================================
// Custom Outlier Layer
// =============================================================================

interface OutlierLayerProps<RawDatum extends BoxPlotDatum>
  extends BoxPlotCustomLayerProps<RawDatum> {
  /** Pre-computed series stats with IQR-based outliers */
  seriesOutliers: Map<string, OutlierPoint[]>
  /** Callback when outlier is hovered */
  onOutlierHover?: (outlier: OutlierPoint | null, event: React.MouseEvent) => void
}

/**
 * Custom Nivo layer for rendering IQR-based outlier dots.
 * Nivo's built-in whiskers use quantile positions (we configure to 0th/100th percentile).
 * We render our own outlier dots using pre-computed 1.5×IQR stats from boxPlotStats.ts.
 */
function OutlierLayer<RawDatum extends BoxPlotDatum>({
  boxPlots,
  yScale,
  seriesOutliers,
  onOutlierHover,
}: OutlierLayerProps<RawDatum>) {
  return (
    <g>
      {boxPlots.map((boxPlot) => {
        const outliers = seriesOutliers.get(boxPlot.group) || []
        if (outliers.length === 0) return null

        // Center X of this box
        const centerX = boxPlot.x + boxPlot.width / 2

        return outliers.map((outlier, idx) => {
          // Y position based on value scale
          const y = (yScale as (value: number) => number)(outlier.value)

          return (
            <circle
              key={`${boxPlot.group}-outlier-${idx}`}
              cx={centerX}
              cy={y}
              r={5}
              fill={OUTLIER_COLOR}
              stroke="var(--background)"
              strokeWidth={1.5}
              style={{ cursor: 'pointer' }}
              onMouseEnter={(e) => onOutlierHover?.(outlier, e)}
              onMouseLeave={(e) => onOutlierHover?.(null, e)}
              data-testid={`outlier-${outlier.partCallout}`}
            />
          )
        })
      })}
    </g>
  )
}

// =============================================================================
// Custom Tooltip
// =============================================================================

/**
 * Custom tooltip for box plot hover.
 * Shows series name, median, IQR, and part count.
 */
function CustomTooltip({ formatted, color, label }: BoxPlotTooltipProps) {
  return (
    <div className="bg-popover text-popover-foreground border rounded px-3 py-2 shadow-md min-w-[140px]">
      <div className="flex items-center gap-2 mb-1">
        <div
          className="w-3 h-3 rounded-sm"
          style={{ backgroundColor: color }}
        />
        <span className="font-medium">{label}</span>
      </div>
      <div className="text-sm space-y-0.5">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Median:</span>
          <span>{formatted.values[2]} mm</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Q1:</span>
          <span>{formatted.values[1]} mm</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Q3:</span>
          <span>{formatted.values[3]} mm</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Parts:</span>
          <span>{formatted.n}</span>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// Outlier Tooltip
// =============================================================================

interface OutlierTooltipState {
  outlier: OutlierPoint
  x: number
  y: number
}

/**
 * Floating tooltip for outlier hover.
 */
function OutlierTooltip({ state }: { state: OutlierTooltipState }) {
  return (
    <div
      className="fixed bg-popover text-popover-foreground border rounded px-3 py-2 shadow-md z-50 pointer-events-none"
      style={{
        left: state.x + 10,
        top: state.y - 10,
        transform: 'translateY(-100%)',
      }}
    >
      <div className="font-medium text-destructive">{state.outlier.partCallout}</div>
      <div className="text-sm">
        <span className="text-muted-foreground">Value: </span>
        <span>{state.outlier.value.toFixed(2)} mm</span>
      </div>
      <div className="text-xs text-destructive mt-1">Outlier (beyond 1.5x IQR)</div>
    </div>
  )
}

// =============================================================================
// Main Component
// =============================================================================

/**
 * Box plot chart component for multi-series distribution visualization.
 *
 * Per AC-3.7a.1:
 * - One box per series along X-axis
 * - Dimension value (mm) on Y-axis
 * - Box showing IQR (Q1-Q3)
 * - Whiskers extending to 1.5x IQR bounds
 * - Median line visible
 * - Outliers as individual dots
 *
 * Per AC-3.7a.1 (scrolling):
 * - Horizontally scrollable if >10 series
 *
 * @example
 * function DistributionView() {
 *   const { widthData } = useBoxPlotDistribution()
 *   return (
 *     <BoxPlotChart
 *       data={widthData}
 *       dimension="width"
 *       onSeriesClick={(series) => console.log('Drill down to', series)}
 *     />
 *   )
 * }
 */
export function BoxPlotChart({
  data,
  dimension,
  onSeriesClick,
  height = 250,
}: BoxPlotChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [outlierTooltip, setOutlierTooltip] = useState<OutlierTooltipState | null>(null)

  // Build outlier map from pre-computed series stats
  const seriesOutliers = useMemo(() => {
    const map = new Map<string, OutlierPoint[]>()
    for (const stats of data.seriesStats) {
      if (stats.outliers.length > 0) {
        map.set(stats.seriesName, stats.outliers)
      }
    }
    return map
  }, [data.seriesStats])

  // Build color map for series based on part count
  // Darker = more parts (more statistical weight), Lighter = fewer parts
  const seriesColorMap = useMemo(() => {
    const map = new Map<string, string>()

    // Get part counts per series
    const partCounts = data.seriesStats.map((s) => s.n)
    const minCount = Math.min(...partCounts)
    const maxCount = Math.max(...partCounts)
    const countRange = maxCount - minCount

    data.seriesStats.forEach((stats) => {
      // Normalize part count to 0-1 range (0 = fewest, 1 = most)
      const normalized = countRange > 0
        ? (stats.n - minCount) / countRange
        : 0.5 // Single series or all equal counts

      // Map to lightness: more parts = darker (lower lightness)
      const lightness = COLOR_SCALE.lightnessMax -
        (normalized * (COLOR_SCALE.lightnessMax - COLOR_SCALE.lightnessMin))

      map.set(stats.seriesName, `oklch(${lightness} ${COLOR_SCALE.chroma} ${COLOR_SCALE.hue})`)
    })

    return map
  }, [data.seriesStats])

  // Handle series click for drill-down
  const handleClick = useCallback(
    (datum: ComputedBoxPlotSummary) => {
      onSeriesClick?.(datum.group)
    },
    [onSeriesClick]
  )

  // Handle outlier hover
  const handleOutlierHover = useCallback(
    (outlier: OutlierPoint | null, event: React.MouseEvent) => {
      if (outlier) {
        setOutlierTooltip({
          outlier,
          x: event.clientX,
          y: event.clientY,
        })
      } else {
        setOutlierTooltip(null)
      }
    },
    []
  )

  // Calculate chart width for scrolling
  const seriesCount = data.seriesNames.length
  const needsScroll = seriesCount > MAX_VISIBLE_SERIES
  const chartWidth = needsScroll ? seriesCount * BOX_WIDTH_PX : undefined

  // Empty state
  if (data.data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-muted-foreground bg-muted rounded-lg"
        style={{ height }}
        data-testid={`${dimension}-boxplot-empty`}
      >
        No data for {DIMENSION_LABELS[dimension].toLowerCase()} distribution
      </div>
    )
  }

  // Custom layer with our outliers
  const OutlierLayerWithData = (props: BoxPlotCustomLayerProps<BoxPlotDatum>) => (
    <OutlierLayer
      {...props}
      seriesOutliers={seriesOutliers}
      onOutlierHover={handleOutlierHover}
    />
  )

  const chartContent = (
    <ResponsiveBoxPlot
      data={data.data as unknown as BoxPlotDatum[]}
      groupBy="group"
      value="value"
      layout="vertical"
      minValue="auto"
      maxValue="auto"
      padding={0.3}
      innerPadding={0.1}
      // Use min/max for whiskers (0th and 100th percentile) instead of Nivo's default 10th/90th
      // This aligns with our 1.5×IQR outlier detection where whiskers extend to actual min/max
      // when no outliers exist. Our custom OutlierLayer handles rendering outlier dots.
      quantiles={[0, 0.25, 0.5, 0.75, 1]}
      margin={{ top: 20, right: 20, bottom: 60, left: 70 }}
      colors={(datum) => seriesColorMap.get(datum.group) || `oklch(${COLOR_SCALE.lightnessMax} ${COLOR_SCALE.chroma} ${COLOR_SCALE.hue})`}
      colorBy="group"
      borderRadius={2}
      borderWidth={0}
      medianWidth={3}
      medianColor={{ from: 'color', modifiers: [['darker', 0.5]] }}
      whiskerWidth={2}
      whiskerEndSize={0.6}
      whiskerColor={{ from: 'color', modifiers: [['darker', 0.3]] }}
      axisBottom={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
        legend: 'Series',
        legendPosition: 'middle',
        legendOffset: 40,
      }}
      axisLeft={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
        legend: `${DIMENSION_LABELS[dimension]} (mm)`,
        legendPosition: 'middle',
        legendOffset: -50,
        format: (v) => `${v}`,
      }}
      enableGridY={true}
      enableGridX={false}
      isInteractive={true}
      tooltip={CustomTooltip}
      onClick={handleClick}
      layers={['grid', 'axes', 'boxPlots', OutlierLayerWithData, 'annotations', 'legends']}
      theme={{
        translation: {},
        axis: {
          ticks: {
            text: {
              fill: 'var(--muted-foreground)',
              fontSize: 11,
              fontWeight: 500,
            },
          },
          legend: {
            text: {
              fill: 'var(--muted-foreground)',
              fontSize: 12,
              fontWeight: 600,
            },
          },
        },
        grid: {
          line: {
            stroke: 'var(--border)',
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
      ariaLabel={`Box plot showing ${DIMENSION_LABELS[dimension]} distribution across ${seriesCount} series`}
    />
  )

  return (
    <div className="relative" data-testid={`${dimension}-boxplot`}>
      {/* Scrollable container if many series */}
      <div
        ref={containerRef}
        className={needsScroll ? 'overflow-x-auto' : ''}
        style={{ height }}
      >
        <div
          className="bg-muted rounded-lg"
          style={{
            height: '100%',
            width: chartWidth,
            minWidth: '100%',
          }}
        >
          {chartContent}
        </div>
      </div>

      {/* Scroll hint */}
      {needsScroll && (
        <div className="absolute right-2 top-2 text-xs text-muted-foreground bg-muted/80 px-2 py-1 rounded">
          Scroll to see all {seriesCount} series
        </div>
      )}

      {/* Outlier tooltip (rendered outside scroll container) */}
      {outlierTooltip && <OutlierTooltip state={outlierTooltip} />}
    </div>
  )
}
