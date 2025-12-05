// src/routes/__tests__/stations.test.tsx
// Integration tests for Stations Library page (AC 2.8.1 - 2.8.6)
// Ref: docs/sprint-artifacts/2-8-components-library-screen.md

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import { renderWithRouter, screen, waitFor } from '@/test/router-utils'
import { StationsPage } from '@/components/stations'
import { componentsRepository } from '@/lib/repositories/componentsRepository'
import { toast } from 'sonner'
import type { Component, LaserLineProfiler, AreascanCamera, Lens } from '@/lib/schemas/component'

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

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

const mockLens: Lens = {
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

const mockComponents: Component[] = [mockLaserProfiler, mockAreascanCamera, mockLens]

describe('Stations Library Page', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    sessionStorage.clear()
    vi.spyOn(componentsRepository, 'getAll').mockResolvedValue(mockComponents)
    vi.spyOn(componentsRepository, 'save').mockImplementation(async (component) => component)
    vi.spyOn(componentsRepository, 'delete').mockResolvedValue(true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
    sessionStorage.clear()
  })

  describe('AC-2.8.1: Components Tab within Stations Route', () => {
    it('renders three tabs: Stations, Components, Analysis', async () => {
      renderWithRouter(<StationsPage />, { router: { initialPath: '/stations' } })

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Stations' })).toBeInTheDocument()
        expect(screen.getByRole('tab', { name: 'Components' })).toBeInTheDocument()
        expect(screen.getByRole('tab', { name: 'Analysis' })).toBeInTheDocument()
      })
    })

    it('defaults to Stations tab', async () => {
      renderWithRouter(<StationsPage />, { router: { initialPath: '/stations' } })

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Stations' })).toHaveAttribute('data-state', 'active')
      })
    })

    it('switches to Components tab on click', async () => {
      renderWithRouter(<StationsPage />, { router: { initialPath: '/stations' } })

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Components' })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('tab', { name: 'Components' }))

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Components' })).toHaveAttribute('data-state', 'active')
        expect(screen.getByText('Component Library')).toBeInTheDocument()
      })
    })

    it('remembers selected tab in session storage', async () => {
      renderWithRouter(<StationsPage />, { router: { initialPath: '/stations' } })

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Components' })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('tab', { name: 'Components' }))

      await waitFor(() => {
        expect(sessionStorage.getItem('stationpro-stations-active-tab')).toBe('components')
      })
    })

    it('restores tab from session storage on mount', async () => {
      sessionStorage.setItem('stationpro-stations-active-tab', 'components')

      renderWithRouter(<StationsPage />, { router: { initialPath: '/stations' } })

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Components' })).toHaveAttribute('data-state', 'active')
      })
    })

    it('shows placeholder for Stations tab', async () => {
      renderWithRouter(<StationsPage />, { router: { initialPath: '/stations' } })

      await waitFor(() => {
        expect(screen.getByText(/Stations workflow will be implemented in Epic 4/i)).toBeInTheDocument()
      })
    })

    it('shows placeholder for Analysis tab', async () => {
      renderWithRouter(<StationsPage />, { router: { initialPath: '/stations' } })

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Analysis' })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('tab', { name: 'Analysis' }))

      await waitFor(() => {
        expect(screen.getByText(/Analysis workflow will be implemented in Epic 4/i)).toBeInTheDocument()
      })
    })
  })

  describe('AC-2.8.2: Components Data Grid with Sortable Columns', () => {
    it('loads and displays components from repository', async () => {
      renderWithRouter(<StationsPage />, { router: { initialPath: '/stations' } })

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Components' })).toBeInTheDocument()
      })
      await user.click(screen.getByRole('tab', { name: 'Components' }))

      await waitFor(() => {
        expect(screen.getByText('LMI Technologies')).toBeInTheDocument()
        expect(screen.getByText('Gocator 2512')).toBeInTheDocument()
        expect(screen.getByText('Basler')).toBeInTheDocument()
      })
    })

    it('renders all column headers', async () => {
      renderWithRouter(<StationsPage />, { router: { initialPath: '/stations' } })

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Components' })).toBeInTheDocument()
      })
      await user.click(screen.getByRole('tab', { name: 'Components' }))

      await waitFor(() => {
        expect(screen.getByText('Manufacturer')).toBeInTheDocument()
        expect(screen.getByText('Model')).toBeInTheDocument()
        expect(screen.getByText('Type')).toBeInTheDocument()
        expect(screen.getByText('Active')).toBeInTheDocument()
      })
    })

    it('displays human-readable type labels', async () => {
      renderWithRouter(<StationsPage />, { router: { initialPath: '/stations' } })

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Components' })).toBeInTheDocument()
      })
      await user.click(screen.getByRole('tab', { name: 'Components' }))

      await waitFor(() => {
        expect(screen.getByText('Laser Profiler')).toBeInTheDocument()
        expect(screen.getByText('Areascan Camera')).toBeInTheDocument()
        expect(screen.getByText('Lens')).toBeInTheDocument()
      })
    })

    it('sorts data when clicking column header', async () => {
      renderWithRouter(<StationsPage />, { router: { initialPath: '/stations' } })

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Components' })).toBeInTheDocument()
      })
      await user.click(screen.getByRole('tab', { name: 'Components' }))

      await waitFor(() => {
        expect(screen.getByText('LMI Technologies')).toBeInTheDocument()
      })

      // Click Manufacturer column to sort ascending
      await user.click(screen.getByText('Manufacturer'))

      // After ascending sort, Basler should be first
      const rows = screen.getAllByRole('row')
      expect(rows[1]).toHaveTextContent('Basler')
    })

    it('shows loading skeleton while loading', async () => {
      vi.spyOn(componentsRepository, 'getAll').mockImplementation(
        () => new Promise(() => {})
      )

      renderWithRouter(<StationsPage />, { router: { initialPath: '/stations' } })

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Components' })).toBeInTheDocument()
      })
      await user.click(screen.getByRole('tab', { name: 'Components' }))

      await waitFor(() => {
        expect(screen.getByTestId('components-loading-skeleton')).toBeInTheDocument()
      })
    })

    it('shows empty state when no components', async () => {
      vi.spyOn(componentsRepository, 'getAll').mockResolvedValue([])

      renderWithRouter(<StationsPage />, { router: { initialPath: '/stations' } })

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Components' })).toBeInTheDocument()
      })
      await user.click(screen.getByRole('tab', { name: 'Components' }))

      await waitFor(() => {
        expect(screen.getByText('No components imported yet')).toBeInTheDocument()
      })
    })
  })

  describe('AC-2.8.3: Floating Filter Panel', () => {
    it('opens filter panel when filter chip is clicked', async () => {
      renderWithRouter(<StationsPage />, { router: { initialPath: '/stations' } })

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Components' })).toBeInTheDocument()
      })
      await user.click(screen.getByRole('tab', { name: 'Components' }))

      await waitFor(() => {
        expect(screen.getByText('LMI Technologies')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /filter/i }))

      expect(screen.getByText('Filter Components')).toBeInTheDocument()
    })

    it('filters components by model search', async () => {
      renderWithRouter(<StationsPage />, { router: { initialPath: '/stations' } })

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Components' })).toBeInTheDocument()
      })
      await user.click(screen.getByRole('tab', { name: 'Components' }))

      await waitFor(() => {
        expect(screen.getByText('Gocator 2512')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /filter/i }))

      const searchInput = screen.getByPlaceholderText('Search model...')
      await user.type(searchInput, 'Gocator')

      await user.click(screen.getByRole('button', { name: 'Apply' }))

      expect(screen.getByText('Gocator 2512')).toBeInTheDocument()
      expect(screen.queryByText('acA2048-55uc')).not.toBeInTheDocument()
    })

    it('shows filter count chip when filters are active', async () => {
      renderWithRouter(<StationsPage />, { router: { initialPath: '/stations' } })

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Components' })).toBeInTheDocument()
      })
      await user.click(screen.getByRole('tab', { name: 'Components' }))

      await waitFor(() => {
        expect(screen.getByText('LMI Technologies')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /filter/i }))

      const searchInput = screen.getByPlaceholderText('Search model...')
      await user.type(searchInput, 'test')

      await user.click(screen.getByRole('button', { name: 'Apply' }))

      expect(screen.getByTestId('filter-count')).toHaveTextContent('1')
    })

    it('clears all filters when Clear All is clicked', async () => {
      renderWithRouter(<StationsPage />, { router: { initialPath: '/stations' } })

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Components' })).toBeInTheDocument()
      })
      await user.click(screen.getByRole('tab', { name: 'Components' }))

      await waitFor(() => {
        expect(screen.getByText('LMI Technologies')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /filter/i }))

      const searchInput = screen.getByPlaceholderText('Search model...')
      await user.type(searchInput, 'Gocator')

      await user.click(screen.getByRole('button', { name: 'Clear All' }))

      await waitFor(() => {
        expect(screen.getByText('Gocator 2512')).toBeInTheDocument()
        expect(screen.getByText('acA2048-55uc')).toBeInTheDocument()
        expect(screen.getByText('TC-2340')).toBeInTheDocument()
      })
    })
  })

  describe('AC-2.8.4: Column Configuration with Persistence', () => {
    it('opens column config dropdown when gear icon is clicked', async () => {
      renderWithRouter(<StationsPage />, { router: { initialPath: '/stations' } })

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Components' })).toBeInTheDocument()
      })
      await user.click(screen.getByRole('tab', { name: 'Components' }))

      await waitFor(() => {
        expect(screen.getByText('LMI Technologies')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /configure columns/i }))

      expect(screen.getByText('Toggle Columns')).toBeInTheDocument()
    })

    it('persists column visibility to localStorage', async () => {
      renderWithRouter(<StationsPage />, { router: { initialPath: '/stations' } })

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Components' })).toBeInTheDocument()
      })
      await user.click(screen.getByRole('tab', { name: 'Components' }))

      await waitFor(() => {
        expect(screen.getByText('LMI Technologies')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /configure columns/i }))

      await user.click(screen.getByRole('menuitemcheckbox', { name: 'Model' }))

      await waitFor(() => {
        const stored = localStorage.getItem('stationpro-components-columns')
        expect(stored).not.toBeNull()
        const parsed = JSON.parse(stored!)
        expect(parsed.Model).toBe(false)
      })
    })

    it('restores column visibility from localStorage on mount', async () => {
      localStorage.setItem(
        'stationpro-components-columns',
        JSON.stringify({ Model: false })
      )

      renderWithRouter(<StationsPage />, { router: { initialPath: '/stations' } })

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Components' })).toBeInTheDocument()
      })
      await user.click(screen.getByRole('tab', { name: 'Components' }))

      await waitFor(() => {
        expect(screen.getByText('LMI Technologies')).toBeInTheDocument()
      })

      // Model column header should not be visible
      expect(screen.queryByText('Model')).not.toBeInTheDocument()
    })
  })

  describe('AC-2.8.5: Row Click Opens Detail Side Panel', () => {
    it('opens detail panel when row is clicked', async () => {
      renderWithRouter(<StationsPage />, { router: { initialPath: '/stations' } })

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Components' })).toBeInTheDocument()
      })
      await user.click(screen.getByRole('tab', { name: 'Components' }))

      await waitFor(() => {
        expect(screen.getByText('LMI Technologies')).toBeInTheDocument()
      })

      await user.click(screen.getByText('LMI Technologies'))

      await waitFor(() => {
        // Detail panel header shows combined manufacturer + model
        expect(screen.getByText('LMI Technologies Gocator 2512')).toBeInTheDocument()
        // Type label appears in both table and detail panel, so use getAllByText
        expect(screen.getAllByText('Laser Profiler').length).toBeGreaterThanOrEqual(1)
      })
    })

    it('displays type-specific details for LaserLineProfiler', async () => {
      renderWithRouter(<StationsPage />, { router: { initialPath: '/stations' } })

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Components' })).toBeInTheDocument()
      })
      await user.click(screen.getByRole('tab', { name: 'Components' }))

      await waitFor(() => {
        expect(screen.getByText('LMI Technologies')).toBeInTheDocument()
      })

      await user.click(screen.getByText('LMI Technologies'))

      await waitFor(() => {
        expect(screen.getByText('Field of View')).toBeInTheDocument()
        expect(screen.getByText('Working Distance')).toBeInTheDocument()
        expect(screen.getByText('Resolution')).toBeInTheDocument()
      })
    })

    it('updates panel content when clicking different row', async () => {
      renderWithRouter(<StationsPage />, { router: { initialPath: '/stations' } })

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Components' })).toBeInTheDocument()
      })
      await user.click(screen.getByRole('tab', { name: 'Components' }))

      await waitFor(() => {
        expect(screen.getByText('LMI Technologies')).toBeInTheDocument()
      })

      await user.click(screen.getByText('LMI Technologies'))

      await waitFor(() => {
        expect(screen.getByText('LMI Technologies Gocator 2512')).toBeInTheDocument()
      })

      await user.keyboard('{Escape}')

      await waitFor(() => {
        expect(screen.queryByText('LMI Technologies Gocator 2512')).not.toBeInTheDocument()
      })

      await user.click(screen.getByText('Basler'))

      await waitFor(() => {
        expect(screen.getByText('Basler acA2048-55uc')).toBeInTheDocument()
      })
    })
  })

  describe('AC-2.8.6: Edit and Delete Component Actions', () => {
    it('opens edit wizard when Edit button is clicked', async () => {
      renderWithRouter(<StationsPage />, { router: { initialPath: '/stations' } })

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Components' })).toBeInTheDocument()
      })
      await user.click(screen.getByRole('tab', { name: 'Components' }))

      await waitFor(() => {
        expect(screen.getByText('LMI Technologies')).toBeInTheDocument()
      })

      await user.click(screen.getByText('LMI Technologies'))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /edit/i }))

      await waitFor(() => {
        expect(screen.getByText('Component Info')).toBeInTheDocument()
      })
    })

    it('opens delete confirmation when Delete button is clicked', async () => {
      renderWithRouter(<StationsPage />, { router: { initialPath: '/stations' } })

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Components' })).toBeInTheDocument()
      })
      await user.click(screen.getByRole('tab', { name: 'Components' }))

      await waitFor(() => {
        expect(screen.getByText('LMI Technologies')).toBeInTheDocument()
      })

      await user.click(screen.getByText('LMI Technologies'))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /delete/i }))

      await waitFor(() => {
        expect(screen.getByText(/Delete LMI Technologies Gocator 2512\?/i)).toBeInTheDocument()
        expect(screen.getByText(/cannot be undone/i)).toBeInTheDocument()
      })
    })

    it('deletes component and shows toast on confirm', async () => {
      renderWithRouter(<StationsPage />, { router: { initialPath: '/stations' } })

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Components' })).toBeInTheDocument()
      })
      await user.click(screen.getByRole('tab', { name: 'Components' }))

      await waitFor(() => {
        expect(screen.getByText('LMI Technologies')).toBeInTheDocument()
      })

      await user.click(screen.getByText('LMI Technologies'))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /delete/i }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: 'Delete' }))

      await waitFor(() => {
        expect(componentsRepository.delete).toHaveBeenCalledWith('LMI-G2-001')
        expect(toast.success).toHaveBeenCalledWith('Component deleted')
      })
    })

    it('cancels delete when Cancel is clicked', async () => {
      renderWithRouter(<StationsPage />, { router: { initialPath: '/stations' } })

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Components' })).toBeInTheDocument()
      })
      await user.click(screen.getByRole('tab', { name: 'Components' }))

      await waitFor(() => {
        expect(screen.getByText('LMI Technologies')).toBeInTheDocument()
      })

      await user.click(screen.getByText('LMI Technologies'))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /delete/i }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: 'Cancel' }))

      expect(componentsRepository.delete).not.toHaveBeenCalled()
    })
  })
})
