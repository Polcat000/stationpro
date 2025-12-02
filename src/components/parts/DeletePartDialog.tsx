// src/components/parts/DeletePartDialog.tsx
// Confirmation dialog for part deletion (AC 2.7.5)
// Ref: docs/sprint-artifacts/2-7-parts-library-screen.md

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export interface DeletePartDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  partCallout: string
  onConfirm: () => void
  isDeleting?: boolean
}

export function DeletePartDialog({
  open,
  onOpenChange,
  partCallout,
  onConfirm,
  isDeleting = false,
}: DeletePartDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {partCallout}?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the part
            and all associated data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
