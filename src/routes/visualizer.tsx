import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/visualizer')({
  component: VisualizerScreen,
})

function VisualizerScreen() {
  return <div className="p-4">Screen: Visualizer</div>
}
