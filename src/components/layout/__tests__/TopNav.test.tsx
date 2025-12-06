import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderWithRouter, screen, waitFor } from '@/test/router-utils'
import userEvent from '@testing-library/user-event'
import { TopNav } from '../TopNav'
import { useWorkingSetStore } from '@/stores/workingSet'
import { useComponentsStore } from '@/stores/components'
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

describe('TopNav', () => {
  describe('AC-1.4.1: TopNav renders', () => {
    it('renders without crashing', async () => {
      renderWithRouter(<TopNav />)
      expect(await screen.findByRole('banner')).toBeInTheDocument()
    })

    it('renders navigation element', async () => {
      renderWithRouter(<TopNav />)
      expect(await screen.findByRole('navigation')).toBeInTheDocument()
    })
  })

  describe('AC-1.4.2: Logo/Wordmark', () => {
    it('renders StationPro wordmark text', async () => {
      renderWithRouter(<TopNav />)
      expect(await screen.findByText('StationPro')).toBeInTheDocument()
    })

    it('renders logo mark element', async () => {
      renderWithRouter(<TopNav />)
      // Logo mark is within a Link to "/" - verify link exists
      const allLinks = await screen.findAllByRole('link')
      const homeLinks = allLinks.filter(
        (link) => link.getAttribute('href') === '/'
      )
      expect(homeLinks.length).toBeGreaterThanOrEqual(1)
    })

    it('logo links to home route', async () => {
      renderWithRouter(<TopNav />)
      const allLinks = await screen.findAllByRole('link')
      const homeLinks = allLinks.filter(
        (link) => link.getAttribute('href') === '/'
      )
      expect(homeLinks.length).toBeGreaterThanOrEqual(1)
      expect(homeLinks[0]).toHaveAttribute('href', '/')
    })
  })

  describe('AC-1.4.3: Nav Links Present', () => {
    it('renders Home nav item', async () => {
      renderWithRouter(<TopNav />)
      expect(await screen.findByText('Home')).toBeInTheDocument()
    })

    it('renders Parts nav item', async () => {
      renderWithRouter(<TopNav />)
      expect(await screen.findByText('Parts')).toBeInTheDocument()
    })

    it('renders Stations nav item', async () => {
      renderWithRouter(<TopNav />)
      expect(await screen.findByText('Stations')).toBeInTheDocument()
    })

    it('renders Analysis nav item', async () => {
      renderWithRouter(<TopNav />)
      expect(await screen.findByText('Analysis')).toBeInTheDocument()
    })

    it('renders Visualizer nav item', async () => {
      renderWithRouter(<TopNav />)
      expect(await screen.findByText('Visualizer')).toBeInTheDocument()
    })

    it('does NOT render Import nav item', async () => {
      renderWithRouter(<TopNav />)
      // Wait for component to render first
      await screen.findByRole('navigation')
      expect(screen.queryByText('Import')).not.toBeInTheDocument()
    })

    it('does NOT render Export nav item', async () => {
      renderWithRouter(<TopNav />)
      // Wait for component to render first
      await screen.findByRole('navigation')
      expect(screen.queryByText('Export')).not.toBeInTheDocument()
    })
  })

  describe('AC-1.4.4: Active Link Highlighted', () => {
    it('highlights Home when on root path', async () => {
      renderWithRouter(<TopNav />, {
        router: { initialPath: '/' },
      })
      const homeLink = (await screen.findByText('Home')).closest('a')
      expect(homeLink).toHaveClass('bg-primary')
    })

    it('highlights Parts when on /parts path', async () => {
      renderWithRouter(<TopNav />, {
        router: { initialPath: '/parts' },
      })
      const partsLink = (await screen.findByText('Parts')).closest('a')
      expect(partsLink).toHaveClass('bg-primary')
    })

    it('does not highlight Home when on /parts path', async () => {
      renderWithRouter(<TopNav />, {
        router: { initialPath: '/parts' },
      })
      const homeLink = (await screen.findByText('Home')).closest('a')
      expect(homeLink).not.toHaveClass('bg-primary')
    })

    it('highlights Stations when on /stations path', async () => {
      renderWithRouter(<TopNav />, {
        router: { initialPath: '/stations' },
      })
      const stationsLink = (await screen.findByText('Stations')).closest('a')
      expect(stationsLink).toHaveClass('bg-primary')
    })
  })

  describe('AC-1.4.5: Nav Links have correct to props', () => {
    it('Home link has to="/"', async () => {
      renderWithRouter(<TopNav />)
      const allLinks = await screen.findAllByRole('link')
      const homeLinks = allLinks.filter(
        (link) => link.textContent === 'Home'
      )
      expect(homeLinks.length).toBe(1)
      expect(homeLinks[0]).toHaveAttribute('href', '/')
    })

    it('Parts link has to="/parts"', async () => {
      renderWithRouter(<TopNav />)
      const partsLink = await screen.findByRole('link', { name: 'Parts' })
      expect(partsLink).toHaveAttribute('href', '/parts')
    })

    it('Stations link has to="/stations"', async () => {
      renderWithRouter(<TopNav />)
      const stationsLink = await screen.findByRole('link', { name: 'Stations' })
      expect(stationsLink).toHaveAttribute('href', '/stations')
    })

    it('Analysis link has to="/analysis"', async () => {
      renderWithRouter(<TopNav />)
      const analysisLink = await screen.findByRole('link', { name: 'Analysis' })
      expect(analysisLink).toHaveAttribute('href', '/analysis')
    })

    it('Visualizer link has to="/visualizer"', async () => {
      renderWithRouter(<TopNav />)
      const visualizerLink = await screen.findByRole('link', { name: 'Visualizer' })
      expect(visualizerLink).toHaveAttribute('href', '/visualizer')
    })
  })

  describe('AC-1.4.6: Uses Button component', () => {
    it('nav items have button styling classes from shadcn/ui Button', async () => {
      renderWithRouter(<TopNav />)
      // Button with asChild renders Link as anchor with button classes
      const partsLink = await screen.findByRole('link', { name: 'Parts' })
      // Button component adds these characteristic classes
      expect(partsLink).toHaveClass('inline-flex')
      expect(partsLink).toHaveClass('items-center')
      expect(partsLink).toHaveClass('justify-center')
    })
  })

  describe('AC-3.3.1: Working Set Summary Integration', () => {
    beforeEach(() => {
      useWorkingSetStore.setState({
        partIds: new Set<string>(),
        stationIds: new Set<string>(),
      })
      useComponentsStore.setState({
        activeComponentIds: new Set<string>(),
      })
    })

    it('hides working set summary on home page', async () => {
      renderWithRouter(<TopNav />, {
        router: { initialPath: '/' },
      })

      // Wait for nav to render
      await screen.findByRole('navigation')

      expect(screen.queryByRole('button', { name: /working set/i })).not.toBeInTheDocument()
    })

    it('summary visible on /parts route', async () => {
      renderWithRouter(<TopNav />, {
        router: { initialPath: '/parts' },
      })

      expect(await screen.findByRole('button', { name: /working set/i })).toBeInTheDocument()
    })

    it('summary visible on /stations route', async () => {
      renderWithRouter(<TopNav />, {
        router: { initialPath: '/stations' },
      })

      expect(await screen.findByRole('button', { name: /working set/i })).toBeInTheDocument()
    })

    it('summary visible on /import route', async () => {
      renderWithRouter(<TopNav />, {
        router: { initialPath: '/import' },
      })

      expect(await screen.findByRole('button', { name: /working set/i })).toBeInTheDocument()
    })

    it('shows correct counts with selected parts and components', async () => {
      useWorkingSetStore.setState({
        partIds: new Set(['PART-001']),
        stationIds: new Set<string>(),
      })
      useComponentsStore.setState({
        activeComponentIds: new Set(['laser-001']),
      })

      renderWithRouter(<TopNav />, {
        router: { initialPath: '/parts' },
      })

      expect(await screen.findByRole('button')).toHaveTextContent('1 part, 1 component')
    })

    it('opens popover and shows parts list on click', async () => {
      const user = userEvent.setup()

      useWorkingSetStore.setState({
        partIds: new Set(['PART-001']),
        stationIds: new Set<string>(),
      })

      renderWithRouter(<TopNav />, {
        router: { initialPath: '/parts' },
      })

      const trigger = await screen.findByRole('button', { name: /working set/i })
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByText('PART-001')).toBeInTheDocument()
      })
    })

    it('clear action updates counts', async () => {
      const user = userEvent.setup()

      useWorkingSetStore.setState({
        partIds: new Set(['PART-001']),
        stationIds: new Set<string>(),
      })
      useComponentsStore.setState({
        activeComponentIds: new Set(['laser-001']),
      })

      renderWithRouter(<TopNav />, {
        router: { initialPath: '/parts' },
      })

      const trigger = await screen.findByRole('button', { name: /working set/i })
      await user.click(trigger)

      const clearAllBtn = await screen.findByRole('button', { name: /clear all/i })
      await user.click(clearAllBtn)

      // Check that stores were cleared
      expect(useWorkingSetStore.getState().partIds.size).toBe(0)
      expect(useComponentsStore.getState().activeComponentIds.size).toBe(0)
    })
  })
})
