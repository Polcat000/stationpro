import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/parts')({
  component: PartsScreen,
})

function PartsScreen() {
  return <div className="p-4">Screen: Parts</div>
}
