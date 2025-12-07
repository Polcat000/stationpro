import { createFileRoute } from '@tanstack/react-router'
import { BiasAlertBadge } from '@/components/analysis/BiasAlertBadge'

export const Route = createFileRoute('/analysis')({
  component: AnalysisScreen,
})

function AnalysisScreen() {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Analysis</h1>
        {/* AC 3.4.4: Non-blocking bias alerts visible in analysis view */}
        <BiasAlertBadge />
      </div>
      <p className="text-muted-foreground">Screen: Analysis</p>
    </div>
  )
}
