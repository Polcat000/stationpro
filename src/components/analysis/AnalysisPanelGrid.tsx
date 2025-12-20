// src/components/analysis/AnalysisPanelGrid.tsx
// Grid container for analysis panels with collapsible behavior
// AC-3.10.1: All panels collapsible
// AC-3.17.1-8: UnifiedStatsEnvelopePanel replaces separate stats/envelope panels

import { CollapsiblePanel } from './CollapsiblePanel'
import { UnifiedStatsEnvelopePanel } from './UnifiedStatsEnvelopePanel'
import { DistributionChartsPanelContent } from './DistributionChartsPanel'
import { ZoneAggregationPanelContent } from './ZoneAggregationPanel'

/**
 * Panel configuration for content-only panels that need CollapsiblePanel wrapper.
 * UnifiedStatsEnvelopePanel is rendered separately as it has its own Card/Collapsible.
 */
const WRAPPED_PANELS = [
  {
    id: 'charts',
    title: 'Dimensional Distribution',
    gridClass: 'md:col-span-2',
    Component: DistributionChartsPanelContent,
  },
  {
    id: 'zones',
    title: 'Inspection Zone Summary',
    gridClass: 'md:col-span-2',
    Component: ZoneAggregationPanelContent,
  },
] as const

/**
 * Grid container that renders all analysis panels with collapsible behavior.
 *
 * Layout (AC-3.17.1-8):
 * - UnifiedStatsEnvelopePanel: full-width (md:col-span-2), self-contained
 * - Distribution Charts: full-width (md:col-span-2)
 * - Zone Aggregation: full-width (md:col-span-2)
 *
 * Each panel persists its collapse state to localStorage.
 *
 * @example
 * <TabsContent value="analysis">
 *   <WorkingSetCounter />
 *   <BiasAlertBadge />
 *   <AnalysisPanelGrid />
 * </TabsContent>
 */
export function AnalysisPanelGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-2" data-testid="analysis-panel-grid">
      {/* UnifiedStatsEnvelopePanel has its own Card/Collapsible with md:col-span-2 */}
      <UnifiedStatsEnvelopePanel />

      {/* Wrapped panels use CollapsiblePanel */}
      {WRAPPED_PANELS.map(({ id, title, gridClass, Component }) => (
        <CollapsiblePanel
          key={id}
          panelId={id}
          title={title}
          className={gridClass}
        >
          <Component />
        </CollapsiblePanel>
      ))}
    </div>
  )
}
