// src/components/import/ComponentsImportPreview.tsx
// Preview component showing valid/invalid components breakdown for partial import support
// Per AC-2.4.3: Success/error feedback matches Parts pattern

import { CheckCircle2, XCircle, ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import type { Component } from '@/lib/schemas/component'
import type { ImportError } from '@/lib/import/parseAndValidate'
import { Button } from '@/components/ui/button'
import { ImportErrorDisplay } from './ImportErrorDisplay'
import { cn } from '@/lib/utils'

export interface InvalidComponent {
  index: number
  data: unknown
  errors: ImportError[]
}

export interface ComponentsImportPreviewProps {
  /** Valid components that can be imported */
  validComponents: Component[]
  /** Invalid components with their validation errors */
  invalidComponents: InvalidComponent[]
  /** Called when user confirms import of valid components */
  onImport: (components: Component[]) => void
  /** Called when user cancels import */
  onCancel: () => void
  /** Whether import is in progress */
  isImporting?: boolean
  /** Custom class name */
  className?: string
}

/**
 * Get a display label for a component based on its type
 */
function getComponentTypeLabel(component: Component): string {
  switch (component.componentType) {
    case 'LaserLineProfiler':
      return 'Laser Profiler'
    case 'LinescanCamera':
      return 'Linescan Camera'
    case 'AreascanCamera':
      return 'Areascan Camera'
    case 'SnapshotSensor':
      return 'Snapshot Sensor'
    case 'Lens':
      return component.LensType === 'Telecentric' ? 'Telecentric Lens' : 'Fixed Focal Lens'
    default:
      return 'Component'
  }
}

/**
 * Preview component for import operations showing valid/invalid breakdown.
 *
 * Features:
 * - Shows count of valid components ready to import
 * - Shows count of invalid components with expandable error details
 * - Sample data preview (first 3 valid components)
 * - "Import X Valid Components" and "Cancel" buttons
 *
 * @example
 * <ComponentsImportPreview
 *   validComponents={validatedComponents}
 *   invalidComponents={invalidWithErrors}
 *   onImport={(components) => saveComponents(components)}
 *   onCancel={() => setOpen(false)}
 * />
 */
export function ComponentsImportPreview({
  validComponents,
  invalidComponents,
  onImport,
  onCancel,
  isImporting = false,
  className,
}: ComponentsImportPreviewProps) {
  const [showErrorDetails, setShowErrorDetails] = useState(invalidComponents.length <= 3)

  const validCount = validComponents.length
  const invalidCount = invalidComponents.length
  const totalCount = validCount + invalidCount

  // Collect all errors from invalid components for display
  const allErrors = invalidComponents.flatMap((ic) => ic.errors)

  // Sample components for preview (first 3)
  const sampleComponents = validComponents.slice(0, 3)

  const handleImport = () => {
    onImport(validComponents)
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Summary Header */}
      <div className="rounded-lg border bg-card p-4">
        <h3 className="mb-3 text-lg font-semibold">Import Summary</h3>

        <div className="flex flex-wrap gap-4">
          {/* Valid Components */}
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-5 text-green-500" />
            <span className="font-medium">
              {validCount} valid {validCount === 1 ? 'component' : 'components'}
            </span>
          </div>

          {/* Invalid Components */}
          {invalidCount > 0 && (
            <div className="flex items-center gap-2">
              <XCircle className="size-5 text-destructive" />
              <span className="font-medium text-destructive">
                {invalidCount} invalid {invalidCount === 1 ? 'component' : 'components'}
              </span>
            </div>
          )}

          {/* Total */}
          <div className="text-muted-foreground">
            ({totalCount} total in file)
          </div>
        </div>
      </div>

      {/* Valid Components Sample */}
      {validCount > 0 && (
        <div className="rounded-lg border bg-card p-4">
          <h4 className="mb-2 text-sm font-medium text-muted-foreground">
            Valid Components Preview
          </h4>
          <div className="space-y-2">
            {sampleComponents.map((component, index) => (
              <div
                key={component.componentId}
                className="flex items-center justify-between rounded bg-muted/50 px-3 py-2 text-sm"
                data-testid={`preview-component-${index}`}
              >
                <span className="font-medium">{component.Model}</span>
                <span className="text-muted-foreground">
                  {component.Manufacturer} · {getComponentTypeLabel(component)}
                </span>
              </div>
            ))}
            {validCount > 3 && (
              <p className="text-xs text-muted-foreground">
                ... and {validCount - 3} more {validCount - 3 === 1 ? 'component' : 'components'}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Invalid Components Errors */}
      {invalidCount > 0 && (
        <div>
          <button
            type="button"
            className="mb-2 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            onClick={() => setShowErrorDetails(!showErrorDetails)}
            data-testid="toggle-error-details"
          >
            {showErrorDetails ? (
              <ChevronDown className="size-4" />
            ) : (
              <ChevronRight className="size-4" />
            )}
            {showErrorDetails ? 'Hide' : 'Show'} error details
          </button>

          {showErrorDetails && (
            <ImportErrorDisplay
              errors={allErrors}
              title={`Invalid Components (${invalidCount})`}
            />
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 border-t pt-4">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isImporting}
          data-testid="cancel-button"
        >
          Cancel
        </Button>

        {validCount > 0 && (
          <Button
            onClick={handleImport}
            disabled={isImporting}
            data-testid="import-button"
          >
            {isImporting ? 'Importing...' : `Import ${validCount} Valid ${validCount === 1 ? 'Component' : 'Components'}`}
          </Button>
        )}

        {validCount === 0 && (
          <Button disabled data-testid="import-button">
            No Valid Components to Import
          </Button>
        )}
      </div>
    </div>
  )
}
