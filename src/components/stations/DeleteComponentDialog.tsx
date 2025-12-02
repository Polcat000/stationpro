// src/components/stations/DeleteComponentDialog.tsx
// Confirmation dialog for component deletion (AC 2.8.6)
// Ref: docs/sprint-artifacts/2-8-components-library-screen.md

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

export interface DeleteComponentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  componentName: string
  onConfirm: () => void
  isDeleting?: boolean
}

export function DeleteComponentDialog({
  open,
  onOpenChange,
  componentName,
  onConfirm,
  isDeleting = false,
}: DeleteComponentDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {componentName}?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the component
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
