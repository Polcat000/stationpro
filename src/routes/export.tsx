import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/export')({
  component: ExportScreen,
})

function ExportScreen() {
  return <div className="p-4">Screen: Export</div>
}
