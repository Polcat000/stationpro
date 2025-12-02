// src/components/stations/__tests__/ComponentDetailPanel.test.tsx
// Unit tests for ComponentDetailPanel component (AC 2.8.5)
// Ref: docs/sprint-artifacts/2-8-components-library-screen.md

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { LaserLineProfiler, AreascanCamera, LinescanCamera, Lens, SnapshotSensor } from '@/lib/schemas/component'
import { ComponentDetailPanel } from '../ComponentDetailPanel'

const mockLaserProfiler: LaserLineProfiler = {
  componentId: 'LMI-G2-001',
  componentType: 'LaserLineProfiler',
  Manufacturer: 'LMI Technologies',
  Model: 'Gocator 2512',
  PartNumber: 'G2-512-12345',
  NearFieldLateralFOV_mm: 50,
  MidFieldLateralFOV_mm: 75,
  FarFieldLateralFOV_mm: 100,
  StandoffDistance_mm: 200,
  MeasurementRange_mm: 150,
  PointsPerProfile: 2048,
  LateralResolution_um: 25,
  VerticalResolution_um: 5,
  MaxScanRate_kHz: 10,
}

const mockAreascanCamera: AreascanCamera = {
  componentId: 'CAM-AREA-001',
  componentType: 'AreascanCamera',
  Manufacturer: 'Basler',
  Model: 'acA2048-55uc',
  ResolutionHorizontal_px: 2048,
  ResolutionVertical_px: 2048,
  PixelSizeHorizontal_um: 5.5,
  PixelSizeVertical_um: 5.5,
  FrameRate_fps: 55,
  LensMount: 'C-Mount',
}

const mockLinescanCamera: LinescanCamera = {
  componentId: 'CAM-LINE-001',
  componentType: 'LinescanCamera',
  Manufacturer: 'Teledyne DALSA',
  Model: 'Piranha4',
  ResolutionHorizontal_px: 4096,
  ResolutionVertical_px: 1,
  PixelSizeHorizontal_um: 7,
  PixelSizeVertical_um: 7,
  LineRate_kHz: 140,
  LensMount: 'F-Mount',
}

const mockTelecentricLens: Lens = {
  componentId: 'LENS-TC-001',
  componentType: 'Lens',
  LensType: 'Telecentric',
  Manufacturer: 'Edmund Optics',
  Model: 'TC-2340',
  Mount: 'C-Mount',
  MaxSensorSize_mm: 11,
  ApertureMin_fnum: 4,
  ApertureMax_fnum: 16,
  Magnification: 0.5,
  WorkingDistance_mm: 65,
  FieldDepth_mm: 2.5,
}

const mockFixedFocalLens: Lens = {
  componentId: 'LENS-FF-001',
  componentType: 'Lens',
  LensType: 'FixedFocalLength',
  Manufacturer: 'Edmund Optics',
  Model: 'FF-35mm',
  Mount: 'F-Mount',
  MaxSensorSize_mm: 43.3,
  ApertureMin_fnum: 2.8,
  ApertureMax_fnum: 22,
  FocalLength_mm: 35,
  WorkingDistanceMin_mm: 300,
}

const mockSnapshotSensor: SnapshotSensor = {
  componentId: 'SNAP-001',
  componentType: 'SnapshotSensor',
  Manufacturer: 'Keyence',
  Model: 'LJ-X8400',
  FOV_X_mm: 25,
  FOV_Y_mm: 25,
  MeasurementRange_mm: 30,
  WorkingDistance_mm: 50,
  XYDataInterval_um: 10,
}

describe('ComponentDetailPanel', () => {
  describe('AC-2.8.5: Detail Panel Displays Component Data', () => {
    it('renders component header correctly', () => {
      render(
        <ComponentDetailPanel
          open={true}
          onOpenChange={vi.fn()}
          component={mockLaserProfiler}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      )

      expect(screen.getByText('LMI Technologies Gocator 2512')).toBeInTheDocument()
      expect(screen.getByText('Laser Profiler')).toBeInTheDocument()
    })

    it('renders part number when available', () => {
      render(
        <ComponentDetailPanel
          open={true}
          onOpenChange={vi.fn()}
          component={mockLaserProfiler}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      )

      expect(screen.getByText('G2-512-12345')).toBeInTheDocument()
    })

    it('renders Edit and Delete buttons', () => {
      render(
        <ComponentDetailPanel
          open={true}
          onOpenChange={vi.fn()}
          component={mockLaserProfiler}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      )

      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
    })
  })

  describe('Button Actions', () => {
    it('calls onEdit when Edit button clicked', async () => {
      const user = userEvent.setup()
      const onEdit = vi.fn()

      render(
        <ComponentDetailPanel
          open={true}
          onOpenChange={vi.fn()}
          component={mockLaserProfiler}
          onEdit={onEdit}
          onDelete={vi.fn()}
        />
      )

      await user.click(screen.getByRole('button', { name: /edit/i }))

      expect(onEdit).toHaveBeenCalled()
    })

    it('calls onDelete when Delete button clicked', async () => {
      const user = userEvent.setup()
      const onDelete = vi.fn()

      render(
        <ComponentDetailPanel
          open={true}
          onOpenChange={vi.fn()}
          component={mockLaserProfiler}
          onEdit={vi.fn()}
          onDelete={onDelete}
        />
      )

      await user.click(screen.getByRole('button', { name: /delete/i }))

      expect(onDelete).toHaveBeenCalled()
    })
  })

  describe('LaserLineProfiler Details', () => {
    it('displays FOV details', () => {
      render(
        <ComponentDetailPanel
          open={true}
          onOpenChange={vi.fn()}
          component={mockLaserProfiler}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      )

      expect(screen.getByText('Field of View')).toBeInTheDocument()
      expect(screen.getByText('Near FOV')).toBeInTheDocument()
      expect(screen.getByText('Mid FOV')).toBeInTheDocument()
      expect(screen.getByText('Far FOV')).toBeInTheDocument()
    })

    it('displays working distance details', () => {
      render(
        <ComponentDetailPanel
          open={true}
          onOpenChange={vi.fn()}
          component={mockLaserProfiler}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      )

      expect(screen.getByText('Working Distance')).toBeInTheDocument()
      expect(screen.getByText('Standoff')).toBeInTheDocument()
      expect(screen.getByText('Measurement Range')).toBeInTheDocument()
    })

    it('displays resolution details', () => {
      render(
        <ComponentDetailPanel
          open={true}
          onOpenChange={vi.fn()}
          component={mockLaserProfiler}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      )

      expect(screen.getByText('Resolution')).toBeInTheDocument()
      expect(screen.getByText('Lateral')).toBeInTheDocument()
      expect(screen.getByText('Vertical')).toBeInTheDocument()
    })
  })

  describe('AreascanCamera Details', () => {
    it('displays resolution details', () => {
      render(
        <ComponentDetailPanel
          open={true}
          onOpenChange={vi.fn()}
          component={mockAreascanCamera}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      )

      expect(screen.getByText('Basler acA2048-55uc')).toBeInTheDocument()
      // Resolution section exists (Horizontal/Vertical appear multiple times in different sections)
      expect(screen.getByText('Resolution')).toBeInTheDocument()
      // Check that horizontal/vertical labels exist (may appear in both Resolution and Pixel Size)
      expect(screen.getAllByText('Horizontal').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('Vertical').length).toBeGreaterThanOrEqual(1)
    })

    it('displays performance details', () => {
      render(
        <ComponentDetailPanel
          open={true}
          onOpenChange={vi.fn()}
          component={mockAreascanCamera}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      )

      expect(screen.getByText('Frame Rate')).toBeInTheDocument()
      expect(screen.getByText('Lens Mount')).toBeInTheDocument()
    })
  })

  describe('LinescanCamera Details', () => {
    it('displays resolution and line rate', () => {
      render(
        <ComponentDetailPanel
          open={true}
          onOpenChange={vi.fn()}
          component={mockLinescanCamera}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      )

      expect(screen.getByText('Teledyne DALSA Piranha4')).toBeInTheDocument()
      expect(screen.getByText('Line Rate')).toBeInTheDocument()
      expect(screen.getByText('Lens Mount')).toBeInTheDocument()
    })
  })

  describe('Telecentric Lens Details', () => {
    it('displays lens properties', () => {
      render(
        <ComponentDetailPanel
          open={true}
          onOpenChange={vi.fn()}
          component={mockTelecentricLens}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      )

      expect(screen.getByText('Edmund Optics TC-2340')).toBeInTheDocument()
      expect(screen.getByText('Lens Properties')).toBeInTheDocument()
      expect(screen.getByText('Type')).toBeInTheDocument()
      expect(screen.getByText('Mount')).toBeInTheDocument()
    })

    it('displays telecentric-specific properties', () => {
      render(
        <ComponentDetailPanel
          open={true}
          onOpenChange={vi.fn()}
          component={mockTelecentricLens}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      )

      expect(screen.getByText('Telecentric Properties')).toBeInTheDocument()
      expect(screen.getByText('Magnification')).toBeInTheDocument()
      expect(screen.getByText('Working Distance')).toBeInTheDocument()
      expect(screen.getByText('Field Depth')).toBeInTheDocument()
    })
  })

  describe('Fixed Focal Length Lens Details', () => {
    it('displays fixed focal length properties', () => {
      render(
        <ComponentDetailPanel
          open={true}
          onOpenChange={vi.fn()}
          component={mockFixedFocalLens}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      )

      expect(screen.getByText('Edmund Optics FF-35mm')).toBeInTheDocument()
      expect(screen.getByText('Focal Length Properties')).toBeInTheDocument()
      expect(screen.getByText('Focal Length')).toBeInTheDocument()
      expect(screen.getByText('Min Working Distance')).toBeInTheDocument()
    })
  })

  describe('SnapshotSensor Details', () => {
    it('displays FOV and range', () => {
      render(
        <ComponentDetailPanel
          open={true}
          onOpenChange={vi.fn()}
          component={mockSnapshotSensor}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      )

      expect(screen.getByText('Keyence LJ-X8400')).toBeInTheDocument()
      expect(screen.getByText('Snapshot Sensor')).toBeInTheDocument()
      expect(screen.getByText('FOV X')).toBeInTheDocument()
      expect(screen.getByText('FOV Y')).toBeInTheDocument()
      expect(screen.getByText('Working Range')).toBeInTheDocument()
      expect(screen.getByText('Measurement Range')).toBeInTheDocument()
      expect(screen.getByText('Working Distance')).toBeInTheDocument()
    })
  })

  describe('Null Component', () => {
    it('returns null when component is null', () => {
      const { container } = render(
        <ComponentDetailPanel
          open={true}
          onOpenChange={vi.fn()}
          component={null}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      )

      expect(container).toBeEmptyDOMElement()
    })
  })
})
