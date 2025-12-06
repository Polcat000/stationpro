// src/components/shared/__tests__/WorkingSetPopover.test.tsx
// Tests for WorkingSetPopover component (AC 3.3.2, 3.3.3, 3.3.4)

import { describe, it, expect, beforeEach, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { WorkingSetPopover } from '../WorkingSetPopover'
import { useWorkingSetStore } from '@/stores/workingSet'
import { useComponentsStore } from '@/stores/components'
import { renderWithRouter, screen, waitFor } from '@/test/router-utils'
import type { Part } from '@/lib/schemas/part'
import type { Component } from '@/lib/schemas/component'

// Mock parts data
const mockParts: Part[] = [
  {
    PartCallout: 'PART-001',
    PartWidth_mm: 100,
    PartHeight_mm: 50,
    PartLength_mm: 200,
    SmallestLateralFeature_um: 10,
    InspectionZones: [
      {
        ZoneID: 'Z1',
        Name: 'Top',
        Face: 'Top',
        ZoneDepth_mm: 5,
        ZoneOffset_mm: 0,
        RequiredCoverage_pct: 100,
        MinPixelsPerFeature: 3,
      },
    ],
  },
  {
    PartCallout: 'PART-002',
    PartWidth_mm: 150,
    PartHeight_mm: 75,
    PartLength_mm: 300,
    SmallestLateralFeature_um: 15,
    InspectionZones: [
      {
        ZoneID: 'Z2',
        Name: 'Front',
        Face: 'Front',
        ZoneDepth_mm: 10,
        ZoneOffset_mm: 5,
        RequiredCoverage_pct: 100,
        MinPixelsPerFeature: 3,
      },
    ],
  },
  {
    PartCallout: 'PART-003',
    PartWidth_mm: 80,
    PartHeight_mm: 40,
    PartLength_mm: 160,
    SmallestLateralFeature_um: 8,
    InspectionZones: [
      {
        ZoneID: 'Z3',
        Name: 'Bottom',
        Face: 'Bottom',
        ZoneDepth_mm: 3,
        ZoneOffset_mm: 1,
        RequiredCoverage_pct: 100,
        MinPixelsPerFeature: 3,
      },
    ],
  },
  { PartCallout: 'PART-004', PartWidth_mm: 90, PartHeight_mm: 45, PartLength_mm: 180, SmallestLateralFeature_um: 9, InspectionZones: [{ ZoneID: 'Z4', Name: 'Left', Face: 'Left', ZoneDepth_mm: 4, ZoneOffset_mm: 0, RequiredCoverage_pct: 100, MinPixelsPerFeature: 3 }] },
  { PartCallout: 'PART-005', PartWidth_mm: 110, PartHeight_mm: 55, PartLength_mm: 220, SmallestLateralFeature_um: 11, InspectionZones: [{ ZoneID: 'Z5', Name: 'Right', Face: 'Right', ZoneDepth_mm: 6, ZoneOffset_mm: 2, RequiredCoverage_pct: 100, MinPixelsPerFeature: 3 }] },
  { PartCallout: 'PART-006', PartWidth_mm: 120, PartHeight_mm: 60, PartLength_mm: 240, SmallestLateralFeature_um: 12, InspectionZones: [{ ZoneID: 'Z6', Name: 'Back', Face: 'Back', ZoneDepth_mm: 7, ZoneOffset_mm: 3, RequiredCoverage_pct: 100, MinPixelsPerFeature: 3 }] },
  { PartCallout: 'PART-007', PartWidth_mm: 130, PartHeight_mm: 65, PartLength_mm: 260, SmallestLateralFeature_um: 13, InspectionZones: [{ ZoneID: 'Z7', Name: 'Top2', Face: 'Top', ZoneDepth_mm: 8, ZoneOffset_mm: 4, RequiredCoverage_pct: 100, MinPixelsPerFeature: 3 }] },
]

// Mock components data
const mockComponents: Component[] = [
  {
    componentId: 'laser-001',
    componentType: 'LaserLineProfiler',
    Manufacturer: 'Keyence',
    Model: 'LJ-X8000',
    NearFieldLateralFOV_mm: 10,
    MidFieldLateralFOV_mm: 20,
    FarFieldLateralFOV_mm: 30,
    StandoffDistance_mm: 100,
    MeasurementRange_mm: 50,
    PointsPerProfile: 3200,
    LateralResolution_um: 5,
    VerticalResolution_um: 1,
    MaxScanRate_kHz: 64,
  },
  {
    componentId: 'laser-002',
    componentType: 'LaserLineProfiler',
    Manufacturer: 'Cognex',
    Model: 'DS1300',
    NearFieldLateralFOV_mm: 15,
    MidFieldLateralFOV_mm: 25,
    FarFieldLateralFOV_mm: 35,
    StandoffDistance_mm: 120,
    MeasurementRange_mm: 60,
    PointsPerProfile: 2000,
    LateralResolution_um: 7,
    VerticalResolution_um: 2,
    MaxScanRate_kHz: 32,
  },
  {
    componentId: 'laser-003',
    componentType: 'LaserLineProfiler',
    Manufacturer: 'Sick',
    Model: 'Ranger3',
    NearFieldLateralFOV_mm: 12,
    MidFieldLateralFOV_mm: 22,
    FarFieldLateralFOV_mm: 32,
    StandoffDistance_mm: 110,
    MeasurementRange_mm: 55,
    PointsPerProfile: 2500,
    LateralResolution_um: 6,
    VerticalResolution_um: 1.5,
    MaxScanRate_kHz: 48,
  },
  {
    componentId: 'laser-004',
    componentType: 'LaserLineProfiler',
    Manufacturer: 'LMI',
    Model: 'Gocator3210',
    NearFieldLateralFOV_mm: 8,
    MidFieldLateralFOV_mm: 18,
    FarFieldLateralFOV_mm: 28,
    StandoffDistance_mm: 90,
    MeasurementRange_mm: 45,
    PointsPerProfile: 1600,
    LateralResolution_um: 4,
    VerticalResolution_um: 0.5,
    MaxScanRate_kHz: 80,
  },
  {
    componentId: 'laser-005',
    componentType: 'LaserLineProfiler',
    Manufacturer: 'Micro-Epsilon',
    Model: 'scanCONTROL 3000',
    NearFieldLateralFOV_mm: 11,
    MidFieldLateralFOV_mm: 21,
    FarFieldLateralFOV_mm: 31,
    StandoffDistance_mm: 105,
    MeasurementRange_mm: 52,
    PointsPerProfile: 1280,
    LateralResolution_um: 8,
    VerticalResolution_um: 3,
    MaxScanRate_kHz: 20,
  },
  {
    componentId: 'laser-006',
    componentType: 'LaserLineProfiler',
    Manufacturer: 'Automation Technology',
    Model: 'C5-2040CS',
    NearFieldLateralFOV_mm: 14,
    MidFieldLateralFOV_mm: 24,
    FarFieldLateralFOV_mm: 34,
    StandoffDistance_mm: 115,
    MeasurementRange_mm: 58,
    PointsPerProfile: 2048,
    LateralResolution_um: 10,
    VerticalResolution_um: 2.5,
    MaxScanRate_kHz: 40,
  },
]

// Mock repositories
vi.mock('@/lib/repositories/partsRepository', () => ({
  partsRepository: {
    getAll: vi.fn(() => Promise.resolve(mockParts)),
  },
}))

vi.mock('@/lib/repositories/componentsRepository', () => ({
  componentsRepository: {
    getAll: vi.fn(() => Promise.resolve(mockComponents)),
  },
}))

describe('WorkingSetPopover', () => {
  beforeEach(() => {
    useWorkingSetStore.setState({
      partIds: new Set<string>(),
      stationIds: new Set<string>(),
    })
    useComponentsStore.setState({
      activeComponentIds: new Set<string>(),
    })
  })

  describe('popover trigger (AC 3.3.1)', () => {
    it('displays badge as trigger', async () => {
      renderWithRouter(<WorkingSetPopover />)

      expect(await screen.findByRole('button', { name: /working set/i })).toBeInTheDocument()
    })

    it('shows correct counts in trigger', async () => {
      useWorkingSetStore.setState({
        partIds: new Set(['PART-001', 'PART-002']),
        stationIds: new Set<string>(),
      })
      useComponentsStore.setState({
        activeComponentIds: new Set(['laser-001']),
      })

      renderWithRouter(<WorkingSetPopover />)

      expect(await screen.findByRole('button')).toHaveTextContent('2 parts, 1 component')
    })
  })

  describe('popover opening (AC 3.3.2)', () => {
    it('opens popover on click', async () => {
      const user = userEvent.setup()

      renderWithRouter(<WorkingSetPopover />)

      const trigger = await screen.findByRole('button', { name: /working set/i })
      await user.click(trigger)

      expect(await screen.findByText(/no items selected/i)).toBeInTheDocument()
    })

    it('displays selected part callouts in popover', async () => {
      const user = userEvent.setup()

      useWorkingSetStore.setState({
        partIds: new Set(['PART-001', 'PART-002']),
        stationIds: new Set<string>(),
      })

      renderWithRouter(<WorkingSetPopover />)

      const trigger = await screen.findByRole('button')
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByText('PART-001')).toBeInTheDocument()
        expect(screen.getByText('PART-002')).toBeInTheDocument()
      })
    })

    it('displays active component model names in popover', async () => {
      const user = userEvent.setup()

      useComponentsStore.setState({
        activeComponentIds: new Set(['laser-001', 'laser-002']),
      })

      renderWithRouter(<WorkingSetPopover />)

      const trigger = await screen.findByRole('button')
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByText('LJ-X8000')).toBeInTheDocument()
        expect(screen.getByText('DS1300')).toBeInTheDocument()
      })
    })

    it('shows "+ X more" overflow indicator for >5 parts', async () => {
      const user = userEvent.setup()

      // Select 7 parts
      useWorkingSetStore.setState({
        partIds: new Set(['PART-001', 'PART-002', 'PART-003', 'PART-004', 'PART-005', 'PART-006', 'PART-007']),
        stationIds: new Set<string>(),
      })

      renderWithRouter(<WorkingSetPopover />)

      const trigger = await screen.findByRole('button')
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByText('+ 2 more')).toBeInTheDocument()
      })
    })

    it('shows "+ X more" overflow indicator for >5 components', async () => {
      const user = userEvent.setup()

      // Activate 6 components
      useComponentsStore.setState({
        activeComponentIds: new Set(['laser-001', 'laser-002', 'laser-003', 'laser-004', 'laser-005', 'laser-006']),
      })

      renderWithRouter(<WorkingSetPopover />)

      const trigger = await screen.findByRole('button')
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByText('+ 1 more')).toBeInTheDocument()
      })
    })
  })

  describe('empty state (AC 3.3.4)', () => {
    it('shows empty state message when no items selected', async () => {
      const user = userEvent.setup()

      renderWithRouter(<WorkingSetPopover />)

      const trigger = await screen.findByRole('button')
      await user.click(trigger)

      expect(await screen.findByText('No items selected')).toBeInTheDocument()
    })

    it('shows guidance text in empty state', async () => {
      const user = userEvent.setup()

      renderWithRouter(<WorkingSetPopover />)

      const trigger = await screen.findByRole('button')
      await user.click(trigger)

      expect(await screen.findByText(/select parts in parts library/i)).toBeInTheDocument()
    })
  })

  describe('quick actions (AC 3.3.3)', () => {
    it('shows Clear Parts button that clears parts', async () => {
      const user = userEvent.setup()

      useWorkingSetStore.setState({
        partIds: new Set(['PART-001', 'PART-002']),
        stationIds: new Set<string>(),
      })

      renderWithRouter(<WorkingSetPopover />)

      const trigger = await screen.findByRole('button')
      await user.click(trigger)

      const clearPartsBtn = await screen.findByRole('button', { name: /clear parts/i })
      await user.click(clearPartsBtn)

      expect(useWorkingSetStore.getState().partIds.size).toBe(0)
    })

    it('shows Clear Components button that clears components', async () => {
      const user = userEvent.setup()

      useComponentsStore.setState({
        activeComponentIds: new Set(['laser-001', 'laser-002']),
      })

      renderWithRouter(<WorkingSetPopover />)

      const trigger = await screen.findByRole('button')
      await user.click(trigger)

      const clearComponentsBtn = await screen.findByRole('button', { name: /clear components/i })
      await user.click(clearComponentsBtn)

      expect(useComponentsStore.getState().activeComponentIds.size).toBe(0)
    })

    it('shows Clear All button that clears both stores', async () => {
      const user = userEvent.setup()

      useWorkingSetStore.setState({
        partIds: new Set(['PART-001']),
        stationIds: new Set<string>(),
      })
      useComponentsStore.setState({
        activeComponentIds: new Set(['laser-001']),
      })

      renderWithRouter(<WorkingSetPopover />)

      const trigger = await screen.findByRole('button')
      await user.click(trigger)

      const clearAllBtn = await screen.findByRole('button', { name: /clear all/i })
      await user.click(clearAllBtn)

      expect(useWorkingSetStore.getState().partIds.size).toBe(0)
      expect(useComponentsStore.getState().activeComponentIds.size).toBe(0)
    })

    it('disables Clear Parts button when parts count is 0', async () => {
      const user = userEvent.setup()

      useComponentsStore.setState({
        activeComponentIds: new Set(['laser-001']),
      })

      renderWithRouter(<WorkingSetPopover />)

      const trigger = await screen.findByRole('button')
      await user.click(trigger)

      const clearPartsBtn = await screen.findByRole('button', { name: /clear parts/i })
      expect(clearPartsBtn).toBeDisabled()
    })

    it('disables Clear Components button when components count is 0', async () => {
      const user = userEvent.setup()

      useWorkingSetStore.setState({
        partIds: new Set(['PART-001']),
        stationIds: new Set<string>(),
      })

      renderWithRouter(<WorkingSetPopover />)

      const trigger = await screen.findByRole('button')
      await user.click(trigger)

      const clearComponentsBtn = await screen.findByRole('button', { name: /clear components/i })
      expect(clearComponentsBtn).toBeDisabled()
    })

    it('popover remains open after action', async () => {
      const user = userEvent.setup()

      useWorkingSetStore.setState({
        partIds: new Set(['PART-001', 'PART-002']),
        stationIds: new Set<string>(),
      })

      renderWithRouter(<WorkingSetPopover />)

      const trigger = await screen.findByRole('button')
      await user.click(trigger)

      const clearPartsBtn = await screen.findByRole('button', { name: /clear parts/i })
      await user.click(clearPartsBtn)

      // Popover should still be visible with empty state
      expect(await screen.findByText('No items selected')).toBeInTheDocument()
    })
  })
})
