// src/components/wizards/__tests__/ComponentEntryWizard.test.tsx
// Per AC-2.6.1: Test componentType selection changes visible steps
// Per AC-2.6.2: Test type-specific validation

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ComponentEntryWizard } from '../ComponentEntryWizard'

describe('ComponentEntryWizard', () => {
  const mockOnComplete = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  const renderWizard = (props = {}) => {
    return render(
      <ComponentEntryWizard
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
        {...props}
      />
    )
  }

  describe('rendering', () => {
    it('renders step indicator', () => {
      renderWizard()
      expect(screen.getByText(/Step 1 of/i)).toBeInTheDocument()
    })

    it('starts on step 1 with Component Info title', () => {
      renderWizard()
      expect(screen.getByText('Component Info')).toBeInTheDocument()
    })

    it('renders Component Type selector', () => {
      renderWizard()
      expect(screen.getByLabelText(/Component Type/i)).toBeInTheDocument()
    })

    it('renders componentId field', () => {
      renderWizard()
      expect(screen.getByLabelText(/Component ID/i)).toBeInTheDocument()
    })

    it('renders Manufacturer field', () => {
      renderWizard()
      expect(screen.getByLabelText(/Manufacturer/i)).toBeInTheDocument()
    })

    it('renders Model field', () => {
      renderWizard()
      expect(screen.getByLabelText(/^Model$/i)).toBeInTheDocument()
    })

    it('renders Part Number field', () => {
      renderWizard()
      expect(screen.getByLabelText(/Part Number/i)).toBeInTheDocument()
    })

    it('shows Cancel button on step 1', () => {
      renderWizard()
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    })

    it('shows Next button on step 1', () => {
      renderWizard()
      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument()
    })
  })

  describe('component type selector', () => {
    it('shows 5 component type options', async () => {
      const user = userEvent.setup()
      renderWizard()

      // Open the select dropdown
      const trigger = screen.getByRole('combobox', { name: /component type/i })
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByRole('option', { name: /Laser Line Profiler/i })).toBeInTheDocument()
        expect(screen.getByRole('option', { name: /Linescan Camera/i })).toBeInTheDocument()
        expect(screen.getByRole('option', { name: /Areascan Camera/i })).toBeInTheDocument()
        expect(screen.getByRole('option', { name: /^Lens$/i })).toBeInTheDocument()
        expect(screen.getByRole('option', { name: /Snapshot Sensor/i })).toBeInTheDocument()
      })
    })

    it('defaults to LaserLineProfiler showing 4 steps', () => {
      renderWizard()
      expect(screen.getByText(/Step 1 of 4/i)).toBeInTheDocument()
    })

    it('shows LensType selector when Lens type is selected', async () => {
      const user = userEvent.setup()
      renderWizard()

      const trigger = screen.getByRole('combobox', { name: /component type/i })
      await user.click(trigger)
      await user.click(screen.getByRole('option', { name: /^Lens$/i }))

      await waitFor(() => {
        expect(screen.getByLabelText(/Lens Type/i)).toBeInTheDocument()
      })
    })
  })

  describe('step configuration by component type', () => {
    it('LaserLineProfiler has 4 steps', () => {
      renderWizard()
      expect(screen.getByText(/Step 1 of 4/i)).toBeInTheDocument()
    })

    it('LinescanCamera has 3 steps', async () => {
      const user = userEvent.setup()
      renderWizard()

      const trigger = screen.getByRole('combobox', { name: /component type/i })
      await user.click(trigger)
      await user.click(screen.getByRole('option', { name: /Linescan Camera/i }))

      await waitFor(() => {
        expect(screen.getByText(/Step 1 of 3/i)).toBeInTheDocument()
      })
    })

    it('AreascanCamera has 3 steps', async () => {
      const user = userEvent.setup()
      renderWizard()

      const trigger = screen.getByRole('combobox', { name: /component type/i })
      await user.click(trigger)
      await user.click(screen.getByRole('option', { name: /Areascan Camera/i }))

      await waitFor(() => {
        expect(screen.getByText(/Step 1 of 3/i)).toBeInTheDocument()
      })
    })

    it('Lens has 3 steps', async () => {
      const user = userEvent.setup()
      renderWizard()

      const trigger = screen.getByRole('combobox', { name: /component type/i })
      await user.click(trigger)
      await user.click(screen.getByRole('option', { name: /^Lens$/i }))

      await waitFor(() => {
        expect(screen.getByText(/Step 1 of 3/i)).toBeInTheDocument()
      })
    })

    it('SnapshotSensor has 3 steps', async () => {
      const user = userEvent.setup()
      renderWizard()

      const trigger = screen.getByRole('combobox', { name: /component type/i })
      await user.click(trigger)
      await user.click(screen.getByRole('option', { name: /Snapshot Sensor/i }))

      await waitFor(() => {
        expect(screen.getByText(/Step 1 of 3/i)).toBeInTheDocument()
      })
    })
  })

  describe('step 1 validation', () => {
    it('prevents advancing without required fields', async () => {
      const user = userEvent.setup()
      renderWizard()

      await user.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        expect(screen.getByText(/Component ID is required/i)).toBeInTheDocument()
      })
      expect(screen.getByText(/Step 1 of 4/i)).toBeInTheDocument()
    })

    it('advances to step 2 with valid base fields', async () => {
      const user = userEvent.setup()
      renderWizard()

      await user.type(screen.getByLabelText(/Component ID/i), 'LMI-G2-500')
      await user.type(screen.getByLabelText(/Manufacturer/i), 'LMI Technologies')
      await user.type(screen.getByLabelText(/^Model$/i), 'Gocator 2512')
      await user.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        expect(screen.getByText(/Step 2 of 4/i)).toBeInTheDocument()
      })
    })
  })

  describe('LaserLineProfiler flow', () => {
    const fillStep1 = async (user: ReturnType<typeof userEvent.setup>) => {
      await user.type(screen.getByLabelText(/Component ID/i), 'LMI-G2-500')
      await user.type(screen.getByLabelText(/Manufacturer/i), 'LMI Technologies')
      await user.type(screen.getByLabelText(/^Model$/i), 'Gocator 2512')
      await user.click(screen.getByRole('button', { name: /next/i }))
      await waitFor(() => expect(screen.getByText(/Step 2 of 4/i)).toBeInTheDocument())
    }

    it('step 2 shows FOV fields', async () => {
      const user = userEvent.setup()
      renderWizard()
      await fillStep1(user)

      expect(screen.getByText('Field of View')).toBeInTheDocument()
      expect(screen.getByLabelText(/Near Field Lateral FOV/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Mid Field Lateral FOV/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Far Field Lateral FOV/i)).toBeInTheDocument()
    })

    it('step 3 shows Range fields', async () => {
      const user = userEvent.setup()
      renderWizard()
      await fillStep1(user)

      // Fill step 2
      await user.type(screen.getByLabelText(/Near Field Lateral FOV/i), '25')
      await user.type(screen.getByLabelText(/Mid Field Lateral FOV/i), '35')
      await user.type(screen.getByLabelText(/Far Field Lateral FOV/i), '45')
      await user.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        expect(screen.getByText('Range')).toBeInTheDocument()
        expect(screen.getByLabelText(/Standoff Distance/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/Measurement Range/i)).toBeInTheDocument()
      })
    })

    it('step 4 shows Resolution fields and Save button', async () => {
      const user = userEvent.setup()
      renderWizard()
      await fillStep1(user)

      // Fill step 2
      await user.type(screen.getByLabelText(/Near Field Lateral FOV/i), '25')
      await user.type(screen.getByLabelText(/Mid Field Lateral FOV/i), '35')
      await user.type(screen.getByLabelText(/Far Field Lateral FOV/i), '45')
      await user.click(screen.getByRole('button', { name: /next/i }))
      await waitFor(() => expect(screen.getByText('Range')).toBeInTheDocument())

      // Fill step 3
      await user.type(screen.getByLabelText(/Standoff Distance/i), '100')
      await user.type(screen.getByLabelText(/Measurement Range/i), '50')
      await user.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        expect(screen.getByText('Resolution')).toBeInTheDocument()
        expect(screen.getByLabelText(/Points Per Profile/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/Lateral Resolution/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/Vertical Resolution/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/Max Scan Rate/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
      })
    })
  })

  describe('LinescanCamera flow', () => {
    const fillStep1Linescan = async (user: ReturnType<typeof userEvent.setup>) => {
      const trigger = screen.getByRole('combobox', { name: /component type/i })
      await user.click(trigger)
      await user.click(screen.getByRole('option', { name: /Linescan Camera/i }))
      await waitFor(() => expect(screen.getByText(/Step 1 of 3/i)).toBeInTheDocument())

      await user.type(screen.getByLabelText(/Component ID/i), 'BASLER-LS')
      await user.type(screen.getByLabelText(/Manufacturer/i), 'Basler')
      await user.type(screen.getByLabelText(/^Model$/i), 'raL4096-24gm')
      await user.click(screen.getByRole('button', { name: /next/i }))
      await waitFor(() => expect(screen.getByText(/Step 2 of 3/i)).toBeInTheDocument())
    }

    it('step 2 shows Resolution fields (no vertical resolution for linescan)', async () => {
      const user = userEvent.setup()
      renderWizard()
      await fillStep1Linescan(user)

      expect(screen.getByText('Resolution')).toBeInTheDocument()
      expect(screen.getByLabelText(/Horizontal Resolution/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Pixel Size Horizontal/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Pixel Size Vertical/i)).toBeInTheDocument()
      // No vertical resolution for linescan
      expect(screen.queryByLabelText(/^Vertical Resolution/i)).not.toBeInTheDocument()
    })

    it('step 3 shows Performance fields with Line Rate', async () => {
      const user = userEvent.setup()
      renderWizard()
      await fillStep1Linescan(user)

      // Fill step 2
      await user.type(screen.getByLabelText(/Horizontal Resolution/i), '4096')
      await user.type(screen.getByLabelText(/Pixel Size Horizontal/i), '5.5')
      await user.type(screen.getByLabelText(/Pixel Size Vertical/i), '5.5')
      await user.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        expect(screen.getByText('Performance')).toBeInTheDocument()
        expect(screen.getByLabelText(/Line Rate/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/Lens Mount/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
      })
    })
  })

  describe('AreascanCamera flow', () => {
    it('step 2 shows vertical resolution field for areascan', async () => {
      const user = userEvent.setup()
      renderWizard()

      const trigger = screen.getByRole('combobox', { name: /component type/i })
      await user.click(trigger)
      await user.click(screen.getByRole('option', { name: /Areascan Camera/i }))
      await waitFor(() => expect(screen.getByText(/Step 1 of 3/i)).toBeInTheDocument())

      await user.type(screen.getByLabelText(/Component ID/i), 'BASLER-AS')
      await user.type(screen.getByLabelText(/Manufacturer/i), 'Basler')
      await user.type(screen.getByLabelText(/^Model$/i), 'acA2500-14gm')
      await user.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        expect(screen.getByLabelText(/Horizontal Resolution/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/Vertical Resolution/i)).toBeInTheDocument()
      })
    })

    it('step 3 shows Frame Rate for areascan', async () => {
      const user = userEvent.setup()
      renderWizard()

      const trigger = screen.getByRole('combobox', { name: /component type/i })
      await user.click(trigger)
      await user.click(screen.getByRole('option', { name: /Areascan Camera/i }))

      await user.type(screen.getByLabelText(/Component ID/i), 'BASLER-AS')
      await user.type(screen.getByLabelText(/Manufacturer/i), 'Basler')
      await user.type(screen.getByLabelText(/^Model$/i), 'acA2500-14gm')
      await user.click(screen.getByRole('button', { name: /next/i }))
      await waitFor(() => expect(screen.getByText(/Step 2 of 3/i)).toBeInTheDocument())

      await user.type(screen.getByLabelText(/Horizontal Resolution/i), '2500')
      await user.type(screen.getByLabelText(/Vertical Resolution/i), '2000')
      await user.type(screen.getByLabelText(/Pixel Size Horizontal/i), '3.45')
      await user.type(screen.getByLabelText(/Pixel Size Vertical/i), '3.45')
      await user.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        expect(screen.getByLabelText(/Frame Rate/i)).toBeInTheDocument()
        expect(screen.queryByLabelText(/Line Rate/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Lens flow', () => {
    const selectLensType = async (user: ReturnType<typeof userEvent.setup>) => {
      const trigger = screen.getByRole('combobox', { name: /component type/i })
      await user.click(trigger)
      await user.click(screen.getByRole('option', { name: /^Lens$/i }))
      await waitFor(() => expect(screen.getByLabelText(/Lens Type/i)).toBeInTheDocument())
    }

    it('Telecentric lens shows magnification fields in step 3', async () => {
      const user = userEvent.setup()
      renderWizard()
      await selectLensType(user)

      // Select Telecentric (default)
      const lensTypeTrigger = screen.getByRole('combobox', { name: /lens type/i })
      await user.click(lensTypeTrigger)
      await user.click(screen.getByRole('option', { name: /Telecentric/i }))

      await user.type(screen.getByLabelText(/Component ID/i), 'TC-LENS-1X')
      await user.type(screen.getByLabelText(/Manufacturer/i), 'Edmund')
      await user.type(screen.getByLabelText(/^Model$/i), 'TC12M36')
      await user.click(screen.getByRole('button', { name: /next/i }))
      await waitFor(() => expect(screen.getByText(/Step 2 of 3/i)).toBeInTheDocument())

      // Fill step 2 (base lens fields)
      await user.type(screen.getByLabelText(/^Mount$/i), 'C')
      await user.type(screen.getByLabelText(/Max Sensor Size/i), '11')
      await user.type(screen.getByLabelText(/Minimum Aperture/i), '4')
      await user.type(screen.getByLabelText(/Maximum Aperture/i), '16')
      await user.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        expect(screen.getByText(/Telecentric Details/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/Magnification/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/Working Distance/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/Field Depth/i)).toBeInTheDocument()
      })
    })

    it('FixedFocalLength lens shows focal length fields in step 3', async () => {
      const user = userEvent.setup()
      renderWizard()
      await selectLensType(user)

      // Select FixedFocalLength
      const lensTypeTrigger = screen.getByRole('combobox', { name: /lens type/i })
      await user.click(lensTypeTrigger)
      await user.click(screen.getByRole('option', { name: /Fixed Focal Length/i }))

      await user.type(screen.getByLabelText(/Component ID/i), 'FF-LENS-50')
      await user.type(screen.getByLabelText(/Manufacturer/i), 'Tamron')
      await user.type(screen.getByLabelText(/^Model$/i), 'M118FM50')
      await user.click(screen.getByRole('button', { name: /next/i }))
      await waitFor(() => expect(screen.getByText(/Step 2 of 3/i)).toBeInTheDocument())

      // Fill step 2
      await user.type(screen.getByLabelText(/^Mount$/i), 'C')
      await user.type(screen.getByLabelText(/Max Sensor Size/i), '11')
      await user.type(screen.getByLabelText(/Minimum Aperture/i), '2.8')
      await user.type(screen.getByLabelText(/Maximum Aperture/i), '22')
      await user.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        expect(screen.getByText(/Fixed Focal Details/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/Focal Length/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/Minimum Working Distance/i)).toBeInTheDocument()
        // Should NOT show telecentric-specific fields
        expect(screen.queryByLabelText(/Magnification/i)).not.toBeInTheDocument()
        expect(screen.queryByLabelText(/Field Depth/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('SnapshotSensor flow', () => {
    it('shows FOV and Range steps', async () => {
      const user = userEvent.setup()
      renderWizard()

      const trigger = screen.getByRole('combobox', { name: /component type/i })
      await user.click(trigger)
      await user.click(screen.getByRole('option', { name: /Snapshot Sensor/i }))

      await user.type(screen.getByLabelText(/Component ID/i), 'KEYENCE-VR')
      await user.type(screen.getByLabelText(/Manufacturer/i), 'Keyence')
      await user.type(screen.getByLabelText(/^Model$/i), 'VR-6000')
      await user.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        expect(screen.getByText('Field of View')).toBeInTheDocument()
        expect(screen.getByLabelText(/FOV X/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/FOV Y/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/XY Data Interval/i)).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText(/FOV X/i), '60')
      await user.type(screen.getByLabelText(/FOV Y/i), '45')
      await user.type(screen.getByLabelText(/XY Data Interval/i), '10')
      await user.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        expect(screen.getByText('Range')).toBeInTheDocument()
        expect(screen.getByLabelText(/Measurement Range/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/Working Distance/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
      })
    })
  })

  describe('navigation', () => {
    it('Back button returns to previous step', async () => {
      const user = userEvent.setup()
      renderWizard()

      await user.type(screen.getByLabelText(/Component ID/i), 'TEST-001')
      await user.type(screen.getByLabelText(/Manufacturer/i), 'Test')
      await user.type(screen.getByLabelText(/^Model$/i), 'Test')
      await user.click(screen.getByRole('button', { name: /next/i }))
      await waitFor(() => expect(screen.getByText(/Step 2 of 4/i)).toBeInTheDocument())

      await user.click(screen.getByRole('button', { name: /back/i }))

      await waitFor(() => {
        expect(screen.getByText(/Step 1 of 4/i)).toBeInTheDocument()
      })
    })

    it('preserves form values when navigating back', async () => {
      const user = userEvent.setup()
      renderWizard()

      await user.type(screen.getByLabelText(/Component ID/i), 'MY-COMPONENT')
      await user.type(screen.getByLabelText(/Manufacturer/i), 'My Mfg')
      await user.type(screen.getByLabelText(/^Model$/i), 'My Model')
      await user.click(screen.getByRole('button', { name: /next/i }))
      await waitFor(() => expect(screen.getByText(/Step 2 of 4/i)).toBeInTheDocument())

      await user.click(screen.getByRole('button', { name: /back/i }))
      await waitFor(() => expect(screen.getByText(/Step 1 of 4/i)).toBeInTheDocument())

      expect(screen.getByLabelText(/Component ID/i)).toHaveValue('MY-COMPONENT')
      expect(screen.getByLabelText(/Manufacturer/i)).toHaveValue('My Mfg')
      expect(screen.getByLabelText(/^Model$/i)).toHaveValue('My Model')
    })

    it('Cancel button on step 1 calls onCancel', async () => {
      const user = userEvent.setup()
      renderWizard()

      await user.click(screen.getByRole('button', { name: /cancel/i }))

      expect(mockOnCancel).toHaveBeenCalled()
    })
  })

  describe('type change behavior', () => {
    it('preserves base fields when changing component type', async () => {
      const user = userEvent.setup()
      renderWizard()

      // Fill base fields
      await user.type(screen.getByLabelText(/Component ID/i), 'TEST-ID')
      await user.type(screen.getByLabelText(/Manufacturer/i), 'Test Mfg')
      await user.type(screen.getByLabelText(/^Model$/i), 'Test Model')

      // Change type
      const trigger = screen.getByRole('combobox', { name: /component type/i })
      await user.click(trigger)
      await user.click(screen.getByRole('option', { name: /Linescan Camera/i }))

      // Base fields should be preserved
      await waitFor(() => {
        expect(screen.getByLabelText(/Component ID/i)).toHaveValue('TEST-ID')
        expect(screen.getByLabelText(/Manufacturer/i)).toHaveValue('Test Mfg')
        expect(screen.getByLabelText(/^Model$/i)).toHaveValue('Test Model')
      })
    })

    it('resets to step 1 when changing component type', async () => {
      const user = userEvent.setup()
      renderWizard()

      // Go to step 2
      await user.type(screen.getByLabelText(/Component ID/i), 'TEST-001')
      await user.type(screen.getByLabelText(/Manufacturer/i), 'Test')
      await user.type(screen.getByLabelText(/^Model$/i), 'Test')
      await user.click(screen.getByRole('button', { name: /next/i }))
      await waitFor(() => expect(screen.getByText(/Step 2 of 4/i)).toBeInTheDocument())

      // Change type
      await user.click(screen.getByRole('button', { name: /back/i }))
      await waitFor(() => expect(screen.getByText(/Step 1 of 4/i)).toBeInTheDocument())

      const trigger = screen.getByRole('combobox', { name: /component type/i })
      await user.click(trigger)
      await user.click(screen.getByRole('option', { name: /Snapshot Sensor/i }))

      // Should be on step 1 with new step count
      await waitFor(() => {
        expect(screen.getByText(/Step 1 of 3/i)).toBeInTheDocument()
      })
    })
  })

  describe('form submission', () => {
    it('calls onComplete with valid LaserLineProfiler', async () => {
      const user = userEvent.setup()
      renderWizard()

      // Step 1
      await user.type(screen.getByLabelText(/Component ID/i), 'LMI-TEST')
      await user.type(screen.getByLabelText(/Manufacturer/i), 'LMI')
      await user.type(screen.getByLabelText(/^Model$/i), 'Gocator 2512')
      await user.click(screen.getByRole('button', { name: /next/i }))
      await waitFor(() => expect(screen.getByText(/Step 2 of 4/i)).toBeInTheDocument())

      // Step 2
      await user.type(screen.getByLabelText(/Near Field Lateral FOV/i), '25')
      await user.type(screen.getByLabelText(/Mid Field Lateral FOV/i), '35')
      await user.type(screen.getByLabelText(/Far Field Lateral FOV/i), '45')
      await user.click(screen.getByRole('button', { name: /next/i }))
      await waitFor(() => expect(screen.getByText('Range')).toBeInTheDocument())

      // Step 3
      await user.type(screen.getByLabelText(/Standoff Distance/i), '100')
      await user.type(screen.getByLabelText(/Measurement Range/i), '50')
      await user.click(screen.getByRole('button', { name: /next/i }))
      await waitFor(() => expect(screen.getByText('Resolution')).toBeInTheDocument())

      // Step 4
      await user.type(screen.getByLabelText(/Points Per Profile/i), '1280')
      await user.type(screen.getByLabelText(/Lateral Resolution/i), '27.3')
      await user.type(screen.getByLabelText(/Vertical Resolution/i), '3.9')
      await user.type(screen.getByLabelText(/Max Scan Rate/i), '5')
      await user.click(screen.getByRole('button', { name: /save/i }))

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledWith(
          expect.objectContaining({
            componentType: 'LaserLineProfiler',
            componentId: 'LMI-TEST',
            Manufacturer: 'LMI',
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
        )
      })
    })

    it('adds ResolutionVertical_px=1 for LinescanCamera', async () => {
      const user = userEvent.setup()
      renderWizard()

      // Select LinescanCamera
      const trigger = screen.getByRole('combobox', { name: /component type/i })
      await user.click(trigger)
      await user.click(screen.getByRole('option', { name: /Linescan Camera/i }))

      // Step 1
      await user.type(screen.getByLabelText(/Component ID/i), 'LS-TEST')
      await user.type(screen.getByLabelText(/Manufacturer/i), 'Basler')
      await user.type(screen.getByLabelText(/^Model$/i), 'raL4096')
      await user.click(screen.getByRole('button', { name: /next/i }))
      await waitFor(() => expect(screen.getByText(/Step 2 of 3/i)).toBeInTheDocument())

      // Step 2
      await user.type(screen.getByLabelText(/Horizontal Resolution/i), '4096')
      await user.type(screen.getByLabelText(/Pixel Size Horizontal/i), '5.5')
      await user.type(screen.getByLabelText(/Pixel Size Vertical/i), '5.5')
      await user.click(screen.getByRole('button', { name: /next/i }))
      await waitFor(() => expect(screen.getByText('Performance')).toBeInTheDocument())

      // Step 3
      await user.type(screen.getByLabelText(/Line Rate/i), '140')
      await user.type(screen.getByLabelText(/Lens Mount/i), 'C')
      await user.click(screen.getByRole('button', { name: /save/i }))

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledWith(
          expect.objectContaining({
            componentType: 'LinescanCamera',
            ResolutionVertical_px: 1, // Auto-added
          })
        )
      })
    })
  })

  describe('FormDescription contextual help (AC-2.6.3)', () => {
    it('shows description for componentType', () => {
      renderWizard()
      expect(screen.getByText(/select the type of component you want to add/i)).toBeInTheDocument()
    })

    it('shows description for componentId', () => {
      renderWizard()
      expect(screen.getByText(/unique identifier for this component/i)).toBeInTheDocument()
    })

    it('shows description for Manufacturer', () => {
      renderWizard()
      expect(screen.getByText(/vendor or brand name/i)).toBeInTheDocument()
    })

    it('shows description for Model', () => {
      renderWizard()
      expect(screen.getByText(/model number or name from the spec sheet/i)).toBeInTheDocument()
    })
  })
})
