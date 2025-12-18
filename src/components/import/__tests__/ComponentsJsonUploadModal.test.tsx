// src/components/import/__tests__/ComponentsJsonUploadModal.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ComponentsJsonUploadModal } from '../ComponentsJsonUploadModal'
import { componentsRepository } from '@/lib/repositories/componentsRepository'
import { _resetDBConnection } from '@/lib/storage/indexedDBAdapter'
import { _resetMigrationState } from '@/lib/storage/migrateLegacyStorage'
import type { Component, LaserLineProfiler, AreascanCamera, LinescanCamera, SnapshotSensor, Lens } from '@/lib/schemas/component'

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
  }),
}))

describe('ComponentsJsonUploadModal', () => {
  const mockOnOpenChange = vi.fn()
  const mockOnSuccess = vi.fn()
  let queryClient: QueryClient

  const validLaserProfiler: LaserLineProfiler = {
    componentId: 'profiler-001',
    componentType: 'LaserLineProfiler',
    Manufacturer: 'LMI',
    Model: 'Gocator 2330',
    NearFieldLateralFOV_mm: 32,
    MidFieldLateralFOV_mm: 55,
    FarFieldLateralFOV_mm: 88,
    StandoffDistance_mm: 125,
    MeasurementRange_mm: 60,
    PointsPerProfile: 1280,
    LateralResolution_um: 27,
    VerticalResolution_um: 12,
    MaxScanRate_kHz: 5,
  }

  const validAreascanCamera: AreascanCamera = {
    componentId: 'areascan-001',
    componentType: 'AreascanCamera',
    Manufacturer: 'Basler',
    Model: 'a2A5320-23gmPRO',
    ResolutionHorizontal_px: 5320,
    ResolutionVertical_px: 4600,
    PixelSizeHorizontal_um: 2.33,
    PixelSizeVertical_um: 2.33,
    FrameRate_fps: 23,
    LensMount: 'C-Mount',
  }

  const validLinescanCamera: LinescanCamera = {
    componentId: 'linescan-001',
    componentType: 'LinescanCamera',
    Manufacturer: 'Basler',
    Model: 'raL8192-16gm',
    ResolutionHorizontal_px: 8192,
    ResolutionVertical_px: 1,
    PixelSizeHorizontal_um: 7.0,
    PixelSizeVertical_um: 7.0,
    LineRate_kHz: 16,
    LensMount: 'M72',
  }

  const validTelecentricLens: Lens = {
    componentId: 'lens-tele-001',
    componentType: 'Lens',
    LensType: 'Telecentric',
    Manufacturer: 'Opto Engineering',
    Model: 'TC23036',
    Mount: 'C-Mount',
    MaxSensorSize_mm: 11,
    ApertureMin_fnum: 8,
    ApertureMax_fnum: 16,
    Magnification: 0.5,
    WorkingDistance_mm: 65,
    FieldDepth_mm: 2.5,
  }

  const validSnapshotSensor: SnapshotSensor = {
    componentId: 'snapshot-001',
    componentType: 'SnapshotSensor',
    Manufacturer: 'Photoneo',
    Model: 'PhoXi M',
    FOV_X_mm: 382,
    FOV_Y_mm: 286,
    MeasurementRange_mm: 445,
    WorkingDistance_mm: 680,
    XYDataInterval_um: 49,
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
    await componentsRepository.clear()
  })

  afterEach(() => {
    _resetMigrationState()
    _resetDBConnection()
  })

  const renderComponent = (props = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <ComponentsJsonUploadModal
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
          {...props}
        />
      </QueryClientProvider>
    )
  }

  const uploadValidJson = async (components: Component[] = [validLaserProfiler]) => {
    const input = screen.getByTestId('json-file-input')
    const json = JSON.stringify({ Components: components })
    const file = new File([json], 'components.json', { type: 'application/json' })
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
      expect(screen.getByText('Import Components from JSON')).toBeInTheDocument()
    })
  })

  describe('happy path: valid JSON upload - AC-2.4.1', () => {
    it('shows preview after valid JSON upload', async () => {
      renderComponent()
      await uploadValidJson()

      await waitFor(() => {
        expect(screen.getByText('Import Summary')).toBeInTheDocument()
      })
    })

    it('shows valid components count in preview', async () => {
      renderComponent()
      await uploadValidJson([validLaserProfiler, validAreascanCamera])

      await waitFor(() => {
        expect(screen.getByText('2 valid components')).toBeInTheDocument()
      })
    })

    it('shows component model in preview', async () => {
      renderComponent()
      await uploadValidJson()

      await waitFor(() => {
        expect(screen.getByText('Gocator 2330')).toBeInTheDocument()
      })
    })

    it('validates all 5 component types correctly', async () => {
      renderComponent()
      await uploadValidJson([
        validLaserProfiler,
        validAreascanCamera,
        validLinescanCamera,
        validTelecentricLens,
        validSnapshotSensor,
      ])

      await waitFor(() => {
        expect(screen.getByText('5 valid components')).toBeInTheDocument()
      })
    })
  })

  describe('error path: invalid JSON - AC-2.4.2', () => {
    it('shows validation errors for invalid components', async () => {
      renderComponent()

      const input = screen.getByTestId('json-file-input')
      const invalidJson = JSON.stringify({ Components: [{ componentId: '' }] })
      const file = new File([invalidJson], 'invalid.json', { type: 'application/json' })
      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(screen.getByText('Validation Errors')).toBeInTheDocument()
      })
    })

    it('shows retry button on error', async () => {
      renderComponent()

      const input = screen.getByTestId('json-file-input')
      const invalidJson = JSON.stringify({ Components: [{ componentType: 'InvalidType' }] })
      const file = new File([invalidJson], 'invalid.json', { type: 'application/json' })
      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(screen.getByTestId('retry-button')).toBeInTheDocument()
      })
    })

    it('returns to upload view on retry', async () => {
      renderComponent()

      const input = screen.getByTestId('json-file-input')
      const invalidJson = JSON.stringify({ Components: [{ componentType: 'InvalidType' }] })
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

    it('rejects invalid componentType with error display', async () => {
      renderComponent()

      const input = screen.getByTestId('json-file-input')
      const invalidJson = JSON.stringify({
        Components: [{
          componentId: 'test-001',
          componentType: 'InvalidType',
          Manufacturer: 'Test',
          Model: 'Test Model',
        }],
      })
      const file = new File([invalidJson], 'invalid-type.json', { type: 'application/json' })
      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(screen.getByText('Validation Errors')).toBeInTheDocument()
      })
    })
  })

  describe('partial import: mixed valid/invalid - AC-2.4.3', () => {
    it('shows both valid and invalid counts', async () => {
      renderComponent()

      const input = screen.getByTestId('json-file-input')
      const mixedJson = JSON.stringify({
        Components: [validLaserProfiler, { componentType: 'InvalidType', componentId: '' }],
      })
      const file = new File([mixedJson], 'mixed.json', { type: 'application/json' })
      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(screen.getByText('1 valid component')).toBeInTheDocument()
        expect(screen.getByText('1 invalid component')).toBeInTheDocument()
      })
    })

    it('allows importing only valid components', async () => {
      renderComponent()

      const input = screen.getByTestId('json-file-input')
      const mixedJson = JSON.stringify({
        Components: [validLaserProfiler, { componentType: 'InvalidType', componentId: '' }],
      })
      const file = new File([mixedJson], 'mixed.json', { type: 'application/json' })
      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(screen.getByTestId('import-button')).toHaveTextContent('Import 1 Valid Component')
      })
    })
  })

  describe('successful import', () => {
    it('saves components to repository on import', async () => {
      renderComponent()
      await uploadValidJson()

      await waitFor(() => {
        expect(screen.getByTestId('import-button')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId('import-button'))

      await waitFor(async () => {
        const components = await componentsRepository.getAll()
        expect(components).toHaveLength(1)
        expect(components[0].componentId).toBe('profiler-001')
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

  describe('duplicate detection - AC-2.4.3', () => {
    it('shows duplicate dialog when duplicates exist', async () => {
      // Pre-populate with existing component
      await componentsRepository.save(validLaserProfiler)

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

    it('shows duplicate componentIds in dialog', async () => {
      await componentsRepository.save(validLaserProfiler)

      renderComponent()
      await uploadValidJson()

      await waitFor(() => {
        expect(screen.getByTestId('import-button')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId('import-button'))

      await waitFor(() => {
        expect(screen.getByTestId('duplicate-callout-profiler-001')).toBeInTheDocument()
      })
    })

    it('skips duplicates when "Skip Duplicates" chosen', async () => {
      await componentsRepository.save(validLaserProfiler)

      renderComponent()
      await uploadValidJson([validLaserProfiler, validAreascanCamera])

      await waitFor(() => {
        expect(screen.getByTestId('import-button')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId('import-button'))

      await waitFor(() => {
        expect(screen.getByTestId('skip-duplicates-button')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId('skip-duplicates-button'))

      await waitFor(async () => {
        const components = await componentsRepository.getAll()
        expect(components).toHaveLength(2) // Original + new one
        expect(components.map((c) => c.componentId)).toContain('areascan-001')
      })
    })

    it('overwrites duplicates when "Overwrite" chosen', async () => {
      const originalComponent: LaserLineProfiler = { ...validLaserProfiler, MaxScanRate_kHz: 5 }
      await componentsRepository.save(originalComponent)

      const updatedComponent: LaserLineProfiler = { ...validLaserProfiler, MaxScanRate_kHz: 999 }
      renderComponent()
      await uploadValidJson([updatedComponent])

      await waitFor(() => {
        expect(screen.getByTestId('import-button')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId('import-button'))

      await waitFor(() => {
        expect(screen.getByTestId('overwrite-button')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId('overwrite-button'))

      await waitFor(async () => {
        const component = await componentsRepository.getById('profiler-001')
        expect((component as LaserLineProfiler)?.MaxScanRate_kHz).toBe(999)
      })
    })

    // SKIPPED: Story 3-13 open item - Investigate async timing issue with fake-indexeddb
    // Cancel button click doesn't trigger state transition back to upload stage
    // See: docs/sprint-artifacts/3-13-indexeddb-storage.md "Open Items"
    it.skip('returns to upload on cancel from duplicate dialog', async () => {
      await componentsRepository.save(validLaserProfiler)

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
