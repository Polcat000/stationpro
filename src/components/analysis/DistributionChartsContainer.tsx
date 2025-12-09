// src/components/analysis/DistributionChartsContainer.tsx
// Container managing box plot vs histogram view switching
// AC-3.7a.1: Box plots for multi-series comparison
// AC-3.7a.2: Histogram drill-down on series click
// AC-3.7a.3: Auto-switch to histogram for single-series working set

import { useState, useCallback, useMemo } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BoxPlotChart } from '@/components/charts/BoxPlotChart'
import { HistogramChart } from '@/components/charts/HistogramChart'
import { useBoxPlotDistribution } from '@/hooks/useBoxPlotDistribution'
import { useHistogramDistribution } from '@/hooks/useHistogramDistribution'
import type { Dimension } from '@/lib/analysis/boxPlotStats'

// =============================================================================
// Types
// =============================================================================

/**
 * View state for the distribution charts.
 * Per AC-3.7a.2: Supports working-set (box plots) and series drill-down (histogram).
 */
export type ChartView =
  | { level: 'working-set' }
  | { level: 'series'; seriesName: string }

export interface DistributionChartsContainerProps {
  /** Optional height for individual charts (default 250px) */
  chartHeight?: number
  /** Callback when view changes (for external state tracking) */
  onViewChange?: (view: ChartView) => void
}

// =============================================================================
// Dimension Labels
// =============================================================================

const DIMENSION_LABELS: Record<Dimension, string> = {
  width: 'Width',
  height: 'Height',
  length: 'Length',
}

// =============================================================================
// Main Component
// =============================================================================

/**
 * Container that manages box plot vs histogram view switching.
 *
 * Per AC-3.7a.1: Shows box plots when multiple series in working set.
 * Per AC-3.7a.2: Drill-down to histogram when clicking a series box.
 * Per AC-3.7a.3: Auto-switches to histogram when only one series in working set.
 *
 * @example
 * function DistributionPanel() {
 *   return (
 *     <Card>
 *       <CardHeader>Distribution Charts</CardHeader>
 *       <CardContent>
 *         <DistributionChartsContainer />
 *       </CardContent>
 *     </Card>
 *   )
 * }
 */
export function DistributionChartsContainer({
  chartHeight = 250,
  onViewChange,
}: DistributionChartsContainerProps = {}) {
  // View state: working-set (box plots) or series drill-down (histogram)
  const [view, setView] = useState<ChartView>({ level: 'working-set' })

  // Get box plot data for working set view
  const boxPlotData = useBoxPlotDistribution()

  // Determine series name for histogram data
  // AC-3.7a.3: If single series in working set, use that series name
  const histogramSeriesName = useMemo(() => {
    if (view.level === 'series') {
      return view.seriesName
    }
    // Single series auto-switch: use the single series name
    if (boxPlotData.seriesCount === 1 && boxPlotData.seriesNames.length > 0) {
      return boxPlotData.seriesNames[0]
    }
    return null
  }, [view, boxPlotData.seriesCount, boxPlotData.seriesNames])

  // Get histogram data for drill-down or single-series view
  const histogramData = useHistogramDistribution(histogramSeriesName)

  // Compute total outliers for badge
  const totalOutliers = useMemo(() => {
    if (view.level === 'working-set') {
      // Count outliers across all series in box plot data
      let count = 0
      for (const stats of boxPlotData.widthData.seriesStats) {
        count += stats.outliers.length
      }
      for (const stats of boxPlotData.heightData.seriesStats) {
        count += stats.outliers.length
      }
      for (const stats of boxPlotData.lengthData.seriesStats) {
        count += stats.outliers.length
      }
      return count
    } else {
      // Count outliers in histogram bins
      let count = 0
      for (const bin of histogramData.widthData.bins) {
        if (bin.hasOutliers) count += bin.partCallouts.length
      }
      for (const bin of histogramData.heightData.bins) {
        if (bin.hasOutliers) count += bin.partCallouts.length
      }
      for (const bin of histogramData.lengthData.bins) {
        if (bin.hasOutliers) count += bin.partCallouts.length
      }
      return count
    }
  }, [view, boxPlotData, histogramData])

  // Handle series click for drill-down
  const handleSeriesClick = useCallback(
    (seriesName: string) => {
      const newView: ChartView = { level: 'series', seriesName }
      setView(newView)
      onViewChange?.(newView)
    },
    [onViewChange]
  )

  // Handle back button
  const handleBackClick = useCallback(() => {
    const newView: ChartView = { level: 'working-set' }
    setView(newView)
    onViewChange?.(newView)
  }, [onViewChange])

  // Loading state
  if (boxPlotData.isLoading) {
    return (
      <div
        className="flex items-center justify-center h-40 text-muted-foreground"
        data-testid="distribution-charts-loading"
      >
        Loading distribution data...
      </div>
    )
  }

  // Empty state
  if (boxPlotData.isEmpty) {
    return (
      <div
        className="flex items-center justify-center h-40 text-muted-foreground"
        data-testid="distribution-charts-empty"
      >
        Select parts to view distribution charts
      </div>
    )
  }

  // AC-3.7a.3: Auto-switch to histogram when only one series
  const shouldShowHistogram =
    view.level === 'series' || boxPlotData.seriesCount === 1

  // If single series, get the series name
  const singleSeriesName =
    boxPlotData.seriesCount === 1 ? boxPlotData.seriesNames[0] : null

  // Determine effective series name for histogram view
  const effectiveSeriesName =
    view.level === 'series'
      ? view.seriesName
      : singleSeriesName || 'Unknown Series'

  // Render histogram view
  if (shouldShowHistogram) {
    // If no histogram data available yet
    if (histogramData.isEmpty) {
      return (
        <div
          className="flex items-center justify-center h-40 text-muted-foreground"
          data-testid="distribution-charts-histogram-empty"
        >
          No parts found for series: {effectiveSeriesName}
        </div>
      )
    }

    return (
      <div className="space-y-4" data-testid="distribution-charts-histogram">
        {/* Header with back button (only if drill-down, not single-series) */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* AC-3.7a.2: Back button only for drill-down (multi-series working set) */}
            {view.level === 'series' && boxPlotData.seriesCount > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackClick}
                className="gap-1"
                data-testid="back-to-working-set"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            )}
            <h3 className="text-lg font-semibold">{effectiveSeriesName}</h3>
            <span className="text-sm text-muted-foreground">
              {histogramData.partCount} parts
            </span>
          </div>
          {totalOutliers > 0 && (
            <Badge variant="destructive" className="text-xs">
              {totalOutliers} outlier{totalOutliers !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        {/* Histogram charts for each dimension */}
        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-medium mb-2">
              {DIMENSION_LABELS.width} Distribution
            </h4>
            <HistogramChart
              data={histogramData.widthData.bins}
              dimension="width"
              seriesName={effectiveSeriesName}
              height={chartHeight}
            />
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">
              {DIMENSION_LABELS.height} Distribution
            </h4>
            <HistogramChart
              data={histogramData.heightData.bins}
              dimension="height"
              seriesName={effectiveSeriesName}
              height={chartHeight}
            />
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">
              {DIMENSION_LABELS.length} Distribution
            </h4>
            <HistogramChart
              data={histogramData.lengthData.bins}
              dimension="length"
              seriesName={effectiveSeriesName}
              height={chartHeight}
            />
          </div>
        </div>
      </div>
    )
  }

  // Render box plot view (multi-series working set)
  return (
    <div className="space-y-4" data-testid="distribution-charts-boxplot">
      {/* Header with series count and outlier badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Series Comparison</h3>
          <span className="text-sm text-muted-foreground">
            {boxPlotData.seriesCount} series, {boxPlotData.partCount} parts
          </span>
        </div>
        {totalOutliers > 0 && (
          <Badge variant="destructive" className="text-xs">
            {totalOutliers} outlier{totalOutliers !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {/* Drill-down hint */}
      <p className="text-xs text-muted-foreground">
        Click a box to drill down into series histogram
      </p>

      {/* Box plot charts for each dimension */}
      <div className="space-y-6">
        <div>
          <h4 className="text-sm font-medium mb-2">
            {DIMENSION_LABELS.width} Distribution
          </h4>
          <BoxPlotChart
            data={boxPlotData.widthData}
            dimension="width"
            onSeriesClick={handleSeriesClick}
            height={chartHeight}
          />
        </div>

        <div>
          <h4 className="text-sm font-medium mb-2">
            {DIMENSION_LABELS.height} Distribution
          </h4>
          <BoxPlotChart
            data={boxPlotData.heightData}
            dimension="height"
            onSeriesClick={handleSeriesClick}
            height={chartHeight}
          />
        </div>

        <div>
          <h4 className="text-sm font-medium mb-2">
            {DIMENSION_LABELS.length} Distribution
          </h4>
          <BoxPlotChart
            data={boxPlotData.lengthData}
            dimension="length"
            onSeriesClick={handleSeriesClick}
            height={chartHeight}
          />
        </div>
      </div>
    </div>
  )
}
