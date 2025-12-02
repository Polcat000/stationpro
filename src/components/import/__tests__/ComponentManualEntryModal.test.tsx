// src/components/import/__tests__/ComponentManualEntryModal.test.tsx
// Integration tests for ComponentManualEntryModal
// Per AC-2.6.1: Test modal dialog and save flow

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ComponentManualEntryModal } from '../ComponentManualEntryModal'
import { componentsRepository } from '@/lib/repositories/componentsRepository'
import { toast } from 'sonner'

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
  }),
}))

describe('ComponentManualEntryModal', () => {
  const mockOnOpenChange = vi.fn()
  const mockOnSuccess = vi.fn()
  let queryClient: QueryClient

  beforeEach(async () => {
    vi.clearAllMocks()
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    await componentsRepository.clear()
  })

  const renderModal = (props = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <ComponentManualEntryModal
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
          {...props}
        />
      </QueryClientProvider>
    )
  }

  describe('rendering', () => {
    it('renders dialog when open', () => {
      renderModal()
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('does not render when closed', () => {
      renderModal({ open: false })
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('renders modal title', () => {
      renderModal()
      expect(screen.getByText('Add Component Manually')).toBeInTheDocument()
    })

    it('renders modal description', () => {
      renderModal()
      expect(screen.getByText(/enter component details using the guided wizard/i)).toBeInTheDocument()
    })

    it('renders wizard on step 1', () => {
      renderModal()
      expect(screen.getByText(/Step 1 of/i)).toBeInTheDocument()
    })

    it('renders Component ID field', () => {
      renderModal()
      expect(screen.getByLabelText(/Component ID/i)).toBeInTheDocument()
    })
  })

  describe('happy path: LaserLineProfiler', () => {
    const fillLaserProfilerAndSave = async (user: ReturnType<typeof userEvent.setup>) => {
      // Step 1: Basic Info
      await user.type(screen.getByLabelText(/Component ID/i), 'LMI-TEST-001')
      await user.type(screen.getByLabelText(/Manufacturer/i), 'LMI Technologies')
      await user.type(screen.getByLabelText(/^Model$/i), 'Gocator 2512')
      await user.click(screen.getByRole('button', { name: /next/i }))
      await waitFor(() => expect(screen.getByText(/Step 2 of 4/i)).toBeInTheDocument())

      // Step 2: FOV
      await user.type(screen.getByLabelText(/Near Field Lateral FOV/i), '25')
      await user.type(screen.getByLabelText(/Mid Field Lateral FOV/i), '35')
      await user.type(screen.getByLabelText(/Far Field Lateral FOV/i), '45')
      await user.click(screen.getByRole('button', { name: /next/i }))
      await waitFor(() => expect(screen.getByText('Range')).toBeInTheDocument())

      // Step 3: Range
      await user.type(screen.getByLabelText(/Standoff Distance/i), '100')
      await user.type(screen.getByLabelText(/Measurement Range/i), '50')
      await user.click(screen.getByRole('button', { name: /next/i }))
      await waitFor(() => expect(screen.getByText('Resolution')).toBeInTheDocument())

      // Step 4: Resolution
      await user.type(screen.getByLabelText(/Points Per Profile/i), '1280')
      await user.type(screen.getByLabelText(/Lateral Resolution/i), '27.3')
      await user.type(screen.getByLabelText(/Vertical Resolution/i), '3.9')
      await user.type(screen.getByLabelText(/Max Scan Rate/i), '5')
      await user.click(screen.getByRole('button', { name: /save/i }))
    }

    it('saves LaserLineProfiler to repository', async () => {
      const user = userEvent.setup()
      renderModal()

      await fillLaserProfilerAndSave(user)

      await waitFor(async () => {
        const components = await componentsRepository.getAll()
        expect(components).toHaveLength(1)
        expect(components[0].componentId).toBe('LMI-TEST-001')
        expect(components[0].componentType).toBe('LaserLineProfiler')
      })
    })

    it('shows success toast after save', async () => {
      const user = userEvent.setup()
      renderModal()

      await fillLaserProfilerAndSave(user)

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          expect.stringContaining('LMI-TEST-001')
        )
      })
    })

    it('closes modal after successful save', async () => {
      const user = userEvent.setup()
      renderModal()

      await fillLaserProfilerAndSave(user)

      await waitFor(() => {
        expect(mockOnOpenChange).toHaveBeenCalledWith(false)
      })
    })

    it('calls onSuccess callback after save', async () => {
      const user = userEvent.setup()
      renderModal()

      await fillLaserProfilerAndSave(user)

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled()
      })
    })

    it('invalidates components query cache after save', async () => {
      const user = userEvent.setup()
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
      renderModal()

      await fillLaserProfilerAndSave(user)

      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['components'] })
      })
    })

    it('saves LaserLineProfiler with all required fields', async () => {
      const user = userEvent.setup()
      renderModal()

      await fillLaserProfilerAndSave(user)

      await waitFor(async () => {
        const components = await componentsRepository.getAll()
        expect(components[0]).toMatchObject({
          componentType: 'LaserLineProfiler',
          componentId: 'LMI-TEST-001',
          Manufacturer: 'LMI Technologies',
          Model: 'Gocator 2512',
          NearFieldLateralFOV_mm: 25,
          MidFieldLateralFOV_mm: 35,
          FarFieldLateralFOV_mm: 45,
          StandoffDistance_mm: 100,
          MeasurementRange_mm: 50,
          PointsPerProfile: 1280,
          LateralResolution_um: 27.3,
          VerticalResolution_um: 3.9,
          MaxScanRate_kHz: 5,
        })
      })
    })
  })

  describe('happy path: LinescanCamera', () => {
    const fillLinescanCameraAndSave = async (user: ReturnType<typeof userEvent.setup>) => {
      // Select LinescanCamera
      const trigger = screen.getByRole('combobox', { name: /component type/i })
      await user.click(trigger)
      await user.click(screen.getByRole('option', { name: /Linescan Camera/i }))

      // Step 1
      await user.type(screen.getByLabelText(/Component ID/i), 'BASLER-LS-001')
      await user.type(screen.getByLabelText(/Manufacturer/i), 'Basler')
      await user.type(screen.getByLabelText(/^Model$/i), 'raL4096-24gm')
      await user.click(screen.getByRole('button', { name: /next/i }))
      await waitFor(() => expect(screen.getByText(/Step 2 of 3/i)).toBeInTheDocument())

      // Step 2: Resolution
      await user.type(screen.getByLabelText(/Horizontal Resolution/i), '4096')
      await user.type(screen.getByLabelText(/Pixel Size Horizontal/i), '5.5')
      await user.type(screen.getByLabelText(/Pixel Size Vertical/i), '5.5')
      await user.click(screen.getByRole('button', { name: /next/i }))
      await waitFor(() => expect(screen.getByText('Performance')).toBeInTheDocument())

      // Step 3: Performance
      await user.type(screen.getByLabelText(/Line Rate/i), '140')
      await user.type(screen.getByLabelText(/Lens Mount/i), 'C')
      await user.click(screen.getByRole('button', { name: /save/i }))
    }

    it('saves LinescanCamera with ResolutionVertical_px=1', async () => {
      const user = userEvent.setup()
      renderModal()

      await fillLinescanCameraAndSave(user)

      await waitFor(async () => {
        const components = await componentsRepository.getAll()
        expect(components).toHaveLength(1)
        expect(components[0]).toMatchObject({
          componentType: 'LinescanCamera',
          componentId: 'BASLER-LS-001',
          ResolutionHorizontal_px: 4096,
          ResolutionVertical_px: 1, // Auto-added default
          PixelSizeHorizontal_um: 5.5,
          PixelSizeVertical_um: 5.5,
          LineRate_kHz: 140,
          LensMount: 'C',
        })
      })
    })
  })

  describe('happy path: AreascanCamera', () => {
    const fillAreascanCameraAndSave = async (user: ReturnType<typeof userEvent.setup>) => {
      // Select AreascanCamera
      const trigger = screen.getByRole('combobox', { name: /component type/i })
      await user.click(trigger)
      await user.click(screen.getByRole('option', { name: /Areascan Camera/i }))

      // Step 1
      await user.type(screen.getByLabelText(/Component ID/i), 'BASLER-AS-001')
      await user.type(screen.getByLabelText(/Manufacturer/i), 'Basler')
      await user.type(screen.getByLabelText(/^Model$/i), 'acA2500-14gm')
      await user.click(screen.getByRole('button', { name: /next/i }))
      await waitFor(() => expect(screen.getByText(/Step 2 of 3/i)).toBeInTheDocument())

      // Step 2: Resolution
      await user.type(screen.getByLabelText(/Horizontal Resolution/i), '2500')
      await user.type(screen.getByLabelText(/Vertical Resolution/i), '2000')
      await user.type(screen.getByLabelText(/Pixel Size Horizontal/i), '3.45')
      await user.type(screen.getByLabelText(/Pixel Size Vertical/i), '3.45')
      await user.click(screen.getByRole('button', { name: /next/i }))
      await waitFor(() => expect(screen.getByText('Performance')).toBeInTheDocument())

      // Step 3: Performance
      await user.type(screen.getByLabelText(/Frame Rate/i), '60')
      await user.type(screen.getByLabelText(/Lens Mount/i), 'C')
      await user.click(screen.getByRole('button', { name: /save/i }))
    }

    it('saves AreascanCamera with all required fields', async () => {
      const user = userEvent.setup()
      renderModal()

      await fillAreascanCameraAndSave(user)

      await waitFor(async () => {
        const components = await componentsRepository.getAll()
        expect(components[0]).toMatchObject({
          componentType: 'AreascanCamera',
          componentId: 'BASLER-AS-001',
          ResolutionHorizontal_px: 2500,
          ResolutionVertical_px: 2000,
          PixelSizeHorizontal_um: 3.45,
          PixelSizeVertical_um: 3.45,
          FrameRate_fps: 60,
          LensMount: 'C',
        })
      })
    })
  })

  describe('happy path: TelecentricLens', () => {
    const fillTelecentricLensAndSave = async (user: ReturnType<typeof userEvent.setup>) => {
      // Select Lens
      const trigger = screen.getByRole('combobox', { name: /component type/i })
      await user.click(trigger)
      await user.click(screen.getByRole('option', { name: /^Lens$/i }))

      // Select Telecentric
      await waitFor(() => expect(screen.getByLabelText(/Lens Type/i)).toBeInTheDocument())
      const lensTypeTrigger = screen.getByRole('combobox', { name: /lens type/i })
      await user.click(lensTypeTrigger)
      await user.click(screen.getByRole('option', { name: /Telecentric/i }))

      // Step 1
      await user.type(screen.getByLabelText(/Component ID/i), 'TC-LENS-001')
      await user.type(screen.getByLabelText(/Manufacturer/i), 'Edmund Optics')
      await user.type(screen.getByLabelText(/^Model$/i), 'TC12M36')
      await user.click(screen.getByRole('button', { name: /next/i }))
      await waitFor(() => expect(screen.getByText(/Step 2 of 3/i)).toBeInTheDocument())

      // Step 2: Lens Base
      await user.type(screen.getByLabelText(/^Mount$/i), 'C')
      await user.type(screen.getByLabelText(/Max Sensor Size/i), '11')
      await user.type(screen.getByLabelText(/Minimum Aperture/i), '4')
      await user.type(screen.getByLabelText(/Maximum Aperture/i), '16')
      await user.click(screen.getByRole('button', { name: /next/i }))
      await waitFor(() => expect(screen.getByText(/Telecentric Details/i)).toBeInTheDocument())

      // Step 3: Telecentric specific
      await user.type(screen.getByLabelText(/Magnification/i), '1.0')
      await user.type(screen.getByLabelText(/Working Distance/i), '65')
      await user.type(screen.getByLabelText(/Field Depth/i), '5')
      await user.click(screen.getByRole('button', { name: /save/i }))
    }

    it('saves TelecentricLens with all required fields', async () => {
      const user = userEvent.setup()
      renderModal()

      await fillTelecentricLensAndSave(user)

      await waitFor(async () => {
        const components = await componentsRepository.getAll()
        expect(components[0]).toMatchObject({
          componentType: 'Lens',
          LensType: 'Telecentric',
          componentId: 'TC-LENS-001',
          Mount: 'C',
          MaxSensorSize_mm: 11,
          ApertureMin_fnum: 4,
          ApertureMax_fnum: 16,
          Magnification: 1.0,
          WorkingDistance_mm: 65,
          FieldDepth_mm: 5,
        })
      })
    })
  })

  describe('happy path: FixedFocalLengthLens', () => {
    const fillFixedFocalLensAndSave = async (user: ReturnType<typeof userEvent.setup>) => {
      // Select Lens
      const trigger = screen.getByRole('combobox', { name: /component type/i })
      await user.click(trigger)
      await user.click(screen.getByRole('option', { name: /^Lens$/i }))

      // Select FixedFocalLength
      await waitFor(() => expect(screen.getByLabelText(/Lens Type/i)).toBeInTheDocument())
      const lensTypeTrigger = screen.getByRole('combobox', { name: /lens type/i })
      await user.click(lensTypeTrigger)
      await user.click(screen.getByRole('option', { name: /Fixed Focal Length/i }))

      // Step 1
      await user.type(screen.getByLabelText(/Component ID/i), 'FF-LENS-001')
      await user.type(screen.getByLabelText(/Manufacturer/i), 'Tamron')
      await user.type(screen.getByLabelText(/^Model$/i), 'M118FM50')
      await user.click(screen.getByRole('button', { name: /next/i }))
      await waitFor(() => expect(screen.getByText(/Step 2 of 3/i)).toBeInTheDocument())

      // Step 2: Lens Base
      await user.type(screen.getByLabelText(/^Mount$/i), 'C')
      await user.type(screen.getByLabelText(/Max Sensor Size/i), '11')
      await user.type(screen.getByLabelText(/Minimum Aperture/i), '2.8')
      await user.type(screen.getByLabelText(/Maximum Aperture/i), '22')
      await user.click(screen.getByRole('button', { name: /next/i }))
      await waitFor(() => expect(screen.getByText(/Fixed Focal Details/i)).toBeInTheDocument())

      // Step 3: Fixed Focal specific
      await user.type(screen.getByLabelText(/Focal Length/i), '50')
      await user.type(screen.getByLabelText(/Minimum Working Distance/i), '200')
      await user.click(screen.getByRole('button', { name: /save/i }))
    }

    it('saves FixedFocalLengthLens with all required fields', async () => {
      const user = userEvent.setup()
      renderModal()

      await fillFixedFocalLensAndSave(user)

      await waitFor(async () => {
        const components = await componentsRepository.getAll()
        expect(components[0]).toMatchObject({
          componentType: 'Lens',
          LensType: 'FixedFocalLength',
          componentId: 'FF-LENS-001',
          Mount: 'C',
          MaxSensorSize_mm: 11,
          ApertureMin_fnum: 2.8,
          ApertureMax_fnum: 22,
          FocalLength_mm: 50,
          WorkingDistanceMin_mm: 200,
        })
      })
    })
  })

  describe('happy path: SnapshotSensor', () => {
    const fillSnapshotSensorAndSave = async (user: ReturnType<typeof userEvent.setup>) => {
      // Select SnapshotSensor
      const trigger = screen.getByRole('combobox', { name: /component type/i })
      await user.click(trigger)
      await user.click(screen.getByRole('option', { name: /Snapshot Sensor/i }))

      // Step 1
      await user.type(screen.getByLabelText(/Component ID/i), 'KEYENCE-001')
      await user.type(screen.getByLabelText(/Manufacturer/i), 'Keyence')
      await user.type(screen.getByLabelText(/^Model$/i), 'VR-6000')
      await user.click(screen.getByRole('button', { name: /next/i }))
      await waitFor(() => expect(screen.getByText(/Step 2 of 3/i)).toBeInTheDocument())

      // Step 2: FOV
      await user.type(screen.getByLabelText(/FOV X/i), '60')
      await user.type(screen.getByLabelText(/FOV Y/i), '45')
      await user.type(screen.getByLabelText(/XY Data Interval/i), '10')
      await user.click(screen.getByRole('button', { name: /next/i }))
      await waitFor(() => expect(screen.getByText('Range')).toBeInTheDocument())

      // Step 3: Range
      await user.type(screen.getByLabelText(/Measurement Range/i), '25')
      await user.type(screen.getByLabelText(/Working Distance/i), '100')
      await user.click(screen.getByRole('button', { name: /save/i }))
    }

    it('saves SnapshotSensor with all required fields', async () => {
      const user = userEvent.setup()
      renderModal()

      await fillSnapshotSensorAndSave(user)

      await waitFor(async () => {
        const components = await componentsRepository.getAll()
        expect(components[0]).toMatchObject({
          componentType: 'SnapshotSensor',
          componentId: 'KEYENCE-001',
          Manufacturer: 'Keyence',
          Model: 'VR-6000',
          FOV_X_mm: 60,
          FOV_Y_mm: 45,
          XYDataInterval_um: 10,
          MeasurementRange_mm: 25,
          WorkingDistance_mm: 100,
        })
      })
    })
  })

  describe('validation errors', () => {
    it('shows validation error on step 1 for empty componentId', async () => {
      const user = userEvent.setup()
      renderModal()

      await user.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        expect(screen.getByText(/Component ID is required/i)).toBeInTheDocument()
      })
    })

    it('shows validation error on step 2 for missing fields', async () => {
      const user = userEvent.setup()
      renderModal()

      await user.type(screen.getByLabelText(/Component ID/i), 'TEST')
      await user.type(screen.getByLabelText(/Manufacturer/i), 'Test')
      await user.type(screen.getByLabelText(/^Model$/i), 'Test')
      await user.click(screen.getByRole('button', { name: /next/i }))
      await waitFor(() => expect(screen.getByText(/Step 2 of 4/i)).toBeInTheDocument())

      await user.click(screen.getByRole('button', { name: /next/i }))

      // Should stay on step 2 with validation errors
      expect(screen.getByText(/Step 2 of 4/i)).toBeInTheDocument()
    })
  })

  describe('cancel behavior', () => {
    it('closes modal when clicking Cancel on step 1', async () => {
      const user = userEvent.setup()
      renderModal()

      await user.click(screen.getByRole('button', { name: /cancel/i }))

      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    })

    it('does not save data when cancelled', async () => {
      const user = userEvent.setup()
      renderModal()

      await user.type(screen.getByLabelText(/Component ID/i), 'WILL-NOT-SAVE')
      await user.click(screen.getByRole('button', { name: /cancel/i }))

      const components = await componentsRepository.getAll()
      expect(components).toHaveLength(0)
    })
  })

  describe('form state reset', () => {
    it('resets form when modal reopens', async () => {
      const user = userEvent.setup()
      const { rerender } = renderModal()

      // Fill in some data
      await user.type(screen.getByLabelText(/Component ID/i), 'OLD-DATA')

      // Close modal
      rerender(
        <QueryClientProvider client={queryClient}>
          <ComponentManualEntryModal
            open={false}
            onOpenChange={mockOnOpenChange}
            onSuccess={mockOnSuccess}
          />
        </QueryClientProvider>
      )

      // Reopen modal
      rerender(
        <QueryClientProvider client={queryClient}>
          <ComponentManualEntryModal
            open={true}
            onOpenChange={mockOnOpenChange}
            onSuccess={mockOnSuccess}
          />
        </QueryClientProvider>
      )

      // Form should be reset
      await waitFor(() => {
        expect(screen.getByLabelText(/Component ID/i)).toHaveValue('')
      })
    })
  })

  describe('navigation', () => {
    it('Back button navigates to previous step', async () => {
      const user = userEvent.setup()
      renderModal()

      await user.type(screen.getByLabelText(/Component ID/i), 'TEST')
      await user.type(screen.getByLabelText(/Manufacturer/i), 'Test')
      await user.type(screen.getByLabelText(/^Model$/i), 'Test')
      await user.click(screen.getByRole('button', { name: /next/i }))
      await waitFor(() => expect(screen.getByText(/Step 2 of 4/i)).toBeInTheDocument())

      await user.click(screen.getByRole('button', { name: /back/i }))

      await waitFor(() => {
        expect(screen.getByText(/Step 1 of 4/i)).toBeInTheDocument()
      })
    })

    it('preserves data when navigating back', async () => {
      const user = userEvent.setup()
      renderModal()

      await user.type(screen.getByLabelText(/Component ID/i), 'MY-COMPONENT')
      await user.type(screen.getByLabelText(/Manufacturer/i), 'My Mfg')
      await user.type(screen.getByLabelText(/^Model$/i), 'My Model')
      await user.click(screen.getByRole('button', { name: /next/i }))
      await waitFor(() => expect(screen.getByText(/Step 2 of 4/i)).toBeInTheDocument())

      await user.click(screen.getByRole('button', { name: /back/i }))
      await waitFor(() => expect(screen.getByText(/Step 1 of 4/i)).toBeInTheDocument())

      expect(screen.getByLabelText(/Component ID/i)).toHaveValue('MY-COMPONENT')
      expect(screen.getByLabelText(/Manufacturer/i)).toHaveValue('My Mfg')
    })
  })
})
