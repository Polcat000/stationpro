// src/components/charts/DimensionalDistributionChart.tsx
// Bar chart for displaying dimensional distribution of parts
// AC 3.7.1: Charts rendered, AC 3.7.4: Hover tooltips, AC 3.7.5: Theme colors

import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import type { ChartDataPoint } from '@/hooks/useDimensionalDistribution'

// =============================================================================
// Types
// =============================================================================

export interface DimensionalDistributionChartProps {
  /** Chart data points to render */
  data: ChartDataPoint[]
  /** Dimension label for display (Width, Height, Length) */
  dimension: 'Width' | 'Height' | 'Length'
  /** Series names for color mapping */
  seriesNames: string[]
  /** Set of part IDs that are outliers (retained for API compatibility) */
  outlierPartIds?: Set<string>
}

// =============================================================================
// Constants
// =============================================================================

/**
 * Series colors using CSS variables from Nature theme.
 * AC 3.7.5: Charts use hsl(var(--chart-N)) for series colors.
 *
 * ROLLBACK: Uncomment SERIES_COLORS and revert Cell fill logic to use seriesColorMap
 */
// const SERIES_COLORS = [
//   'var(--chart-1)',
//   'var(--chart-2)',
//   'var(--chart-3)',
//   'var(--chart-4)',
//   'var(--chart-5)',
// ]

/**
 * 10-stop gradient scale from black to light green (theme-aligned).
 * Used for count-based bar coloring.
 */
const COUNT_GRADIENT_SCALE = [
  'oklch(0.15 0.02 144)',   // 0: near black
  'oklch(0.22 0.04 144)',   // 1
  'oklch(0.29 0.06 144)',   // 2
  'oklch(0.36 0.08 144)',   // 3
  'oklch(0.43 0.10 144)',   // 4
  'oklch(0.50 0.12 144)',   // 5
  'oklch(0.55 0.14 144)',   // 6
  'oklch(0.60 0.15 144)',   // 7
  'oklch(0.65 0.16 144)',   // 8
  'oklch(0.6731 0.1624 144.2083)',   // 9: chart-1 green
]

/**
 * Outlier color using destructive theme variable.
 * AC 3.7.5: Outlier highlight uses hsl(var(--destructive)).
 */
const OUTLIER_COLOR = 'var(--destructive)'

// =============================================================================
// Sub-Components
// =============================================================================

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ payload: ChartDataPoint }>
}

/**
 * Custom tooltip for distribution chart.
 * AC 3.7.4: Shows dimension value, count, series name, and outlier status.
 */
function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null

  const item = payload[0].payload
  return (
    <div className="bg-popover text-popover-foreground border rounded px-3 py-2 shadow-md">
      <div className="font-medium">{item.value.toFixed(2)} mm</div>
      <div className="text-sm text-muted-foreground">
        {item.count} part{item.count !== 1 ? 's' : ''}
      </div>
      <div className="text-sm">{item.series}</div>
      {item.partIds.length <= 3 && (
        <div className="text-xs text-muted-foreground mt-1">
          {item.partIds.join(', ')}
        </div>
      )}
      {item.isOutlier && (
        <div className="text-sm text-destructive font-medium mt-1">Outlier</div>
      )}
    </div>
  )
}

// =============================================================================
// Main Component
// =============================================================================

/**
 * Dimensional distribution bar chart component.
 * Renders a Recharts BarChart with series coloring and outlier highlighting.
 *
 * Per architecture (docs/active/arch/visualization.md):
 * - Uses Recharts only (no Plotly/D3)
 * - Wrapped in ResponsiveContainer
 * - Uses CSS variables for colors
 * - Data transformations memoized
 */
export function DimensionalDistributionChart({
  data,
  dimension,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  seriesNames: _seriesNames,
  // outlierPartIds is available for future use but isOutlier flag on data is used directly
}: DimensionalDistributionChartProps) {
  // _seriesNames kept for API compatibility and rollback to series-based coloring
  // ROLLBACK: Uncomment seriesColorMap for series-based coloring
  // const seriesColorMap = useMemo(() => {
  //   const map = new Map<string, string>()
  //   seriesNames.forEach((name, index) => {
  //     map.set(name, SERIES_COLORS[index % SERIES_COLORS.length])
  //   })
  //   return map
  // }, [seriesNames])

  // Compute min/max counts for gradient tier assignment
  const { minCount, maxCount } = useMemo(() => {
    const counts = data.map((d) => d.count)
    return {
      minCount: Math.min(...counts),
      maxCount: Math.max(...counts),
    }
  }, [data])

  // Get gradient color for a given count
  const getCountColor = (count: number): string => {
    if (maxCount === minCount) return COUNT_GRADIENT_SCALE[9] // All same count → use brightest
    const ratio = (count - minCount) / (maxCount - minCount)
    const tier = Math.min(9, Math.floor(ratio * 10))
    return COUNT_GRADIENT_SCALE[tier]
  }

  // Empty state (AC 3.7.1: clear message when no data)
  if (data.length === 0) {
    return (
      <div className="h-[200px] flex items-center justify-center text-muted-foreground">
        Select parts to view {dimension.toLowerCase()} distribution
      </div>
    )
  }

  return (
    <div className="h-[200px] rounded-lg overflow-hidden" data-testid={`${dimension.toLowerCase()}-chart`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 30, right: 10, left: 20, bottom: 20 }}
          style={{ backgroundColor: 'var(--muted)' }}
        >
          <XAxis
            dataKey="value"
            tickFormatter={(v: number) => `${v.toFixed(1)}`}
            label={{
              value: `${dimension} (mm)`,
              position: 'bottom',
              offset: 0,
              style: { fill: 'hsl(var(--muted-foreground))' },
            }}
            stroke="hsl(var(--muted-foreground))"
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          <YAxis
            allowDecimals={false}
            label={{
              value: 'Part Count',
              angle: -90,
              position: 'insideLeft',
              offset: 10,
              style: { fill: 'hsl(var(--muted-foreground))', textAnchor: 'middle' },
            }}
            stroke="hsl(var(--muted-foreground))"
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {/* ROLLBACK: Replace getCountColor(entry.count) with seriesColorMap.get(entry.series) || SERIES_COLORS[0] */}
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.isOutlier ? OUTLIER_COLOR : getCountColor(entry.count)}
                stroke={entry.isOutlier ? OUTLIER_COLOR : 'transparent'}
                strokeWidth={entry.isOutlier ? 2 : 0}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
