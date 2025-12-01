// src/components/import/DuplicateDetectionDialog.tsx
// Dialog component for handling duplicate parts during import
// Per AC-2.3.5: Duplicate detection prompts user

import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

export type DuplicateAction = 'skip' | 'overwrite' | 'cancel'

export interface DuplicateDetectionDialogProps {
  /** Whether the dialog is open */
  open: boolean
  /** Called when the dialog open state changes */
  onOpenChange: (open: boolean) => void
  /** Array of duplicate PartCallout values */
  duplicateCallouts: string[]
  /** Called with the user's chosen action */
  onAction: (action: DuplicateAction) => void
  /** Whether an action is in progress */
  isProcessing?: boolean
  /** Custom class name */
  className?: string
}

/**
 * Dialog for handling duplicate parts during import.
 *
 * Features:
 * - Shows count of duplicate parts
 * - Lists duplicate PartCallout values (truncates if >10)
 * - Three action options: Skip, Overwrite, Cancel
 *
 * @example
 * <DuplicateDetectionDialog
 *   open={showDuplicates}
 *   onOpenChange={setShowDuplicates}
 *   duplicateCallouts={['PART-001', 'PART-002']}
 *   onAction={(action) => handleDuplicateAction(action)}
 * />
 */
export function DuplicateDetectionDialog({
  open,
  onOpenChange,
  duplicateCallouts,
  onAction,
  isProcessing = false,
  className,
}: DuplicateDetectionDialogProps) {
  const count = duplicateCallouts.length
  const truncated = count > 10
  const displayCallouts = truncated ? duplicateCallouts.slice(0, 10) : duplicateCallouts

  const handleAction = (action: DuplicateAction) => {
    onAction(action)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn('sm:max-w-md', className)}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-amber-500" />
            Duplicate Parts Detected
          </DialogTitle>
          <DialogDescription>
            {count} {count === 1 ? 'part already exists' : 'parts already exist'} in your library.
            What would you like to do?
          </DialogDescription>
        </DialogHeader>

        {/* Duplicate Callouts List */}
        <div className="my-4 rounded-lg border bg-muted/30 p-3">
          <p className="mb-2 text-sm font-medium text-muted-foreground">
            Duplicate {count === 1 ? 'callout' : 'callouts'}:
          </p>
          <ul className="space-y-1">
            {displayCallouts.map((callout) => (
              <li
                key={callout}
                className="font-mono text-sm"
                data-testid={`duplicate-callout-${callout}`}
              >
                {callout}
              </li>
            ))}
          </ul>
          {truncated && (
            <p className="mt-2 text-xs text-muted-foreground">
              ... and {count - 10} more
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            onClick={() => handleAction('skip')}
            disabled={isProcessing}
            className="w-full justify-start"
            data-testid="skip-duplicates-button"
          >
            <span className="font-medium">Skip Duplicates</span>
            <span className="ml-auto text-xs text-muted-foreground">
              Import only new parts
            </span>
          </Button>

          <Button
            variant="outline"
            onClick={() => handleAction('overwrite')}
            disabled={isProcessing}
            className="w-full justify-start"
            data-testid="overwrite-button"
          >
            <span className="font-medium">Overwrite Existing</span>
            <span className="ml-auto text-xs text-muted-foreground">
              Replace with imported versions
            </span>
          </Button>

          <Button
            variant="ghost"
            onClick={() => handleAction('cancel')}
            disabled={isProcessing}
            className="w-full"
            data-testid="cancel-button"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
