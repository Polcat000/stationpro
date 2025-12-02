// src/components/import/ComponentManualEntryModal.tsx
// Modal wrapper for the Component Entry Wizard
// Per AC-2.6.1: Modal dialog and save flow

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
import { ComponentEntryWizard } from '@/components/wizards'
import { componentsRepository } from '@/lib/repositories/componentsRepository'
import type { Component } from '@/lib/schemas/component'
import { logger } from '@/lib/logger'

export interface ComponentManualEntryModalProps {
  /** Whether the modal is open */
  open: boolean
  /** Called when the modal open state changes */
  onOpenChange: (open: boolean) => void
  /** Called after successful save */
  onSuccess?: () => void
}

/**
 * Modal component wrapping the ComponentEntryWizard.
 *
 * Flow:
 * 1. User completes multi-step wizard with component data
 * 2. On save: validates via Zod schema (in wizard)
 * 3. Calls componentsRepository.save(component)
 * 4. Invalidates 'components' query cache
 * 5. Shows success toast
 * 6. Closes modal
 *
 * @example
 * <ComponentManualEntryModal
 *   open={showModal}
 *   onOpenChange={setShowModal}
 *   onSuccess={() => navigate('/stations')}
 * />
 */
export function ComponentManualEntryModal({
  open,
  onOpenChange,
  onSuccess,
}: ComponentManualEntryModalProps) {
  const queryClient = useQueryClient()
  const [isSaving, setIsSaving] = useState(false)

  const handleComplete = useCallback(
    async (data: Component) => {
      setIsSaving(true)

      try {
        await componentsRepository.save(data)
        await queryClient.invalidateQueries({ queryKey: ['components'] })

        toast.success(`Component ${data.componentId} added successfully`)
        logger.info(`Component ${data.componentId} added via manual entry`, {
          component: 'ComponentManualEntryModal',
          componentType: data.componentType,
        })

        onOpenChange(false)
        onSuccess?.()
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to save component'
        toast.error(message)
        logger.error('Failed to save component', error as Error, {
          component: 'ComponentManualEntryModal',
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
          <DialogTitle>Add Component Manually</DialogTitle>
          <DialogDescription>
            Enter component details using the guided wizard below. The wizard adapts based on the component type you select.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <ComponentEntryWizard
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
