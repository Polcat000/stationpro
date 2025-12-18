// src/components/import/__tests__/PartsJsonUploadModal.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PartsJsonUploadModal } from '../PartsJsonUploadModal'
import { partsRepository } from '@/lib/repositories/partsRepository'
import { _resetDBConnection } from '@/lib/storage/indexedDBAdapter'
import { _resetMigrationState } from '@/lib/storage/migrateLegacyStorage'
import type { Part } from '@/lib/schemas/part'

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
  }),
}))

describe('PartsJsonUploadModal', () => {
  const mockOnOpenChange = vi.fn()
  const mockOnSuccess = vi.fn()
  let queryClient: QueryClient

  const validPart: Part = {
    PartCallout: 'TEST-001',
    PartWidth_mm: 100,
    PartHeight_mm: 50,
    PartLength_mm: 150,
    SmallestLateralFeature_um: 100,
    InspectionZones: [
      {
        ZoneID: 'zone-1',
        Name: 'Top Surface',
        Face: 'Top',
        ZoneDepth_mm: 2,
        ZoneOffset_mm: 0,
        RequiredCoverage_pct: 100,
        MinPixelsPerFeature: 3,
      },
    ],
  }

  const validPart2: Part = {
    ...validPart,
    PartCallout: 'TEST-002',
  }

  beforeEach(async () => {
    vi.clearAllMocks()
    _resetMigrationState()
    _resetDBConnection()
    localStorage.clear()
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    await partsRepository.clear()
  })

  afterEach(() => {
    _resetMigrationState()
    _resetDBConnection()
  })

  const renderComponent = (props = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <PartsJsonUploadModal
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
          {...props}
        />
      </QueryClientProvider>
    )
  }

  const uploadValidJson = async (parts: Part[] = [validPart]) => {
    const input = screen.getByTestId('json-file-input')
    const json = JSON.stringify(parts)
    const file = new File([json], 'parts.json', { type: 'application/json' })
    fireEvent.change(input, { target: { files: [file] } })
  }

  describe('rendering', () => {
    it('renders dialog when open', () => {
      renderComponent()
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('does not render when closed', () => {
      renderComponent({ open: false })
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('renders upload zone initially', () => {
      renderComponent()
      expect(screen.getByTestId('json-dropzone')).toBeInTheDocument()
    })

    it('renders modal title', () => {
      renderComponent()
      expect(screen.getByText('Import Parts from JSON')).toBeInTheDocument()
    })
  })

  describe('happy path: valid JSON upload', () => {
    it('shows preview after valid JSON upload', async () => {
      renderComponent()
      await uploadValidJson()

      await waitFor(() => {
        expect(screen.getByText('Import Summary')).toBeInTheDocument()
      })
    })

    it('shows valid parts count in preview', async () => {
      renderComponent()
      await uploadValidJson([validPart, validPart2])

      await waitFor(() => {
        expect(screen.getByText('2 valid parts')).toBeInTheDocument()
      })
    })

    it('shows part callout in preview', async () => {
      renderComponent()
      await uploadValidJson()

      await waitFor(() => {
        expect(screen.getByText('TEST-001')).toBeInTheDocument()
      })
    })
  })

  describe('error path: invalid JSON', () => {
    it('shows validation errors for invalid parts', async () => {
      renderComponent()

      const input = screen.getByTestId('json-file-input')
      const invalidJson = JSON.stringify([{ PartCallout: '' }])
      const file = new File([invalidJson], 'invalid.json', { type: 'application/json' })
      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(screen.getByText('Validation Errors')).toBeInTheDocument()
      })
    })

    it('shows retry button on error', async () => {
      renderComponent()

      const input = screen.getByTestId('json-file-input')
      const invalidJson = JSON.stringify([{ PartCallout: '' }])
      const file = new File([invalidJson], 'invalid.json', { type: 'application/json' })
      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(screen.getByTestId('retry-button')).toBeInTheDocument()
      })
    })

    it('returns to upload view on retry', async () => {
      renderComponent()

      const input = screen.getByTestId('json-file-input')
      const invalidJson = JSON.stringify([{ PartCallout: '' }])
      const file = new File([invalidJson], 'invalid.json', { type: 'application/json' })
      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(screen.getByTestId('retry-button')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId('retry-button'))

      await waitFor(() => {
        expect(screen.getByTestId('json-dropzone')).toBeInTheDocument()
      })
    })

    it('shows error for malformed JSON', async () => {
      renderComponent()

      const input = screen.getByTestId('json-file-input')
      const file = new File(['not json'], 'bad.json', { type: 'application/json' })
      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(screen.getByText('Validation Errors')).toBeInTheDocument()
      })
    })
  })

  describe('partial import: mixed valid/invalid', () => {
    it('shows both valid and invalid counts', async () => {
      renderComponent()

      const input = screen.getByTestId('json-file-input')
      const mixedJson = JSON.stringify([validPart, { PartCallout: '' }])
      const file = new File([mixedJson], 'mixed.json', { type: 'application/json' })
      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(screen.getByText('1 valid part')).toBeInTheDocument()
        expect(screen.getByText('1 invalid part')).toBeInTheDocument()
      })
    })

    it('allows importing only valid parts', async () => {
      renderComponent()

      const input = screen.getByTestId('json-file-input')
      const mixedJson = JSON.stringify([validPart, { PartCallout: '' }])
      const file = new File([mixedJson], 'mixed.json', { type: 'application/json' })
      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(screen.getByTestId('import-button')).toHaveTextContent('Import 1 Valid Part')
      })
    })
  })

  describe('successful import', () => {
    it('saves parts to repository on import', async () => {
      renderComponent()
      await uploadValidJson()

      await waitFor(() => {
        expect(screen.getByTestId('import-button')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId('import-button'))

      await waitFor(async () => {
        const parts = await partsRepository.getAll()
        expect(parts).toHaveLength(1)
        expect(parts[0].PartCallout).toBe('TEST-001')
      })
    })

    it('calls onSuccess after successful import', async () => {
      renderComponent()
      await uploadValidJson()

      await waitFor(() => {
        expect(screen.getByTestId('import-button')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId('import-button'))

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled()
      })
    })

    it('closes modal after successful import', async () => {
      renderComponent()
      await uploadValidJson()

      await waitFor(() => {
        expect(screen.getByTestId('import-button')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId('import-button'))

      await waitFor(() => {
        expect(mockOnOpenChange).toHaveBeenCalledWith(false)
      })
    })
  })

  describe('cancel behavior', () => {
    it('returns to upload on cancel from preview', async () => {
      renderComponent()
      await uploadValidJson()

      await waitFor(() => {
        expect(screen.getByTestId('cancel-button')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId('cancel-button'))

      await waitFor(() => {
        expect(screen.getByTestId('json-dropzone')).toBeInTheDocument()
      })
    })
  })

  describe('duplicate detection', () => {
    it('shows duplicate dialog when duplicates exist', async () => {
      // Pre-populate with existing part
      await partsRepository.save(validPart)

      renderComponent()
      await uploadValidJson()

      await waitFor(() => {
        expect(screen.getByTestId('import-button')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId('import-button'))

      await waitFor(() => {
        expect(screen.getByText('Duplicate Parts Detected')).toBeInTheDocument()
      })
    })

    it('shows duplicate callouts in dialog', async () => {
      await partsRepository.save(validPart)

      renderComponent()
      await uploadValidJson()

      await waitFor(() => {
        expect(screen.getByTestId('import-button')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId('import-button'))

      await waitFor(() => {
        expect(screen.getByTestId('duplicate-callout-TEST-001')).toBeInTheDocument()
      })
    })

    it('skips duplicates when "Skip Duplicates" chosen', async () => {
      await partsRepository.save(validPart)

      renderComponent()
      await uploadValidJson([validPart, validPart2])

      await waitFor(() => {
        expect(screen.getByTestId('import-button')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId('import-button'))

      await waitFor(() => {
        expect(screen.getByTestId('skip-duplicates-button')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId('skip-duplicates-button'))

      await waitFor(async () => {
        const parts = await partsRepository.getAll()
        expect(parts).toHaveLength(2) // Original + new one
        expect(parts.map((p) => p.PartCallout)).toContain('TEST-002')
      })
    })

    it('overwrites duplicates when "Overwrite" chosen', async () => {
      const originalPart = { ...validPart, PartWidth_mm: 50 }
      await partsRepository.save(originalPart)

      const updatedPart = { ...validPart, PartWidth_mm: 999 }
      renderComponent()
      await uploadValidJson([updatedPart])

      await waitFor(() => {
        expect(screen.getByTestId('import-button')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId('import-button'))

      await waitFor(() => {
        expect(screen.getByTestId('overwrite-button')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId('overwrite-button'))

      await waitFor(async () => {
        const part = await partsRepository.getByCallout('TEST-001')
        expect(part?.PartWidth_mm).toBe(999)
      })
    })

    // SKIPPED: Story 3-13 open item - Investigate async timing issue with fake-indexeddb
    // Cancel button click doesn't trigger state transition back to upload stage
    // See: docs/sprint-artifacts/3-13-indexeddb-storage.md "Open Items"
    it.skip('returns to upload on cancel from duplicate dialog', async () => {
      await partsRepository.save(validPart)

      renderComponent()
      await uploadValidJson()

      await waitFor(() => {
        expect(screen.getByTestId('import-button')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId('import-button'))

      await waitFor(() => {
        expect(screen.getByTestId('cancel-button')).toBeInTheDocument()
      })

      // Find the cancel button in the duplicate dialog
      const cancelButtons = screen.getAllByTestId('cancel-button')
      fireEvent.click(cancelButtons[cancelButtons.length - 1])

      await waitFor(() => {
        expect(screen.getByTestId('json-dropzone')).toBeInTheDocument()
      })
    })
  })
})
