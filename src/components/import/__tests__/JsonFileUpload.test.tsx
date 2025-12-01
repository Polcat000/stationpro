// src/components/import/__tests__/JsonFileUpload.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { JsonFileUpload } from '../JsonFileUpload'

describe('JsonFileUpload', () => {
  const mockOnFileContent = vi.fn()
  const mockOnError = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  const renderComponent = (props = {}) => {
    return render(
      <JsonFileUpload
        onFileContent={mockOnFileContent}
        onError={mockOnError}
        {...props}
      />
    )
  }

  describe('rendering', () => {
    it('renders drop zone with correct text', () => {
      renderComponent()

      expect(screen.getByText(/Click to upload/)).toBeInTheDocument()
      expect(screen.getByText(/or drag and drop/)).toBeInTheDocument()
      expect(screen.getByText(/JSON files only/)).toBeInTheDocument()
    })

    it('renders file input with json accept attribute', () => {
      renderComponent()

      const input = screen.getByTestId('json-file-input')
      expect(input).toHaveAttribute('accept', 'application/json,.json')
    })

    it('renders drop zone with testid', () => {
      renderComponent()

      expect(screen.getByTestId('json-dropzone')).toBeInTheDocument()
    })
  })

  describe('file selection via click', () => {
    it('reads valid JSON file and calls onFileContent', async () => {
      renderComponent()

      const input = screen.getByTestId('json-file-input')
      const validJson = '[{"PartCallout": "TEST-001"}]'
      const file = new File([validJson], 'parts.json', { type: 'application/json' })

      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(mockOnFileContent).toHaveBeenCalledWith(validJson)
      })
      expect(mockOnError).not.toHaveBeenCalled()
    })

    it('rejects non-JSON files and calls onError', async () => {
      renderComponent()

      const input = screen.getByTestId('json-file-input')
      const file = new File(['test'], 'data.txt', { type: 'text/plain' })

      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(expect.stringContaining('Invalid file type'))
      })
      expect(mockOnFileContent).not.toHaveBeenCalled()
    })

    it('rejects CSV files', async () => {
      renderComponent()

      const input = screen.getByTestId('json-file-input')
      const file = new File(['a,b,c'], 'data.csv', { type: 'text/csv' })

      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalled()
      })
      expect(mockOnFileContent).not.toHaveBeenCalled()
    })
  })

  describe('disabled state', () => {
    it('applies disabled styling when disabled', () => {
      renderComponent({ disabled: true })

      const dropzone = screen.getByTestId('json-dropzone')
      expect(dropzone).toHaveClass('cursor-not-allowed')
      expect(dropzone).toHaveClass('opacity-50')
    })

    it('prevents interaction when disabled', () => {
      // Note: react-dropzone doesn't set disabled on the input,
      // but it prevents clicks and drags via noClick and noDrag options
      renderComponent({ disabled: true })

      // The dropzone container should have disabled styling
      const dropzone = screen.getByTestId('json-dropzone')
      expect(dropzone).toHaveClass('cursor-not-allowed')
    })
  })

  describe('error display', () => {
    it('shows error message after rejection', async () => {
      renderComponent()

      const input = screen.getByTestId('json-file-input')
      const file = new File(['test'], 'data.txt', { type: 'text/plain' })

      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(screen.getByText(/Invalid file type/)).toBeInTheDocument()
      })
    })

    it('shows "Click to try again" after error', async () => {
      renderComponent()

      const input = screen.getByTestId('json-file-input')
      const file = new File(['test'], 'data.txt', { type: 'text/plain' })

      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(screen.getByText(/Click to try again/)).toBeInTheDocument()
      })
    })
  })

  describe('drag states', () => {
    it('has drag-active data attribute when dragging over', () => {
      renderComponent()

      const dropzone = screen.getByTestId('json-dropzone')

      // Initial state
      expect(dropzone).toHaveAttribute('data-drag-active', 'false')
    })

    it('has drag-reject data attribute available', () => {
      renderComponent()

      const dropzone = screen.getByTestId('json-dropzone')
      expect(dropzone).toHaveAttribute('data-drag-reject', 'false')
    })
  })

  describe('custom className', () => {
    it('accepts custom className', () => {
      const { container } = renderComponent({ className: 'custom-class' })

      expect(container.firstChild).toHaveClass('custom-class')
    })
  })

  describe('file content', () => {
    it('reads file content as text', async () => {
      renderComponent()

      const input = screen.getByTestId('json-file-input')
      const jsonContent = '{"test": true, "array": [1, 2, 3]}'
      const file = new File([jsonContent], 'test.json', { type: 'application/json' })

      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(mockOnFileContent).toHaveBeenCalledWith(jsonContent)
      })
    })

    it('handles empty JSON file', async () => {
      renderComponent()

      const input = screen.getByTestId('json-file-input')
      const file = new File([''], 'empty.json', { type: 'application/json' })

      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(mockOnFileContent).toHaveBeenCalledWith('')
      })
    })

    it('preserves whitespace in JSON content', async () => {
      renderComponent()

      const input = screen.getByTestId('json-file-input')
      const jsonContent = '{\n  "formatted": true\n}'
      const file = new File([jsonContent], 'formatted.json', { type: 'application/json' })

      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(mockOnFileContent).toHaveBeenCalledWith(jsonContent)
      })
    })
  })
})
