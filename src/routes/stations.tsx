import { createFileRoute } from '@tanstack/react-router'
import { StationsPage } from '@/components/stations/StationsPage'

export const Route = createFileRoute('/stations')({
  component: StationsPage,
})
