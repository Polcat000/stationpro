// src/components/parts/FilterChip.tsx
// "N filters active" chip indicator (AC 2.7.2)
// Ref: docs/sprint-artifacts/2-7-parts-library-screen.md

import { Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export interface FilterChipProps {
  activeCount: number
  onClick: () => void
}

export function FilterChip({ activeCount, onClick }: FilterChipProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className="gap-2"
      aria-label={`Open filter panel${activeCount > 0 ? `, ${activeCount} filters active` : ''}`}
    >
      <Filter className="h-4 w-4" />
      {activeCount > 0 ? (
        <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs" data-testid="filter-count">
          {activeCount}
        </Badge>
      ) : (
        'Filter'
      )}
    </Button>
  )
}
