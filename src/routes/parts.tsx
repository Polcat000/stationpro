import { createFileRoute } from '@tanstack/react-router'
import { PartsLibraryPage } from '@/components/parts'

export const Route = createFileRoute('/parts')({
  component: PartsLibraryPage,
})
