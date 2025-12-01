// src/components/import/JsonFileUpload.tsx
// Drag-drop file upload component for JSON files
// Uses react-dropzone with MIME type filtering per AC-2.3.1

import { useCallback, useState } from 'react'
import { useDropzone, type FileRejection } from 'react-dropzone'
import { Upload, FileJson, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface JsonFileUploadProps {
  /** Called with file content when a valid JSON file is dropped/selected */
  onFileContent: (content: string) => void
  /** Called with error message for rejected files */
  onError: (message: string) => void
  /** Disable the drop zone */
  disabled?: boolean
  /** Custom class name for the container */
  className?: string
}

/**
 * Drag-drop file upload component for JSON files.
 *
 * Features:
 * - Accepts only .json files (MIME type filtering)
 * - Visual feedback on drag-over (border highlight)
 * - Click to open file picker
 * - Error messages for rejected file types
 *
 * @example
 * <JsonFileUpload
 *   onFileContent={(json) => console.log('Got JSON:', json)}
 *   onError={(msg) => console.error('Error:', msg)}
 * />
 */
export function JsonFileUpload({
  onFileContent,
  onError,
  disabled = false,
  className,
}: JsonFileUploadProps) {
  const [rejectionError, setRejectionError] = useState<string | null>(null)

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      // Clear previous error
      setRejectionError(null)

      // Handle rejected files
      if (fileRejections.length > 0) {
        const rejection = fileRejections[0]
        const errorCode = rejection.errors[0]?.code

        let message: string
        if (errorCode === 'file-invalid-type') {
          message = 'Invalid file type. Please upload a .json file.'
        } else if (errorCode === 'too-many-files') {
          message = 'Please upload only one file at a time.'
        } else {
          message = rejection.errors[0]?.message || 'File rejected.'
        }

        setRejectionError(message)
        onError(message)
        return
      }

      // Handle accepted file
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0]

        const reader = new FileReader()
        reader.onload = () => {
          const content = reader.result as string
          onFileContent(content)
        }
        reader.onerror = () => {
          const message = 'Failed to read file. Please try again.'
          setRejectionError(message)
          onError(message)
        }
        reader.readAsText(file)
      }
    },
    [onFileContent, onError]
  )

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/json': ['.json'],
    },
    maxFiles: 1,
    disabled,
    noClick: disabled,
    noDrag: disabled,
  })

  /**
   * Resets the error state - called when user clicks to try again
   */
  const clearError = useCallback(() => {
    setRejectionError(null)
  }, [])

  return (
    <div className={cn('w-full', className)}>
      <div
        {...getRootProps()}
        onClick={(e) => {
          clearError()
          getRootProps().onClick?.(e)
        }}
        className={cn(
          'relative flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 transition-colors duration-200',
          'cursor-pointer hover:border-primary/50',
          // Default state
          !isDragActive && !isDragReject && !rejectionError && 'border-muted-foreground/25 bg-muted/30',
          // Drag active state - Nature theme primary highlight
          isDragActive && !isDragReject && 'border-primary bg-primary/5',
          // Drag reject state - file type not accepted
          isDragReject && 'border-destructive bg-destructive/5',
          // Error state
          rejectionError && 'border-destructive/50 bg-destructive/5',
          // Disabled state
          disabled && 'cursor-not-allowed opacity-50'
        )}
        data-testid="json-dropzone"
        data-drag-active={isDragActive}
        data-drag-reject={isDragReject}
      >
        <input {...getInputProps()} data-testid="json-file-input" />

        {/* Icon */}
        <div
          className={cn(
            'rounded-full p-3 transition-colors',
            isDragActive && !isDragReject && 'bg-primary/10 text-primary',
            isDragReject && 'bg-destructive/10 text-destructive',
            rejectionError && 'bg-destructive/10 text-destructive',
            !isDragActive && !rejectionError && 'bg-muted text-muted-foreground'
          )}
        >
          {rejectionError ? (
            <AlertCircle className="size-6" />
          ) : isDragActive ? (
            <FileJson className="size-6" />
          ) : (
            <Upload className="size-6" />
          )}
        </div>

        {/* Text */}
        <div className="text-center">
          {rejectionError ? (
            <>
              <p className="text-sm font-medium text-destructive">{rejectionError}</p>
              <p className="mt-1 text-xs text-muted-foreground">Click to try again</p>
            </>
          ) : isDragReject ? (
            <p className="text-sm font-medium text-destructive">Only .json files are accepted</p>
          ) : isDragActive ? (
            <p className="text-sm font-medium text-primary">Drop your JSON file here</p>
          ) : (
            <>
              <p className="text-sm font-medium">
                <span className="text-primary">Click to upload</span>
                <span className="text-muted-foreground"> or drag and drop</span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">JSON files only (.json)</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
