// src/components/analysis/CollapsiblePanel.tsx
// Collapsible panel wrapper for analysis sections
// AC-3.10.1: Panels Collapsible, AC-3.10.2: Visual Indicator

import { ChevronDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { usePanelPersistence } from '@/hooks/usePanelPersistence'
import { cn } from '@/lib/utils'

export interface CollapsiblePanelProps {
  /** Unique panel ID for persistence (e.g., 'stats', 'envelope', 'charts', 'zones') */
  panelId: string
  /** Panel title displayed in header */
  title: string
  /** Default expanded state if not persisted (default: true) */
  defaultExpanded?: boolean
  /** Panel content */
  children: React.ReactNode
  /** Additional className for the Card container */
  className?: string
}

/**
 * Collapsible panel wrapper for analysis sections.
 * Wraps content in a Card with collapsible behavior and state persistence.
 *
 * Features:
 * - Click header to expand/collapse (AC-3.10.1)
 * - Chevron indicator with smooth rotation animation (AC-3.10.2)
 * - State persisted to localStorage (AC-3.10.3)
 * - Restored on load (AC-3.10.4)
 *
 * @example
 * <CollapsiblePanel panelId="charts" title="Dimensional Distribution">
 *   <DistributionChartsPanelContent />
 * </CollapsiblePanel>
 */
export function CollapsiblePanel({
  panelId,
  title,
  defaultExpanded = true,
  children,
  className,
}: CollapsiblePanelProps) {
  const { isExpanded, setExpanded } = usePanelPersistence(panelId, defaultExpanded)

  return (
    <Card className={className}>
      <Collapsible open={isExpanded} onOpenChange={setExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader
            className="cursor-pointer select-none"
            role="button"
            aria-expanded={isExpanded}
            aria-controls={`panel-content-${panelId}`}
          >
            <div className="flex items-center justify-between">
              <CardTitle>{title}</CardTitle>
              <ChevronDown
                className={cn(
                  'h-5 w-5 text-muted-foreground transition-transform duration-200',
                  !isExpanded && '-rotate-90'
                )}
                aria-hidden="true"
              />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent id={`panel-content-${panelId}`}>
          <CardContent>{children}</CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
