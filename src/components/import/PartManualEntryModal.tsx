// src/components/import/PartManualEntryModal.tsx
// Modal wrapper for the Part Entry Wizard
// Per AC-2.5.1 and AC-2.5.6: Modal dialog and save flow

import { useCallback, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { PartEntryWizard } from '@/components/wizards'
import { partsRepository } from '@/lib/repositories/partsRepository'
import type { Part } from '@/lib/schemas/part'
import { logger } from '@/lib/logger'

export interface PartManualEntryModalProps {
  /** Whether the modal is open */
  open: boolean
  /** Called when the modal open state changes */
  onOpenChange: (open: boolean) => void
  /** Called after successful save */
  onSuccess?: () => void
}

/**
 * Modal component wrapping the PartEntryWizard.
 *
 * Flow:
 * 1. User completes 4-step wizard with part data
 * 2. On save: validates via Zod schema (in wizard)
 * 3. Calls partsRepository.save(part)
 * 4. Invalidates 'parts' query cache
 * 5. Shows success toast
 * 6. Closes modal
 *
 * @example
 * <PartManualEntryModal
 *   open={showModal}
 *   onOpenChange={setShowModal}
 *   onSuccess={() => navigate('/parts')}
 * />
 */
export function PartManualEntryModal({
  open,
  onOpenChange,
  onSuccess,
}: PartManualEntryModalProps) {
  const queryClient = useQueryClient()
  const [isSaving, setIsSaving] = useState(false)

  const handleComplete = useCallback(
    async (data: Part) => {
      setIsSaving(true)

      try {
        await partsRepository.save(data)
        await queryClient.invalidateQueries({ queryKey: ['parts'] })

        toast.success(`Part ${data.PartCallout} added successfully`)
        logger.info(`Part ${data.PartCallout} added via manual entry`, {
          component: 'PartManualEntryModal',
        })

        onOpenChange(false)
        onSuccess?.()
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to save part'
        toast.error(message)
        logger.error('Failed to save part', error as Error, {
          component: 'PartManualEntryModal',
        })
      } finally {
        setIsSaving(false)
      }
    },
    [queryClient, onOpenChange, onSuccess]
  )

  const handleCancel = useCallback(() => {
    onOpenChange(false)
  }, [onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl lg:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Add Part Manually</DialogTitle>
          <DialogDescription>
            Enter part details using the guided wizard below.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <PartEntryWizard
            onComplete={handleComplete}
            onCancel={handleCancel}
            key={open ? 'open' : 'closed'} // Reset form state when reopened
          />
        </div>

        {isSaving && (
          <div className="bg-background/80 absolute inset-0 flex items-center justify-center">
            <div className="text-muted-foreground text-sm">Saving...</div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
