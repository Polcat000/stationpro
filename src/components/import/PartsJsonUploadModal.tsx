// src/components/import/PartsJsonUploadModal.tsx
// Container component orchestrating the parts JSON upload flow
// Per AC-2.3.1 through AC-2.3.5: All import acceptance criteria

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
import { ImportPreview, type InvalidPart } from './ImportPreview'
import { ImportErrorDisplay } from './ImportErrorDisplay'
import { DuplicateDetectionDialog, type DuplicateAction } from './DuplicateDetectionDialog'
import { parseAndValidatePartsIndividually, type ImportError } from '@/lib/import/parseAndValidate'
import { partsRepository } from '@/lib/repositories/partsRepository'
import type { Part } from '@/lib/schemas/part'
import { logger } from '@/lib/logger'

type ModalState =
  | { stage: 'upload' }
  | { stage: 'preview'; validParts: Part[]; invalidParts: InvalidPart[] }
  | { stage: 'error'; errors: ImportError[] }
  | { stage: 'duplicates'; validParts: Part[]; duplicateCallouts: string[] }

export interface PartsJsonUploadModalProps {
  /** Whether the modal is open */
  open: boolean
  /** Called when the modal open state changes */
  onOpenChange: (open: boolean) => void
  /** Called after successful import */
  onSuccess?: () => void
}

/**
 * Modal component that orchestrates the parts JSON upload flow.
 *
 * Flow:
 * 1. Upload: User drops or selects a JSON file
 * 2. Preview: Shows valid/invalid parts breakdown for partial import
 * 3. Duplicates: If duplicates detected, prompts user for action
 * 4. Success: Closes modal and shows toast
 *
 * @example
 * <PartsJsonUploadModal
 *   open={showUpload}
 *   onOpenChange={setShowUpload}
 *   onSuccess={() => navigate('/parts')}
 * />
 */
export function PartsJsonUploadModal({
  open,
  onOpenChange,
  onSuccess,
}: PartsJsonUploadModalProps) {
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
    const result = parseAndValidatePartsIndividually(content)

    if (!result.success) {
      setState({ stage: 'error', errors: result.errors })
      return
    }

    const { validParts, invalidParts } = result.data

    if (validParts.length === 0 && invalidParts.length > 0) {
      // All parts invalid - show error view
      const allErrors = invalidParts.flatMap((ip) => ip.errors)
      setState({ stage: 'error', errors: allErrors })
      return
    }

    // Show preview
    setState({ stage: 'preview', validParts, invalidParts })
  }, [])

  /**
   * Handle file upload error
   */
  const handleFileError = useCallback((message: string) => {
    toast.error(message)
    logger.warn(`File upload error: ${message}`, { component: 'PartsJsonUploadModal' })
  }, [])

  /**
   * Perform the actual import based on duplicate handling strategy
   */
  const performImport = useCallback(
    async (parts: Part[], duplicateAction: 'skip' | 'overwrite') => {
      setIsProcessing(true)

      try {
        let imported = 0
        let skipped = 0
        let updated = 0

        if (duplicateAction === 'overwrite') {
          const result = await partsRepository.upsertMany(parts)
          imported = result.created.length
          updated = result.updated.length
        } else {
          const saved = await partsRepository.saveMany(parts)
          imported = saved.length
          skipped = parts.length - saved.length
        }

        // Invalidate query cache
        await queryClient.invalidateQueries({ queryKey: ['parts'] })

        // Build toast message
        let message = `${imported} ${imported === 1 ? 'part' : 'parts'} imported successfully`
        if (skipped > 0) {
          message += `, ${skipped} skipped`
        }
        if (updated > 0) {
          message += `, ${updated} updated`
        }

        toast.success(message)
        logger.info(message, { component: 'PartsJsonUploadModal' })

        // Close modal and call success callback
        handleOpenChange(false)
        onSuccess?.()
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to save parts'
        toast.error(message)
        logger.error('Failed to save parts', error as Error, { component: 'PartsJsonUploadModal' })
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
    async (partsToImport: Part[]) => {
      setIsProcessing(true)

      try {
        // Check for duplicates
        const callouts = partsToImport.map((p) => p.PartCallout)
        const existingCallouts = await partsRepository.findExistingCallouts(callouts)

        if (existingCallouts.length > 0) {
          // Show duplicate dialog
          setState({
            stage: 'duplicates',
            validParts: partsToImport,
            duplicateCallouts: existingCallouts,
          })
          setShowDuplicateDialog(true)
          setIsProcessing(false)
          return
        }

        // No duplicates - save directly
        await performImport(partsToImport, 'skip')
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Import failed'
        toast.error(message)
        logger.error('Import failed', error as Error, { component: 'PartsJsonUploadModal' })
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

      await performImport(state.validParts, action)
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
            <DialogTitle>Import Parts from JSON</DialogTitle>
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
              <ImportPreview
                validParts={state.validParts}
                invalidParts={state.invalidParts}
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
          onOpenChange={(open) => {
            if (!open) {
              setState({ stage: 'upload' })
            }
            setShowDuplicateDialog(open)
          }}
          duplicateCallouts={state.duplicateCallouts}
          onAction={handleDuplicateAction}
          isProcessing={isProcessing}
        />
      )}
    </>
  )
}
