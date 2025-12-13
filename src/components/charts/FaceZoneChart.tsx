// src/components/charts/FaceZoneChart.tsx
// Vertical bar chart showing zone counts per inspection face
// AC-3.9.4: Visual breakdown with face color palette and tooltips

import { useMemo, useCallback } from 'react'
import { ResponsiveBar } from '@nivo/bar'
import type { BarDatum, BarTooltipProps, ComputedDatum } from '@nivo/bar'
import type { InspectionFace } from '@/types/domain'
import { FACE_COLORS, FACE_ORDER } from '@/lib/analysis/zoneAggregation'

// =============================================================================
// Types
// =============================================================================

export interface FaceZoneChartProps {
  /** Zone count data per face */
  data: Partial<Record<InspectionFace, number>>
  /** Optional height override (default 200px) */
  height?: number
}

/**
 * Nivo-compliant bar datum with only string/number values.
 * Colors stored externally in colorMap for type safety.
 */
interface NivoBarDatum extends BarDatum {
  face: string
  count: number
}

// =============================================================================
// Custom Tooltip Factory
// =============================================================================

/**
 * Creates a custom tooltip component with access to color map.
 * AC-3.9.4: Shows face name and exact zone count.
 */
function createCustomTooltip(colorMap: Map<string, string>) {
  return function CustomTooltip({ data, color }: BarTooltipProps<NivoBarDatum>) {
    const barData = data as NivoBarDatum
    const faceColor = colorMap.get(barData.face) || color
    return (
      <div className="bg-popover text-popover-foreground border rounded px-3 py-2 shadow-md">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: faceColor }}
          />
          <span className="font-medium">{barData.face}</span>
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
 * Vertical bar chart component for zone count per face visualization.
 *
 * Per AC-3.9.4:
 * - Vertical bars (one per face)
 * - X-axis: face names (Top, Front, Back, etc.)
 * - Y-axis: zone count
 * - Bar colors match 6-face palette from Architecture
 * - Tooltips show face name and exact count
 *
 * @example
 * function ZoneAggregationPanel() {
 *   const { aggregation } = useZoneAggregation()
 *   return aggregation && (
 *     <FaceZoneChart data={aggregation.zonesByFace} />
 *   )
 * }
 */
export function FaceZoneChart({ data, height = 200 }: FaceZoneChartProps) {
  // Build external color map (keyed by face name)
  const colorMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const face of FACE_ORDER) {
      if (data[face] !== undefined && data[face]! > 0) {
        map.set(face, FACE_COLORS[face])
      }
    }
    return map
  }, [data])

  // Transform data for Nivo bar chart (only BarDatum-compliant fields)
  const chartData = useMemo((): NivoBarDatum[] => {
    const result: NivoBarDatum[] = []

    // Only include faces with zones, maintain consistent order
    for (const face of FACE_ORDER) {
      const count = data[face]
      if (count !== undefined && count > 0) {
        result.push({
          face,
          count,
        })
      }
    }

    return result
  }, [data])

  // Color function: lookup from external map
  const getBarColor = useCallback((datum: ComputedDatum<NivoBarDatum>) => {
    return colorMap.get(datum.data.face) || 'var(--muted-foreground)'
  }, [colorMap])

  // Create tooltip with access to color map
  const CustomTooltip = useMemo(() => createCustomTooltip(colorMap), [colorMap])

  // Empty state - no bars to render
  if (chartData.length === 0) {
    return null
  }

  return (
    <div
      className="bg-muted rounded-lg"
      style={{ height }}
      data-testid="face-zone-chart"
    >
      <ResponsiveBar<NivoBarDatum>
        data={chartData}
        keys={['count']}
        indexBy="face"
        layout="vertical"
        margin={{ top: 20, right: 20, bottom: 40, left: 50 }}
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
          tickRotation: 0,
        }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: 'Zones',
          legendPosition: 'middle',
          legendOffset: -40,
          // Only show integer ticks for zone counts
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
        ariaLabel={`Bar chart showing zone counts: ${chartData.map((d) => `${d.face}: ${d.count}`).join(', ')}`}
      />
    </div>
  )
}
