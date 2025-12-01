// src/components/import/ImportErrorDisplay.tsx
// Component for displaying import validation errors grouped by part index
// Per AC-2.3.3: Validation errors shown inline with field paths

import { AlertCircle, ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import type { ImportError } from '@/lib/import/parseAndValidate'
import { cn } from '@/lib/utils'

export interface ImportErrorDisplayProps {
  /** Array of validation errors to display */
  errors: ImportError[]
  /** Optional title for the error section */
  title?: string
  /** Custom class name */
  className?: string
}

/**
 * Groups errors by part index (first number in path).
 * Non-indexed errors (like "root") are grouped under -1.
 */
function groupErrorsByPartIndex(errors: ImportError[]): Map<number, ImportError[]> {
  const grouped = new Map<number, ImportError[]>()

  for (const error of errors) {
    // Extract part index from path like "0.PartCallout" or "2.InspectionZones.0.Face"
    const match = error.path.match(/^(\d+)\./)
    const index = match ? parseInt(match[1], 10) : -1

    if (!grouped.has(index)) {
      grouped.set(index, [])
    }
    grouped.get(index)!.push(error)
  }

  return grouped
}

/**
 * Formats a field path for display by removing the leading index.
 * "0.InspectionZones.0.Face" -> "InspectionZones.0.Face"
 */
function formatFieldPath(path: string): string {
  return path.replace(/^\d+\./, '') || path
}

/**
 * Displays import validation errors grouped by part index.
 *
 * Features:
 * - Groups errors by part index for clarity
 * - Collapsible error groups
 * - Shows field path and human-readable message
 * - Red styling with error icons per AC-2.3.3
 *
 * @example
 * <ImportErrorDisplay
 *   errors={[
 *     { path: '0.PartCallout', message: 'Part callout is required' },
 *     { path: '0.PartWidth_mm', message: 'Width must be positive' },
 *     { path: '2.InspectionZones.0.Face', message: 'Invalid value' },
 *   ]}
 * />
 */
export function ImportErrorDisplay({
  errors,
  title = 'Validation Errors',
  className,
}: ImportErrorDisplayProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set([-1, 0, 1, 2]))

  if (errors.length === 0) {
    return null
  }

  const groupedErrors = groupErrorsByPartIndex(errors)
  const sortedIndices = Array.from(groupedErrors.keys()).sort((a, b) => a - b)

  const toggleGroup = (index: number) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedGroups(newExpanded)
  }

  return (
    <div className={cn('rounded-lg border border-destructive/30 bg-destructive/5 p-4', className)}>
      {/* Header */}
      <div className="mb-3 flex items-center gap-2 text-destructive">
        <AlertCircle className="size-5" />
        <h3 className="font-semibold">{title}</h3>
        <span className="text-sm text-muted-foreground">
          ({errors.length} {errors.length === 1 ? 'error' : 'errors'})
        </span>
      </div>

      {/* Error Groups */}
      <div className="space-y-2">
        {sortedIndices.map((index) => {
          const groupErrors = groupedErrors.get(index)!
          const isExpanded = expandedGroups.has(index)
          const groupLabel = index === -1 ? 'General Errors' : `Part ${index}`

          return (
            <div
              key={index}
              className="rounded border border-destructive/20 bg-background"
              data-testid={`error-group-${index}`}
            >
              {/* Group Header */}
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-muted/50"
                onClick={() => toggleGroup(index)}
                aria-expanded={isExpanded}
              >
                {isExpanded ? (
                  <ChevronDown className="size-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="size-4 text-muted-foreground" />
                )}
                <span className="font-medium text-destructive">{groupLabel}</span>
                <span className="text-xs text-muted-foreground">
                  ({groupErrors.length} {groupErrors.length === 1 ? 'error' : 'errors'})
                </span>
              </button>

              {/* Error List */}
              {isExpanded && (
                <ul className="border-t border-destructive/10 px-3 py-2">
                  {groupErrors.map((error, errorIndex) => (
                    <li
                      key={`${error.path}-${errorIndex}`}
                      className="flex flex-col py-1 text-sm"
                      data-testid={`error-item-${error.path}`}
                    >
                      <span className="font-mono text-xs text-muted-foreground">
                        {formatFieldPath(error.path)}
                      </span>
                      <span className="text-destructive">{error.message}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
