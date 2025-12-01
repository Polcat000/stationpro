import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/stations')({
  component: StationsScreen,
})

function StationsScreen() {
  return <div className="p-4">Screen: Stations</div>
}
