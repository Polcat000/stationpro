// src/components/analysis/AnalysisPanelGrid.tsx
// Grid container for analysis panels with collapsible behavior
// AC-3.10.1: All four panels collapsible

import { CollapsiblePanel } from './CollapsiblePanel'
import { AggregateStatsPanelContent } from './AggregateStatsPanel'
import { EnvelopePanelContent } from './EnvelopePanel'
import { DistributionChartsPanelContent } from './DistributionChartsPanel'
import { ZoneAggregationPanelContent } from './ZoneAggregationPanel'

/**
 * Panel configuration for the analysis grid.
 * Each panel has a unique ID, title, and layout class.
 */
const PANEL_CONFIG = [
  {
    id: 'stats',
    title: 'Aggregate Statistics',
    gridClass: '',
    Component: AggregateStatsPanelContent,
  },
  {
    id: 'envelope',
    title: 'Worst-Case Envelope',
    gridClass: '',
    Component: EnvelopePanelContent,
  },
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
 * Maintains the same layout as the original:
 * - Stats and Envelope side-by-side (md:grid-cols-2)
 * - Distribution Charts full-width
 * - Zone Aggregation full-width
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
      {PANEL_CONFIG.map(({ id, title, gridClass, Component }) => (
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
