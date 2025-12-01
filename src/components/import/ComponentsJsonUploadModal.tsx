// src/components/import/ComponentsJsonUploadModal.tsx
// Container component orchestrating the components JSON upload flow
// Per AC-2.4.1 through AC-2.4.3: All import acceptance criteria

import { useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { JsonFileUpload } from './JsonFileUpload'
import { ComponentsImportPreview, type InvalidComponent } from './ComponentsImportPreview'
import { ImportErrorDisplay } from './ImportErrorDisplay'
import { DuplicateDetectionDialog, type DuplicateAction } from './DuplicateDetectionDialog'
import { parseAndValidateComponentsIndividually, type ImportError } from '@/lib/import/parseAndValidate'
import { componentsRepository } from '@/lib/repositories/componentsRepository'
import type { Component } from '@/lib/schemas/component'
import { logger } from '@/lib/logger'

type ModalState =
  | { stage: 'upload' }
  | { stage: 'preview'; validComponents: Component[]; invalidComponents: InvalidComponent[] }
  | { stage: 'error'; errors: ImportError[] }
  | { stage: 'duplicates'; validComponents: Component[]; duplicateIds: string[] }

export interface ComponentsJsonUploadModalProps {
  /** Whether the modal is open */
  open: boolean
  /** Called when the modal open state changes */
  onOpenChange: (open: boolean) => void
  /** Called after successful import */
  onSuccess?: () => void
}

/**
 * Modal component that orchestrates the components JSON upload flow.
 *
 * Flow:
 * 1. Upload: User drops or selects a JSON file
 * 2. Preview: Shows valid/invalid components breakdown for partial import
 * 3. Duplicates: If duplicates detected, prompts user for action
 * 4. Success: Closes modal and shows toast
 *
 * @example
 * <ComponentsJsonUploadModal
 *   open={showUpload}
 *   onOpenChange={setShowUpload}
 *   onSuccess={() => navigate('/components')}
 * />
 */
export function ComponentsJsonUploadModal({
  open,
  onOpenChange,
  onSuccess,
}: ComponentsJsonUploadModalProps) {
  const queryClient = useQueryClient()
  const [state, setState] = useState<ModalState>({ stage: 'upload' })
  const [isProcessing, setIsProcessing] = useState(false)
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false)

  /**
   * Reset modal state when closing
   */
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen) {
        setState({ stage: 'upload' })
        setIsProcessing(false)
        setShowDuplicateDialog(false)
      }
      onOpenChange(newOpen)
    },
    [onOpenChange]
  )

  /**
   * Handle file content from JsonFileUpload
   */
  const handleFileContent = useCallback((content: string) => {
    const result = parseAndValidateComponentsIndividually(content)

    if (!result.success) {
      setState({ stage: 'error', errors: result.errors })
      return
    }

    const { validComponents, invalidComponents } = result.data

    if (validComponents.length === 0 && invalidComponents.length > 0) {
      // All components invalid - show error view
      const allErrors = invalidComponents.flatMap((ic) => ic.errors)
      setState({ stage: 'error', errors: allErrors })
      return
    }

    // Show preview
    setState({ stage: 'preview', validComponents, invalidComponents })
  }, [])

  /**
   * Handle file upload error
   */
  const handleFileError = useCallback((message: string) => {
    toast.error(message)
    logger.warn(`File upload error: ${message}`, { component: 'ComponentsJsonUploadModal' })
  }, [])

  /**
   * Perform the actual import based on duplicate handling strategy
   */
  const performImport = useCallback(
    async (components: Component[], duplicateAction: 'skip' | 'overwrite') => {
      setIsProcessing(true)

      try {
        let imported = 0
        let skipped = 0
        let updated = 0

        if (duplicateAction === 'overwrite') {
          const result = await componentsRepository.upsertMany(components)
          imported = result.created.length
          updated = result.updated.length
        } else {
          const saved = await componentsRepository.saveMany(components)
          imported = saved.length
          skipped = components.length - saved.length
        }

        // Invalidate query cache
        await queryClient.invalidateQueries({ queryKey: ['components'] })

        // Build toast message
        let message = `${imported} ${imported === 1 ? 'component' : 'components'} imported successfully`
        if (skipped > 0) {
          message += `, ${skipped} skipped`
        }
        if (updated > 0) {
          message += `, ${updated} updated`
        }

        toast.success(message)
        logger.info(message, { component: 'ComponentsJsonUploadModal' })

        // Close modal and call success callback
        handleOpenChange(false)
        onSuccess?.()
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to save components'
        toast.error(message)
        logger.error('Failed to save components', error as Error, { component: 'ComponentsJsonUploadModal' })
      } finally {
        setIsProcessing(false)
      }
    },
    [queryClient, handleOpenChange, onSuccess]
  )

  /**
   * Check for duplicates and proceed to import
   */
  const handleImport = useCallback(
    async (componentsToImport: Component[]) => {
      setIsProcessing(true)

      try {
        // Check for duplicates
        const ids = componentsToImport.map((c) => c.componentId)
        const existingIds = await componentsRepository.findExistingIds(ids)

        if (existingIds.length > 0) {
          // Show duplicate dialog
          setState({
            stage: 'duplicates',
            validComponents: componentsToImport,
            duplicateIds: existingIds,
          })
          setShowDuplicateDialog(true)
          setIsProcessing(false)
          return
        }

        // No duplicates - save directly
        await performImport(componentsToImport, 'skip')
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Import failed'
        toast.error(message)
        logger.error('Import failed', error as Error, { component: 'ComponentsJsonUploadModal' })
        setIsProcessing(false)
      }
    },
    [performImport]
  )

  /**
   * Handle duplicate action choice
   */
  const handleDuplicateAction = useCallback(
    async (action: DuplicateAction) => {
      setShowDuplicateDialog(false)

      if (action === 'cancel') {
        setState({ stage: 'upload' })
        return
      }

      if (state.stage !== 'duplicates') return

      await performImport(state.validComponents, action)
    },
    [state, performImport]
  )

  /**
   * Handle cancel from preview
   */
  const handleCancel = useCallback(() => {
    setState({ stage: 'upload' })
  }, [])

  /**
   * Reset to upload stage to try again
   */
  const handleRetry = useCallback(() => {
    setState({ stage: 'upload' })
  }, [])

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Import Components from JSON</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            {/* Upload Stage */}
            {state.stage === 'upload' && (
              <JsonFileUpload
                onFileContent={handleFileContent}
                onError={handleFileError}
                disabled={isProcessing}
              />
            )}

            {/* Preview Stage */}
            {state.stage === 'preview' && (
              <ComponentsImportPreview
                validComponents={state.validComponents}
                invalidComponents={state.invalidComponents}
                onImport={handleImport}
                onCancel={handleCancel}
                isImporting={isProcessing}
              />
            )}

            {/* Error Stage */}
            {state.stage === 'error' && (
              <div className="space-y-4">
                <ImportErrorDisplay errors={state.errors} />
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    className="text-sm text-muted-foreground hover:text-foreground"
                    onClick={() => handleOpenChange(false)}
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    className="text-sm font-medium text-primary hover:underline"
                    onClick={handleRetry}
                    data-testid="retry-button"
                  >
                    Upload different file
                  </button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Duplicate Detection Dialog */}
      {state.stage === 'duplicates' && (
        <DuplicateDetectionDialog
          open={showDuplicateDialog}
          onOpenChange={(dialogOpen) => {
            if (!dialogOpen) {
              setState({ stage: 'upload' })
            }
            setShowDuplicateDialog(dialogOpen)
          }}
          duplicateCallouts={state.duplicateIds}
          onAction={handleDuplicateAction}
          isProcessing={isProcessing}
        />
      )}
    </>
  )
}
