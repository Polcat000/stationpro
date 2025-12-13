// src/components/charts/SeriesZoneChart.tsx
// Vertical bar chart showing zone counts per series for a selected face

import { useMemo, useCallback } from 'react'
import { ResponsiveBar } from '@nivo/bar'
import type { BarDatum, BarTooltipProps, ComputedDatum } from '@nivo/bar'
import type { InspectionFace } from '@/types/domain'
import { FACE_COLORS } from '@/lib/analysis/zoneAggregation'

// =============================================================================
// Types
// =============================================================================

export interface SeriesZoneChartProps {
  /** Zone count data per series */
  data: Record<string, number>
  /** The face being displayed (for color) */
  face: InspectionFace
  /** Optional height override (default 200px) */
  height?: number
}

interface NivoBarDatum extends BarDatum {
  series: string
  count: number
}

// =============================================================================
// Custom Tooltip
// =============================================================================

function createCustomTooltip(faceColor: string) {
  return function CustomTooltip({ data }: BarTooltipProps<NivoBarDatum>) {
    const barData = data as NivoBarDatum
    return (
      <div className="bg-popover text-popover-foreground border rounded px-3 py-2 shadow-md">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: faceColor }}
          />
          <span className="font-medium">{barData.series}</span>
        </div>
        <div className="text-sm mt-1">
          <span className="text-muted-foreground">Zones: </span>
          <span className="font-semibold">{barData.count}</span>
        </div>
      </div>
    )
  }
}

// =============================================================================
// Main Component
// =============================================================================

/**
 * Vertical bar chart showing zone count per series for a selected face.
 * All bars use the face's color from the palette.
 */
export function SeriesZoneChart({ data, face, height = 200 }: SeriesZoneChartProps) {
  const faceColor = FACE_COLORS[face]

  // Transform data for Nivo bar chart
  const chartData = useMemo((): NivoBarDatum[] => {
    return Object.entries(data)
      .filter(([, count]) => count > 0)
      .sort((a, b) => a[0].localeCompare(b[0])) // Sort by series name
      .map(([series, count]) => ({
        series,
        count,
      }))
  }, [data])

  // Color function: all bars use face color
  const getBarColor = useCallback(
    (_datum: ComputedDatum<NivoBarDatum>) => faceColor,
    [faceColor]
  )

  // Create tooltip with face color
  const CustomTooltip = useMemo(() => createCustomTooltip(faceColor), [faceColor])

  // Empty state
  if (chartData.length === 0) {
    return null
  }

  return (
    <div
      className="bg-muted rounded-lg"
      style={{ height }}
      data-testid="series-zone-chart"
    >
      <ResponsiveBar<NivoBarDatum>
        data={chartData}
        keys={['count']}
        indexBy="series"
        layout="vertical"
        margin={{ top: 20, right: 20, bottom: 40, left: 60 }}
        padding={0.3}
        valueScale={{ type: 'linear' }}
        indexScale={{ type: 'band', round: true }}
        colors={getBarColor}
        borderRadius={2}
        axisTop={null}
        axisRight={null}
        axisBottom={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: chartData.length > 4 ? -45 : 0,
        }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: 'Zones',
          legendPosition: 'middle',
          legendOffset: -50,
          tickValues: 'every 1',
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
                fill: 'var(--muted-foreground)',
                fontSize: 11,
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
        ariaLabel={`Bar chart showing ${face} zone counts by series: ${chartData.map((d) => `${d.series}: ${d.count}`).join(', ')}`}
      />
    </div>
  )
}
