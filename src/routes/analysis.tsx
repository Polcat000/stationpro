import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/analysis')({
  component: AnalysisScreen,
})

function AnalysisScreen() {
  return <div className="p-4">Screen: Analysis</div>
}
