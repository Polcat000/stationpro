// src/components/analysis/DistributionChartsPanel.tsx
// Panel containing dimensional distribution charts for Width, Height, Length
// AC-3.7a.1: Box plots for multi-series comparison
// AC-3.7a.2: Histogram drill-down on series click
// AC-3.7a.3: Single-series auto-switch

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DistributionChartsContainer } from './DistributionChartsContainer'

// =============================================================================
// Main Component
// =============================================================================

/**
 * Panel component wrapping the distribution charts.
 * Provides a Card container with title and the interactive charts.
 *
 * Per AC-3.7a.1: Box plots for multi-series working sets.
 * Per AC-3.7a.2: Click drill-down to histogram.
 * Per AC-3.7a.3: Single-series auto-switch to histogram.
 *
 * @example
 * function AnalysisPage() {
 *   return (
 *     <div className="space-y-4">
 *       <DistributionChartsPanel />
 *       <OtherAnalysisPanel />
 *     </div>
 *   )
 * }
 */
export function DistributionChartsPanel() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Dimensional Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <DistributionChartsContainer />
      </CardContent>
    </Card>
  )
}
