// src/components/analysis/UnifiedStatsEnvelopePanel.tsx
// Unified panel combining aggregate statistics, envelope, and boxplot
// AC-3.17.1-8: Single combined view with two-column desktop layout

import { Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { ChevronDown } from 'lucide-react'
import { usePanelPersistence } from '@/hooks/usePanelPersistence'
import { useUnifiedStatsEnvelope } from '@/hooks/useUnifiedStatsEnvelope'
import { AggregateBoxPlotChart } from '@/components/charts/AggregateBoxPlotChart'
import type { AggregateStatistics, DimensionStats } from '@/lib/analysis/statistics'
import type { EnvelopeResult, EnvelopeDriver } from '@/lib/analysis/envelope'
import { cn } from '@/lib/utils'

// =============================================================================
// Constants
// =============================================================================

const PANEL_ID = 'unified-stats-envelope'
const PANEL_TITLE = 'Working Set Summary'

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
 */
function formatStdDev(stdDev: number | null, unit: string): string {
  if (stdDev === null) return 'N/A'
  return `${formatValue(stdDev)} ${unit}`
}

// =============================================================================
// Stats Table Sub-Components
// =============================================================================

interface DimensionRowProps {
  label: string
  stats: DimensionStats
  unit: string
}

/**
 * Renders a single dimension row with all 6 statistics
 * AC-3.17.1: Count, Min, Max, Mean, Median, Std Dev
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
// Envelope Sub-Components
// =============================================================================

interface EnvelopeDimensionProps {
  label: string
  driver: EnvelopeDriver
}

/**
 * Renders a single envelope dimension with value and driver callout
 * AC-3.17.3: Display max dimension with driver part callout
 */
function EnvelopeDimension({ label, driver }: EnvelopeDimensionProps) {
  return (
    <div className="flex justify-between items-baseline py-2 border-b last:border-b-0">
      <span className="font-medium">{label}</span>
      <div className="text-right">
        <span className="text-lg font-semibold">
          {formatValue(driver.value)} mm
        </span>
        <span className="ml-2 text-sm text-muted-foreground">
          ({driver.partCallout})
        </span>
      </div>
    </div>
  )
}

// =============================================================================
// Stats Table Section
// =============================================================================

interface StatsTableProps {
  stats: AggregateStatistics
}

/**
 * Stats table with 5 dimension rows
 * AC-3.17.1: Width, Height, Length, Lateral Feature, Depth Feature
 * AC-3.17.2: N/A row for depth when no data
 */
function StatsTable({ stats }: StatsTableProps) {
  return (
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
          <DimensionRow label="Width" stats={stats.width} unit="mm" />
          <DimensionRow label="Height" stats={stats.height} unit="mm" />
          <DimensionRow label="Length" stats={stats.length} unit="mm" />
          <DimensionRow
            label="Smallest Lateral Feature"
            stats={stats.smallestLateralFeature}
            unit="µm"
          />
          {stats.smallestDepthFeature ? (
            <DimensionRow
              label="Smallest Depth Feature"
              stats={stats.smallestDepthFeature}
              unit="µm"
            />
          ) : (
            <tr className="border-b last:border-b-0">
              <td className="py-2 pr-4 font-medium">Smallest Depth Feature</td>
              <td
                colSpan={6}
                className="py-2 px-2 text-center text-muted-foreground italic"
              >
                N/A - No parts have this data
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

// =============================================================================
// Envelope Section
// =============================================================================

interface EnvelopeSectionProps {
  envelope: EnvelopeResult
}

/**
 * Envelope section with max dimensions and driver callouts
 * AC-3.17.3: Max Width, Max Height, Max Length with driver parts
 */
function EnvelopeSection({ envelope }: EnvelopeSectionProps) {
  return (
    <div className="mt-8 pt-4 border-t" aria-label="Worst-case envelope dimensions">
      <h4 className="text-sm font-semibold text-muted-foreground mb-2">
        Worst-Case Envelope
      </h4>
      <EnvelopeDimension label="Max Width" driver={envelope.drivers.maxWidth} />
      <EnvelopeDimension label="Max Height" driver={envelope.drivers.maxHeight} />
      <EnvelopeDimension label="Max Length" driver={envelope.drivers.maxLength} />
    </div>
  )
}

// =============================================================================
// Inner Content Component (Prop-Based)
// =============================================================================

export interface UnifiedStatsEnvelopePanelContentInnerProps {
  stats: AggregateStatistics | null
  envelope: EnvelopeResult | null
  isLoading: boolean
  isCalculating: boolean
  isEmpty: boolean
}

/**
 * Inner content component without Card wrapper.
 * Used by UnifiedStatsEnvelopePanelContent and UnifiedStatsEnvelopePanelStandalone.
 *
 * AC-3.17.7: Desktop two-column layout (stats/envelope left, boxplot right)
 */
export function UnifiedStatsEnvelopePanelContentInner({
  stats,
  envelope,
  isLoading,
  isCalculating,
  isEmpty,
}: UnifiedStatsEnvelopePanelContentInnerProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading...</span>
      </div>
    )
  }

  // Empty state (AC-3.17.5: Combined empty state)
  if (isEmpty || !stats || !envelope) {
    return (
      <p className="text-muted-foreground py-4">
        Select parts to view working set summary
      </p>
    )
  }

  // Data display with two-column layout (AC-3.17.7)
  return (
    <div className="relative">
      {/* Calculating overlay */}
      {isCalculating && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center bg-background/50"
          aria-label="Calculating statistics"
        >
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Two-column grid for desktop (AC-3.17.7) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-14">
        {/* LEFT: Stats table + Envelope */}
        <div className="space-y-0">
          <StatsTable stats={stats} />
          <EnvelopeSection envelope={envelope} />
        </div>

        {/* RIGHT: Boxplot chart (AC-3.17.4, AC-3.17.5, AC-3.17.6) */}
        <div className="min-h-[380px]">
          <AggregateBoxPlotChart height={380} />
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// Content Component (Hook-Based, for CollapsiblePanel)
// =============================================================================

/**
 * Content-only component for use with CollapsiblePanel wrapper.
 * Uses the useUnifiedStatsEnvelope hook internally.
 */
export function UnifiedStatsEnvelopePanelContent() {
  const { stats, envelope, isLoading, isCalculating, isEmpty } =
    useUnifiedStatsEnvelope()

  return (
    <UnifiedStatsEnvelopePanelContentInner
      stats={stats}
      envelope={envelope}
      isLoading={isLoading}
      isCalculating={isCalculating}
      isEmpty={isEmpty}
    />
  )
}

// =============================================================================
// Standalone Component (for testing)
// =============================================================================

export interface UnifiedStatsEnvelopePanelStandaloneProps {
  stats: AggregateStatistics | null
  envelope: EnvelopeResult | null
  isLoading: boolean
  isCalculating?: boolean
  isEmpty: boolean
}

/**
 * Standalone component that accepts props directly (for testing without hook)
 */
export function UnifiedStatsEnvelopePanelStandalone({
  stats,
  envelope,
  isLoading,
  isCalculating = false,
  isEmpty,
}: UnifiedStatsEnvelopePanelStandaloneProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{PANEL_TITLE}</CardTitle>
      </CardHeader>
      <CardContent>
        <UnifiedStatsEnvelopePanelContentInner
          stats={stats}
          envelope={envelope}
          isLoading={isLoading}
          isCalculating={isCalculating}
          isEmpty={isEmpty}
        />
      </CardContent>
    </Card>
  )
}

// =============================================================================
// Main Component (with CollapsiblePanel and hook)
// =============================================================================

/**
 * Main unified panel component with collapsible behavior and localStorage persistence.
 *
 * AC-3.17.1: Stats table with 5 dimensions
 * AC-3.17.2: N/A for depth when no data
 * AC-3.17.3: Envelope with driver callouts
 * AC-3.17.4: Aggregate boxplot for entire working set
 * AC-3.17.5: Tab selector for dimension switching
 * AC-3.17.6: Disabled depth tab when no data
 * AC-3.17.7: Desktop two-column layout
 * AC-3.17.8: Collapsible with persisted state
 */
export function UnifiedStatsEnvelopePanel() {
  const { isExpanded, setExpanded } = usePanelPersistence(PANEL_ID, true)

  return (
    <Card className="md:col-span-2">
      <Collapsible open={isExpanded} onOpenChange={setExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader
            className="cursor-pointer select-none"
            role="button"
            aria-expanded={isExpanded}
            aria-controls={`panel-content-${PANEL_ID}`}
          >
            <div className="flex items-center justify-between">
              <CardTitle>{PANEL_TITLE}</CardTitle>
              <ChevronDown
                className={cn(
                  'h-5 w-5 text-muted-foreground transition-transform duration-200',
                  !isExpanded && '-rotate-90'
                )}
                aria-hidden="true"
              />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent id={`panel-content-${PANEL_ID}`}>
          <CardContent>
            <UnifiedStatsEnvelopePanelContent />
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
