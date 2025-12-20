// src/components/charts/AggregateBoxPlotChart.tsx
// Aggregate box plot chart for entire working set with dimension tabs
// AC-3.17.4: Single boxplot for entire working set
// AC-3.17.5: Tab selector for dimension switching
// AC-3.17.6: Disabled depth tab when no data

import { useState, useMemo, useCallback, useRef } from 'react'
import { ResponsiveBoxPlot } from '@nivo/boxplot'
import type {
  BoxPlotCustomLayerProps,
  BoxPlotDatum,
  BoxPlotTooltipProps,
} from '@nivo/boxplot'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useAggregateBoxPlot, type AggregateDimension } from '@/hooks/useAggregateBoxPlot'
import type { OutlierPoint } from '@/lib/analysis/boxPlotStats'

// =============================================================================
// Types
// =============================================================================

export interface AggregateBoxPlotChartProps {
  /** Optional height override (default 200px) */
  height?: number
}

// =============================================================================
// Constants
// =============================================================================

/** Box color using theme's primary green */
const BOX_COLOR = 'oklch(0.55 0.15 144)'

/** Outlier color using destructive theme variable */
const OUTLIER_COLOR = 'var(--destructive)'

/** Dimension labels for display */
const DIMENSION_LABELS: Record<AggregateDimension, string> = {
  width: 'Width',
  height: 'Height',
  length: 'Length',
  lateral: 'Lateral Feature',
  depth: 'Depth Feature',
}

/** Dimension units */
const DIMENSION_UNITS: Record<AggregateDimension, string> = {
  width: 'mm',
  height: 'mm',
  length: 'mm',
  lateral: 'um',
  depth: 'um',
}

// =============================================================================
// Custom Outlier Layer
// =============================================================================

interface OutlierLayerProps<RawDatum extends BoxPlotDatum>
  extends BoxPlotCustomLayerProps<RawDatum> {
  /** Outliers from pre-computed stats */
  outliers: OutlierPoint[]
  /** Callback when outlier is hovered */
  onOutlierHover?: (outlier: OutlierPoint | null, event: React.MouseEvent) => void
  /** Unit for display */
  unit: string
}

/**
 * Custom Nivo layer for rendering IQR-based outlier dots.
 */
function OutlierLayer<RawDatum extends BoxPlotDatum>({
  boxPlots,
  yScale,
  outliers,
  onOutlierHover,
}: OutlierLayerProps<RawDatum>) {
  if (boxPlots.length === 0 || outliers.length === 0) return null

  const boxPlot = boxPlots[0]
  const centerX = boxPlot.x + boxPlot.width / 2

  return (
    <g>
      {outliers.map((outlier, idx) => {
        const y = (yScale as (value: number) => number)(outlier.value)

        return (
          <circle
            key={`outlier-${idx}`}
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
      })}
    </g>
  )
}

// =============================================================================
// Custom Tooltip
// =============================================================================

interface CustomTooltipProps extends BoxPlotTooltipProps {
  unit: string
}

/**
 * Custom tooltip for box plot hover.
 */
function CustomTooltip({ formatted, color, unit }: CustomTooltipProps) {
  return (
    <div className="bg-popover text-popover-foreground border rounded px-3 py-2 shadow-md min-w-[140px]">
      <div className="flex items-center gap-2 mb-1">
        <div
          className="w-3 h-3 rounded-sm"
          style={{ backgroundColor: color }}
        />
        <span className="font-medium">Working Set</span>
      </div>
      <div className="text-sm space-y-0.5">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Median:</span>
          <span>{formatted.values[2]} {unit}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Q1:</span>
          <span>{formatted.values[1]} {unit}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Q3:</span>
          <span>{formatted.values[3]} {unit}</span>
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

function OutlierTooltip({ state, unit }: { state: OutlierTooltipState; unit: string }) {
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
        <span>{state.outlier.value.toFixed(2)} {unit}</span>
      </div>
      <div className="text-xs text-destructive mt-1">Outlier (beyond 1.5x IQR)</div>
    </div>
  )
}

// =============================================================================
// Main Component
// =============================================================================

/**
 * Aggregate box plot chart for entire working set with dimension tabs.
 *
 * AC-3.17.4: Single boxplot showing entire working set distribution
 * AC-3.17.5: Tab selector switches dimension (Width/Height/Length/Lateral/Depth)
 * AC-3.17.6: Depth tab disabled with tooltip when no parts have depth data
 *
 * @example
 * function UnifiedPanel() {
 *   return <AggregateBoxPlotChart height={200} />
 * }
 */
export function AggregateBoxPlotChart({ height = 200 }: AggregateBoxPlotChartProps) {
  const [dimension, setDimension] = useState<AggregateDimension>('width')
  const [outlierTooltip, setOutlierTooltip] = useState<OutlierTooltipState | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const { boxPlotData, isLoading, isEmpty, hasNoDepthData } = useAggregateBoxPlot(dimension)

  const unit = DIMENSION_UNITS[dimension]

  // Outliers from stats
  const outliers = useMemo(() => {
    return boxPlotData?.stats.outliers || []
  }, [boxPlotData])

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

  // Custom layer with outliers
  const OutlierLayerWithData = useCallback(
    (props: BoxPlotCustomLayerProps<BoxPlotDatum>) => (
      <OutlierLayer
        {...props}
        outliers={outliers}
        onOutlierHover={handleOutlierHover}
        unit={unit}
      />
    ),
    [outliers, handleOutlierHover, unit]
  )

  // Custom tooltip with unit
  const TooltipWithUnit = useCallback(
    (props: BoxPlotTooltipProps) => <CustomTooltip {...props} unit={unit} />,
    [unit]
  )

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-9 bg-muted rounded-lg animate-pulse w-[280px]" />
        <div
          className="flex items-center justify-center bg-muted rounded-lg animate-pulse"
          style={{ height }}
          data-testid="aggregate-boxplot-loading"
        >
          Loading...
        </div>
      </div>
    )
  }

  // Empty state
  if (isEmpty) {
    return (
      <div className="space-y-3">
        <DimensionTabs
          dimension={dimension}
          onDimensionChange={setDimension}
          hasNoDepthData={hasNoDepthData}
        />
        <div
          className="flex items-center justify-center text-muted-foreground bg-muted rounded-lg"
          style={{ height }}
          data-testid="aggregate-boxplot-empty"
        >
          No parts in working set
        </div>
      </div>
    )
  }

  // No depth data state (only when depth tab is selected)
  if (dimension === 'depth' && !boxPlotData) {
    return (
      <div className="space-y-3">
        <DimensionTabs
          dimension={dimension}
          onDimensionChange={setDimension}
          hasNoDepthData={hasNoDepthData}
        />
        <div
          className="flex items-center justify-center text-muted-foreground bg-muted rounded-lg"
          style={{ height }}
          data-testid="aggregate-boxplot-no-depth"
        >
          No parts have depth feature data
        </div>
      </div>
    )
  }

  // Data available
  if (!boxPlotData) {
    return null
  }

  return (
    <div className="space-y-3" ref={containerRef}>
      <DimensionTabs
        dimension={dimension}
        onDimensionChange={setDimension}
        hasNoDepthData={hasNoDepthData}
      />

      <div
        className="bg-muted rounded-lg"
        style={{ height }}
        data-testid={`aggregate-boxplot-${dimension}`}
      >
        <ResponsiveBoxPlot
          data={boxPlotData.data as unknown as BoxPlotDatum[]}
          groupBy="group"
          value="value"
          layout="vertical"
          minValue="auto"
          maxValue="auto"
          padding={0.6}
          margin={{ top: 10, right: 20, bottom: 30, left: 60 }}
          colors={[BOX_COLOR]}
          colorBy="group"
          borderRadius={2}
          borderWidth={0}
          medianWidth={3}
          medianColor={{ from: 'color', modifiers: [['darker', 0.5]] }}
          whiskerWidth={2}
          whiskerEndSize={0.6}
          whiskerColor={{ from: 'color', modifiers: [['darker', 0.3]] }}
          axisBottom={{
            tickSize: 0,
            tickPadding: 5,
            tickRotation: 0,
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: `${DIMENSION_LABELS[dimension]} (${unit})`,
            legendPosition: 'middle',
            legendOffset: -45,
            format: (v) => `${v}`,
          }}
          enableGridY={true}
          enableGridX={false}
          isInteractive={true}
          tooltip={TooltipWithUnit}
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
                  fontSize: 11,
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
          ariaLabel={`Box plot showing ${DIMENSION_LABELS[dimension]} distribution for working set`}
        />
      </div>

      {/* Outlier tooltip */}
      {outlierTooltip && <OutlierTooltip state={outlierTooltip} unit={unit} />}
    </div>
  )
}

// =============================================================================
// Dimension Tabs
// =============================================================================

interface DimensionTabsProps {
  dimension: AggregateDimension
  onDimensionChange: (dimension: AggregateDimension) => void
  hasNoDepthData: boolean
}

/**
 * Tab selector for dimension switching.
 * AC-3.17.5: Tab selector controls dimension
 * AC-3.17.6: Depth tab disabled with tooltip when no data
 */
function DimensionTabs({ dimension, onDimensionChange, hasNoDepthData }: DimensionTabsProps) {
  const dimensions: AggregateDimension[] = ['width', 'height', 'length', 'lateral', 'depth']

  return (
    <TooltipProvider>
      <Tabs
        value={dimension}
        onValueChange={(v) => onDimensionChange(v as AggregateDimension)}
        className="w-full"
      >
        <TabsList className="h-8">
          {dimensions.map((dim) => {
            const isDisabled = dim === 'depth' && hasNoDepthData

            if (isDisabled) {
              return (
                <Tooltip key={dim}>
                  <TooltipTrigger asChild>
                    <span>
                      <TabsTrigger
                        value={dim}
                        disabled
                        className="text-xs px-2"
                        data-testid={`dimension-tab-${dim}`}
                      >
                        {DIMENSION_LABELS[dim]}
                      </TabsTrigger>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    No parts have depth feature data
                  </TooltipContent>
                </Tooltip>
              )
            }

            return (
              <TabsTrigger
                key={dim}
                value={dim}
                className="text-xs px-2"
                data-testid={`dimension-tab-${dim}`}
              >
                {DIMENSION_LABELS[dim]}
              </TabsTrigger>
            )
          })}
        </TabsList>
      </Tabs>
    </TooltipProvider>
  )
}
