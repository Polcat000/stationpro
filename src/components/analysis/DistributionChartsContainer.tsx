// src/components/analysis/DistributionChartsContainer.tsx
// Container managing box plot vs histogram view switching
// AC-3.7a.1: Box plots for multi-series comparison
// AC-3.7a.2: Histogram drill-down on series click
// AC-3.7a.3: Auto-switch to histogram for single-series working set
// AC-3.16.5: 3-level navigation: working-set → family → series (histogram)
// AC-3.16.6: Family/Series toggle with smart defaults

import { useState, useCallback, useMemo } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { BoxPlotChart } from '@/components/charts/BoxPlotChart'
import { HistogramChart } from '@/components/charts/HistogramChart'
import { useBoxPlotDistribution } from '@/hooks/useBoxPlotDistribution'
import { useBoxPlotFamilyDistribution } from '@/hooks/useBoxPlotFamilyDistribution'
import { useHistogramDistribution } from '@/hooks/useHistogramDistribution'
import type { Dimension } from '@/lib/analysis/boxPlotStats'

// =============================================================================
// Types
// =============================================================================

/**
 * View state for the distribution charts.
 * Per AC-3.7a.2: Supports working-set (box plots) and series drill-down (histogram).
 * Per AC-3.16.5: Extended for 3-level navigation: working-set → family → series (histogram).
 */
export type ChartView =
  | { level: 'working-set' }
  | { level: 'family'; familyName: string }
  | { level: 'series'; familyName: string; seriesName: string }

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
 * Container that manages box plot vs histogram view switching with optional family grouping.
 *
 * Per AC-3.7a.1: Shows box plots when multiple series in working set.
 * Per AC-3.7a.2: Drill-down to histogram when clicking a series box.
 * Per AC-3.7a.3: Auto-switches to histogram when only one series in working set.
 * Per AC-3.16.5: 3-level navigation: families → series → histogram.
 * Per AC-3.16.6: "Group by Family" toggle with smart default (>30 series).
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
  // View state: working-set (box plots), family (family box plots), or series (histogram)
  const [view, setView] = useState<ChartView>({ level: 'working-set' })

  // AC-3.16.6: User override for family grouping (null = use smart default)
  const [groupByFamily, setGroupByFamily] = useState<boolean | null>(null)

  // Get box plot data for working set view (all series)
  const boxPlotData = useBoxPlotDistribution()

  // Get family-level box plot data
  const familyData = useBoxPlotFamilyDistribution()

  // Get series-level box plot data filtered by family (for family drill-down)
  const familyFilterName = view.level === 'family' ? view.familyName : null
  const familySeriesData = useBoxPlotDistribution(familyFilterName)

  // AC-3.16.6: Compute effective grouping - smart default when > 30 series
  const effectiveGroupByFamily = useMemo(() => {
    // User override takes precedence
    if (groupByFamily !== null) return groupByFamily
    // Smart default: enable when > 30 series
    return boxPlotData.seriesCount > 30
  }, [groupByFamily, boxPlotData.seriesCount])

  // Determine series name for histogram data
  // AC-3.7a.3: If single series in working set, use that series name
  const histogramSeriesName = useMemo(() => {
    if (view.level === 'series') {
      return view.seriesName
    }
    // Single series auto-switch: use the single series name (only when not grouping by family)
    if (
      !effectiveGroupByFamily &&
      boxPlotData.seriesCount === 1 &&
      boxPlotData.seriesNames.length > 0
    ) {
      return boxPlotData.seriesNames[0]
    }
    return null
  }, [view, effectiveGroupByFamily, boxPlotData.seriesCount, boxPlotData.seriesNames])

  // Get histogram data for drill-down or single-series view
  const histogramData = useHistogramDistribution(histogramSeriesName)

  // Compute total outliers for badge based on current view
  const totalOutliers = useMemo(() => {
    if (view.level === 'series') {
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
    } else if (view.level === 'family') {
      // Count outliers in family's series box plot data
      let count = 0
      for (const stats of familySeriesData.widthData.seriesStats) {
        count += stats.outliers.length
      }
      for (const stats of familySeriesData.heightData.seriesStats) {
        count += stats.outliers.length
      }
      for (const stats of familySeriesData.lengthData.seriesStats) {
        count += stats.outliers.length
      }
      return count
    } else if (effectiveGroupByFamily) {
      // Count outliers in family box plot data
      let count = 0
      for (const stats of familyData.widthData.familyStats) {
        count += stats.outliers.length
      }
      for (const stats of familyData.heightData.familyStats) {
        count += stats.outliers.length
      }
      for (const stats of familyData.lengthData.familyStats) {
        count += stats.outliers.length
      }
      return count
    } else {
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
    }
  }, [view, effectiveGroupByFamily, boxPlotData, familyData, familySeriesData, histogramData])

  // AC-3.16.5: Handle family click for drill-down
  const handleFamilyClick = useCallback(
    (familyName: string) => {
      const newView: ChartView = { level: 'family', familyName }
      setView(newView)
      onViewChange?.(newView)
    },
    [onViewChange]
  )

  // Handle series click for drill-down - includes family context when applicable
  const handleSeriesClick = useCallback(
    (seriesName: string) => {
      // If we're in family view, preserve the family name
      const familyName = view.level === 'family' ? view.familyName : ''
      const newView: ChartView = { level: 'series', familyName, seriesName }
      setView(newView)
      onViewChange?.(newView)
    },
    [onViewChange, view]
  )

  // AC-3.16.5: Handle back button with 3-level navigation
  const handleBackClick = useCallback(() => {
    let newView: ChartView
    if (view.level === 'series' && view.familyName) {
      // Back from histogram to family's series view
      newView = { level: 'family', familyName: view.familyName }
    } else if (view.level === 'family') {
      // Back from family to working-set
      newView = { level: 'working-set' }
    } else {
      // Back to working-set (fallback for series without family)
      newView = { level: 'working-set' }
    }
    setView(newView)
    onViewChange?.(newView)
  }, [onViewChange, view])

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

  // AC-3.7a.3: Auto-switch to histogram when only one series (and not using family grouping)
  const shouldShowHistogram =
    view.level === 'series' ||
    (!effectiveGroupByFamily && boxPlotData.seriesCount === 1)

  // If single series, get the series name
  const singleSeriesName =
    boxPlotData.seriesCount === 1 ? boxPlotData.seriesNames[0] : null

  // Determine effective series name for histogram view
  const effectiveSeriesName =
    view.level === 'series'
      ? view.seriesName
      : singleSeriesName || 'Unknown Series'

  // =============================================================================
  // Render: Histogram View (series drill-down or single-series)
  // =============================================================================
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

    // Determine if back button should show and where it goes
    const showBackButton =
      view.level === 'series' &&
      (view.familyName || boxPlotData.seriesCount > 1 || effectiveGroupByFamily)

    return (
      <div className="space-y-4" data-testid="distribution-charts-histogram">
        {/* Header with back button and context */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {showBackButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackClick}
                className="gap-1"
                data-testid="back-button"
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

  // =============================================================================
  // Render: Family Drill-Down View (series within a family)
  // =============================================================================
  if (view.level === 'family') {
    return (
      <div className="space-y-4" data-testid="distribution-charts-family-drilldown">
        {/* Header with back button and family context */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackClick}
              className="gap-1"
              data-testid="back-button"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <h3 className="text-lg font-semibold">{view.familyName} Family</h3>
            <span className="text-sm text-muted-foreground">
              {familySeriesData.seriesCount} series, {familySeriesData.partCount} parts
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

        {/* Box plot charts for series within this family */}
        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-medium mb-2">
              {DIMENSION_LABELS.width} Distribution
            </h4>
            <BoxPlotChart
              data={familySeriesData.widthData}
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
              data={familySeriesData.heightData}
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
              data={familySeriesData.lengthData}
              dimension="length"
              onSeriesClick={handleSeriesClick}
              height={chartHeight}
            />
          </div>
        </div>
      </div>
    )
  }

  // =============================================================================
  // Render: Working-Set View with Family Grouping
  // =============================================================================
  if (effectiveGroupByFamily) {
    return (
      <div className="space-y-4" data-testid="distribution-charts-family">
        {/* Header with family count, toggle, and outlier badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">All Families</h3>
            <span className="text-sm text-muted-foreground">
              {familyData.familyCount} families, {familyData.partCount} parts
            </span>
          </div>
          <div className="flex items-center gap-4">
            {/* AC-3.16.6: Toggle control */}
            <div className="flex items-center gap-2">
              <Label
                htmlFor="group-toggle"
                className="text-sm text-muted-foreground"
              >
                Group by Family
              </Label>
              <Switch
                id="group-toggle"
                checked={effectiveGroupByFamily}
                onCheckedChange={setGroupByFamily}
                disabled={familyData.familyCount <= 1}
                data-testid="group-by-family-toggle"
              />
            </div>
            {totalOutliers > 0 && (
              <Badge variant="destructive" className="text-xs">
                {totalOutliers} outlier{totalOutliers !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </div>

        {/* Drill-down hint */}
        <p className="text-xs text-muted-foreground">
          Click a family box to drill down into series comparison
        </p>

        {/* Box plot charts for each dimension - family level */}
        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-medium mb-2">
              {DIMENSION_LABELS.width} Distribution
            </h4>
            <BoxPlotChart
              data={{
                dimension: 'width',
                data: familyData.widthData.data,
                seriesStats: familyData.widthData.familyStats.map((s) => ({
                  ...s,
                  seriesName: s.familyName,
                })),
                seriesNames: familyData.widthData.familyNames,
              }}
              dimension="width"
              onSeriesClick={handleFamilyClick}
              height={chartHeight}
            />
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">
              {DIMENSION_LABELS.height} Distribution
            </h4>
            <BoxPlotChart
              data={{
                dimension: 'height',
                data: familyData.heightData.data,
                seriesStats: familyData.heightData.familyStats.map((s) => ({
                  ...s,
                  seriesName: s.familyName,
                })),
                seriesNames: familyData.heightData.familyNames,
              }}
              dimension="height"
              onSeriesClick={handleFamilyClick}
              height={chartHeight}
            />
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">
              {DIMENSION_LABELS.length} Distribution
            </h4>
            <BoxPlotChart
              data={{
                dimension: 'length',
                data: familyData.lengthData.data,
                seriesStats: familyData.lengthData.familyStats.map((s) => ({
                  ...s,
                  seriesName: s.familyName,
                })),
                seriesNames: familyData.lengthData.familyNames,
              }}
              dimension="length"
              onSeriesClick={handleFamilyClick}
              height={chartHeight}
            />
          </div>
        </div>
      </div>
    )
  }

  // =============================================================================
  // Render: Working-Set View with Series Grouping (default, no family grouping)
  // =============================================================================
  return (
    <div className="space-y-4" data-testid="distribution-charts-boxplot">
      {/* Header with series count, toggle, and outlier badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Series Comparison</h3>
          <span className="text-sm text-muted-foreground">
            {boxPlotData.seriesCount} series, {boxPlotData.partCount} parts
          </span>
        </div>
        <div className="flex items-center gap-4">
          {/* AC-3.16.6: Toggle control - show when multiple families exist */}
          {familyData.familyCount > 1 && (
            <div className="flex items-center gap-2">
              <Label
                htmlFor="group-toggle"
                className="text-sm text-muted-foreground"
              >
                Group by Family
              </Label>
              <Switch
                id="group-toggle"
                checked={effectiveGroupByFamily}
                onCheckedChange={setGroupByFamily}
                data-testid="group-by-family-toggle"
              />
            </div>
          )}
          {totalOutliers > 0 && (
            <Badge variant="destructive" className="text-xs">
              {totalOutliers} outlier{totalOutliers !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
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
