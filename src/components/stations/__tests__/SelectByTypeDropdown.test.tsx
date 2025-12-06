// src/components/stations/__tests__/SelectByTypeDropdown.test.tsx
// Tests for SelectByTypeDropdown (AC 3.2.3)

import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SelectByTypeDropdown } from '../SelectByTypeDropdown'
import { useComponentsStore } from '@/stores/components'
import type { Component, LaserLineProfiler, AreascanCamera } from '@/lib/schemas/component'

const mockLLP1: LaserLineProfiler = {
  componentId: 'llp-1',
  componentType: 'LaserLineProfiler',
  Manufacturer: 'LMI Technologies',
  Model: 'Gocator 2350',
  NearFieldLateralFOV_mm: 100,
  MidFieldLateralFOV_mm: 150,
  FarFieldLateralFOV_mm: 200,
  StandoffDistance_mm: 300,
  MeasurementRange_mm: 100,
  PointsPerProfile: 1280,
  LateralResolution_um: 78,
  VerticalResolution_um: 10,
  MaxScanRate_kHz: 5,
}

const mockLLP2: LaserLineProfiler = {
  ...mockLLP1,
  componentId: 'llp-2',
  Model: 'Gocator 2360',
}

const mockAreascan: AreascanCamera = {
  componentId: 'areascan-1',
  componentType: 'AreascanCamera',
  Manufacturer: 'Basler',
  Model: 'ace2020-35gm',
  SensorVendor: 'Sony',
  SensorName: 'IMX249',
  SensorType: 'CMOS',
  ShutterType: 'Global',
  OpticalFormat: '1"',
  SensorDiagonal_mm: 16,
  ResolutionHorizontal_px: 1920,
  ResolutionVertical_px: 1200,
  PixelSizeHorizontal_um: 5.86,
  PixelSizeVertical_um: 5.86,
  SensorWidth_mm: 11.3,
  SensorHeight_mm: 7.0,
  Chroma: 'Mono',
  Spectrum: 'Visible',
  LensMount: 'C-Mount',
  DataInterface: 'GigE',
  FrameRate_fps: 35,
  PixelBitDepth_bits: 12,
}

const mockComponents: Component[] = [mockLLP1, mockLLP2, mockAreascan]

describe('SelectByTypeDropdown', () => {
  beforeEach(() => {
    useComponentsStore.setState({
      activeComponentIds: new Set<string>(),
    })
  })

  it('renders Select by Type button', () => {
    render(<SelectByTypeDropdown components={mockComponents} />)

    expect(screen.getByRole('button', { name: /select by type/i })).toBeInTheDocument()
  })

  it('returns null when no components provided', () => {
    const { container } = render(<SelectByTypeDropdown components={[]} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('opens dropdown menu when clicked', async () => {
    const user = userEvent.setup()
    render(<SelectByTypeDropdown components={mockComponents} />)

    await user.click(screen.getByRole('button', { name: /select by type/i }))

    expect(screen.getByText('Activate by Type')).toBeInTheDocument()
    expect(screen.getByText('Clear by Type')).toBeInTheDocument()
  })

  // Note: Submenu interaction tests are skipped because hover-based submenus
  // are unreliable to test with RTL. The store actions are tested separately
  // in components.test.ts. Integration is verified via manual testing.
})
