// src/components/import/ImportPreview.tsx
// Preview component showing valid/invalid parts breakdown for partial import support
// Per AC-2.3.4: Partial imports supported

import { CheckCircle2, XCircle, ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import type { Part } from '@/lib/schemas/part'
import type { ImportError } from '@/lib/import/parseAndValidate'
import { Button } from '@/components/ui/button'
import { ImportErrorDisplay } from './ImportErrorDisplay'
import { cn } from '@/lib/utils'

export interface InvalidPart {
  index: number
  data: unknown
  errors: ImportError[]
}

export interface ImportPreviewProps {
  /** Valid parts that can be imported */
  validParts: Part[]
  /** Invalid parts with their validation errors */
  invalidParts: InvalidPart[]
  /** Called when user confirms import of valid parts */
  onImport: (parts: Part[]) => void
  /** Called when user cancels import */
  onCancel: () => void
  /** Whether import is in progress */
  isImporting?: boolean
  /** Custom class name */
  className?: string
}

/**
 * Preview component for import operations showing valid/invalid breakdown.
 *
 * Features:
 * - Shows count of valid parts ready to import
 * - Shows count of invalid parts with expandable error details
 * - Sample data preview (first 3 valid parts)
 * - "Import X Valid Parts" and "Cancel" buttons
 *
 * @example
 * <ImportPreview
 *   validParts={validatedParts}
 *   invalidParts={invalidWithErrors}
 *   onImport={(parts) => saveParts(parts)}
 *   onCancel={() => setOpen(false)}
 * />
 */
export function ImportPreview({
  validParts,
  invalidParts,
  onImport,
  onCancel,
  isImporting = false,
  className,
}: ImportPreviewProps) {
  const [showErrorDetails, setShowErrorDetails] = useState(invalidParts.length <= 3)

  const validCount = validParts.length
  const invalidCount = invalidParts.length
  const totalCount = validCount + invalidCount

  // Collect all errors from invalid parts for display
  const allErrors = invalidParts.flatMap((ip) => ip.errors)

  // Sample parts for preview (first 3)
  const sampleParts = validParts.slice(0, 3)

  const handleImport = () => {
    onImport(validParts)
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Summary Header */}
      <div className="rounded-lg border bg-card p-4">
        <h3 className="mb-3 text-lg font-semibold">Import Summary</h3>

        <div className="flex flex-wrap gap-4">
          {/* Valid Parts */}
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-5 text-green-500" />
            <span className="font-medium">
              {validCount} valid {validCount === 1 ? 'part' : 'parts'}
            </span>
          </div>

          {/* Invalid Parts */}
          {invalidCount > 0 && (
            <div className="flex items-center gap-2">
              <XCircle className="size-5 text-destructive" />
              <span className="font-medium text-destructive">
                {invalidCount} invalid {invalidCount === 1 ? 'part' : 'parts'}
              </span>
            </div>
          )}

          {/* Total */}
          <div className="text-muted-foreground">
            ({totalCount} total in file)
          </div>
        </div>
      </div>

      {/* Valid Parts Sample */}
      {validCount > 0 && (
        <div className="rounded-lg border bg-card p-4">
          <h4 className="mb-2 text-sm font-medium text-muted-foreground">
            Valid Parts Preview
          </h4>
          <div className="space-y-2">
            {sampleParts.map((part, index) => (
              <div
                key={part.PartCallout}
                className="flex items-center justify-between rounded bg-muted/50 px-3 py-2 text-sm"
                data-testid={`preview-part-${index}`}
              >
                <span className="font-medium">{part.PartCallout}</span>
                <span className="text-muted-foreground">
                  {part.PartWidth_mm} × {part.PartHeight_mm} × {part.PartLength_mm} mm
                </span>
              </div>
            ))}
            {validCount > 3 && (
              <p className="text-xs text-muted-foreground">
                ... and {validCount - 3} more {validCount - 3 === 1 ? 'part' : 'parts'}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Invalid Parts Errors */}
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
              title={`Invalid Parts (${invalidCount})`}
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
            {isImporting ? 'Importing...' : `Import ${validCount} Valid ${validCount === 1 ? 'Part' : 'Parts'}`}
          </Button>
        )}

        {validCount === 0 && (
          <Button disabled data-testid="import-button">
            No Valid Parts to Import
          </Button>
        )}
      </div>
    </div>
  )
}
