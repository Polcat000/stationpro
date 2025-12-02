// src/routes/__tests__/parts.test.tsx
// Integration tests for Parts Library page (AC 2.7.1 - 2.7.5)
// Ref: docs/sprint-artifacts/2-7-parts-library-screen.md

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import { renderWithRouter, screen, waitFor } from '@/test/router-utils'
import { PartsLibraryPage } from '@/components/parts'
import { partsRepository } from '@/lib/repositories/partsRepository'
import { toast } from 'sonner'
import type { Part } from '@/lib/schemas/part'

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

const mockParts: Part[] = [
  {
    PartCallout: 'PART-001',
    PartSeries: 'Series-A',
    PartWidth_mm: 100,
    PartHeight_mm: 50,
    PartLength_mm: 200,
    SmallestLateralFeature_um: 10,
    SmallestDepthFeature_um: 5,
    InspectionZones: [
      {
        ZoneID: 'Z1',
        Name: 'Top Zone',
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
    PartSeries: 'Series-B',
    PartWidth_mm: 150,
    PartHeight_mm: 75,
    PartLength_mm: 300,
    SmallestLateralFeature_um: 15,
    InspectionZones: [
      {
        ZoneID: 'Z2',
        Name: 'Front Zone',
        Face: 'Front',
        ZoneDepth_mm: 10,
        ZoneOffset_mm: 5,
        RequiredCoverage_pct: 100,
        MinPixelsPerFeature: 3,
      },
      {
        ZoneID: 'Z3',
        Name: 'Back Zone',
        Face: 'Back',
        ZoneDepth_mm: 8,
        ZoneOffset_mm: 2,
        RequiredCoverage_pct: 100,
        MinPixelsPerFeature: 3,
      },
    ],
  },
  {
    PartCallout: 'PART-003',
    PartSeries: 'Series-A',
    PartWidth_mm: 80,
    PartHeight_mm: 40,
    PartLength_mm: 160,
    SmallestLateralFeature_um: 8,
    InspectionZones: [
      {
        ZoneID: 'Z4',
        Name: 'Bottom Zone',
        Face: 'Bottom',
        ZoneDepth_mm: 3,
        ZoneOffset_mm: 1,
        RequiredCoverage_pct: 100,
        MinPixelsPerFeature: 3,
      },
    ],
  },
]

describe('Parts Library Page', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    vi.spyOn(partsRepository, 'getAll').mockResolvedValue(mockParts)
    vi.spyOn(partsRepository, 'save').mockImplementation(async (part) => part)
    vi.spyOn(partsRepository, 'delete').mockResolvedValue(true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  describe('AC-2.7.1: Data Grid Renders with Sortable Columns', () => {
    it('renders page title', async () => {
      renderWithRouter(<PartsLibraryPage />, { router: { initialPath: '/parts' } })

      await waitFor(() => {
        expect(screen.getByText('Parts Library')).toBeInTheDocument()
      })
    })

    it('loads and displays parts from repository', async () => {
      renderWithRouter(<PartsLibraryPage />, { router: { initialPath: '/parts' } })

      await waitFor(() => {
        expect(screen.getByText('PART-001')).toBeInTheDocument()
        expect(screen.getByText('PART-002')).toBeInTheDocument()
        expect(screen.getByText('PART-003')).toBeInTheDocument()
      })
    })

    it('shows loading skeleton while loading', async () => {
      // Use a never-resolving promise to keep loading state
      vi.spyOn(partsRepository, 'getAll').mockImplementation(
        () => new Promise(() => {})
      )

      renderWithRouter(<PartsLibraryPage />, { router: { initialPath: '/parts' } })

      // Should show skeleton during loading (wait for component to mount)
      await waitFor(() => {
        expect(screen.getByTestId('parts-loading-skeleton')).toBeInTheDocument()
      })
    })

    it('renders all column headers', async () => {
      renderWithRouter(<PartsLibraryPage />, { router: { initialPath: '/parts' } })

      await waitFor(() => {
        expect(screen.getByText('Callout')).toBeInTheDocument()
        expect(screen.getByText('Series')).toBeInTheDocument()
        expect(screen.getByText('Width (mm)')).toBeInTheDocument()
        expect(screen.getByText('Height (mm)')).toBeInTheDocument()
        expect(screen.getByText('Length (mm)')).toBeInTheDocument()
        expect(screen.getByText('# Zones')).toBeInTheDocument()
        expect(screen.getByText('Active')).toBeInTheDocument()
      })
    })

    it('sorts data when clicking column header', async () => {
      renderWithRouter(<PartsLibraryPage />, { router: { initialPath: '/parts' } })

      await waitFor(() => {
        expect(screen.getByText('PART-001')).toBeInTheDocument()
      })

      // Click Width column to sort ascending
      await user.click(screen.getByText('Width (mm)'))

      // After ascending sort by width, PART-003 (80mm) should be first
      const rows = screen.getAllByRole('row')
      expect(rows[1]).toHaveTextContent('PART-003')
    })
  })

  describe('AC-2.7.2: Floating Filter Panel', () => {
    it('opens filter panel when filter chip is clicked', async () => {
      renderWithRouter(<PartsLibraryPage />, { router: { initialPath: '/parts' } })

      await waitFor(() => {
        expect(screen.getByText('PART-001')).toBeInTheDocument()
      })

      // Click the filter button
      await user.click(screen.getByRole('button', { name: /filter/i }))

      // Filter panel should be visible
      expect(screen.getByText('Filter Parts')).toBeInTheDocument()
    })

    it('filters parts by callout search', async () => {
      renderWithRouter(<PartsLibraryPage />, { router: { initialPath: '/parts' } })

      await waitFor(() => {
        expect(screen.getByText('PART-001')).toBeInTheDocument()
      })

      // Open filter panel
      await user.click(screen.getByRole('button', { name: /filter/i }))

      // Type in callout search
      const searchInput = screen.getByPlaceholderText('Search callout...')
      await user.type(searchInput, '001')

      // Close panel
      await user.click(screen.getByRole('button', { name: 'Apply' }))

      // Only PART-001 should be visible
      expect(screen.getByText('PART-001')).toBeInTheDocument()
      expect(screen.queryByText('PART-002')).not.toBeInTheDocument()
      expect(screen.queryByText('PART-003')).not.toBeInTheDocument()
    })

    it('shows filter count chip when filters are active', async () => {
      renderWithRouter(<PartsLibraryPage />, { router: { initialPath: '/parts' } })

      await waitFor(() => {
        expect(screen.getByText('PART-001')).toBeInTheDocument()
      })

      // Open filter panel
      await user.click(screen.getByRole('button', { name: /filter/i }))

      // Type in callout search
      const searchInput = screen.getByPlaceholderText('Search callout...')
      await user.type(searchInput, 'PART')

      // Close panel
      await user.click(screen.getByRole('button', { name: 'Apply' }))

      // Filter count badge should show 1
      expect(screen.getByTestId('filter-count')).toHaveTextContent('1')
    })

    it('clears all filters when Clear All is clicked', async () => {
      renderWithRouter(<PartsLibraryPage />, { router: { initialPath: '/parts' } })

      await waitFor(() => {
        expect(screen.getByText('PART-001')).toBeInTheDocument()
      })

      // Open filter panel and add a filter
      await user.click(screen.getByRole('button', { name: /filter/i }))
      const searchInput = screen.getByPlaceholderText('Search callout...')
      await user.type(searchInput, '001')

      // Click Clear All
      await user.click(screen.getByRole('button', { name: 'Clear All' }))

      // All parts should be visible again
      await waitFor(() => {
        expect(screen.getByText('PART-001')).toBeInTheDocument()
        expect(screen.getByText('PART-002')).toBeInTheDocument()
        expect(screen.getByText('PART-003')).toBeInTheDocument()
      })
    })
  })

  describe('AC-2.7.3: Column Configuration with Persistence', () => {
    it('opens column config dropdown when gear icon is clicked', async () => {
      renderWithRouter(<PartsLibraryPage />, { router: { initialPath: '/parts' } })

      await waitFor(() => {
        expect(screen.getByText('PART-001')).toBeInTheDocument()
      })

      // Click the column config button
      await user.click(screen.getByRole('button', { name: /configure columns/i }))

      // Column options should be visible
      expect(screen.getByText('Toggle Columns')).toBeInTheDocument()
    })

    it('persists column visibility to localStorage', async () => {
      renderWithRouter(<PartsLibraryPage />, { router: { initialPath: '/parts' } })

      await waitFor(() => {
        expect(screen.getByText('PART-001')).toBeInTheDocument()
      })

      // Open column config
      await user.click(screen.getByRole('button', { name: /configure columns/i }))

      // Toggle off Series column - use menuitemcheckbox role to target dropdown item
      await user.click(screen.getByRole('menuitemcheckbox', { name: 'Series' }))

      // Check localStorage was updated
      await waitFor(() => {
        const stored = localStorage.getItem('stationpro-parts-columns')
        expect(stored).not.toBeNull()
        const parsed = JSON.parse(stored!)
        expect(parsed.PartSeries).toBe(false)
      })
    })

    it('restores column visibility from localStorage on mount', async () => {
      // Pre-set localStorage with Series hidden
      localStorage.setItem(
        'stationpro-parts-columns',
        JSON.stringify({ PartSeries: false })
      )

      renderWithRouter(<PartsLibraryPage />, { router: { initialPath: '/parts' } })

      await waitFor(() => {
        expect(screen.getByText('PART-001')).toBeInTheDocument()
      })

      // Series column header should not be visible
      expect(screen.queryByText('Series')).not.toBeInTheDocument()
    })
  })

  describe('AC-2.7.4: Row Click Opens Detail Side Panel', () => {
    it('opens detail panel when row is clicked', async () => {
      renderWithRouter(<PartsLibraryPage />, { router: { initialPath: '/parts' } })

      await waitFor(() => {
        expect(screen.getByText('PART-001')).toBeInTheDocument()
      })

      // Click on the first part row
      await user.click(screen.getByText('PART-001'))

      // Detail panel should show part info
      await waitFor(() => {
        expect(screen.getByText('Series: Series-A')).toBeInTheDocument()
        expect(screen.getByText('Dimensions')).toBeInTheDocument()
      })
    })

    it('updates panel content when clicking different row', async () => {
      renderWithRouter(<PartsLibraryPage />, { router: { initialPath: '/parts' } })

      await waitFor(() => {
        expect(screen.getByText('PART-001')).toBeInTheDocument()
      })

      // Click first part
      await user.click(screen.getByText('PART-001'))

      await waitFor(() => {
        expect(screen.getByText('Series: Series-A')).toBeInTheDocument()
      })

      // Close the panel first (user would click X or press Escape)
      await user.keyboard('{Escape}')

      await waitFor(() => {
        expect(screen.queryByText('Series: Series-A')).not.toBeInTheDocument()
      })

      // Click second part
      await user.click(screen.getByText('PART-002'))

      // Panel should update to show PART-002 info
      await waitFor(() => {
        expect(screen.getByText('Series: Series-B')).toBeInTheDocument()
      })
    })
  })

  describe('AC-2.7.5: Edit and Delete Part Actions', () => {
    it('opens edit wizard when Edit button is clicked', async () => {
      renderWithRouter(<PartsLibraryPage />, { router: { initialPath: '/parts' } })

      await waitFor(() => {
        expect(screen.getByText('PART-001')).toBeInTheDocument()
      })

      // Click on part row to open detail panel
      await user.click(screen.getByText('PART-001'))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument()
      })

      // Click Edit button
      await user.click(screen.getByRole('button', { name: /edit/i }))

      // Wizard should open with part data
      await waitFor(() => {
        expect(screen.getByText('Basic Info')).toBeInTheDocument()
      })
    })

    it('opens delete confirmation when Delete button is clicked', async () => {
      renderWithRouter(<PartsLibraryPage />, { router: { initialPath: '/parts' } })

      await waitFor(() => {
        expect(screen.getByText('PART-001')).toBeInTheDocument()
      })

      // Click on part row to open detail panel
      await user.click(screen.getByText('PART-001'))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
      })

      // Click Delete button
      await user.click(screen.getByRole('button', { name: /delete/i }))

      // Confirmation dialog should appear
      await waitFor(() => {
        expect(screen.getByText(/Delete PART-001\?/i)).toBeInTheDocument()
        expect(screen.getByText(/cannot be undone/i)).toBeInTheDocument()
      })
    })

    it('deletes part and shows toast on confirm', async () => {
      renderWithRouter(<PartsLibraryPage />, { router: { initialPath: '/parts' } })

      await waitFor(() => {
        expect(screen.getByText('PART-001')).toBeInTheDocument()
      })

      // Open detail panel
      await user.click(screen.getByText('PART-001'))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
      })

      // Click Delete
      await user.click(screen.getByRole('button', { name: /delete/i }))

      // Confirm deletion
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: 'Delete' }))

      // Should call repository delete and show toast
      await waitFor(() => {
        expect(partsRepository.delete).toHaveBeenCalledWith('PART-001')
        expect(toast.success).toHaveBeenCalledWith('Part deleted')
      })
    })

    it('cancels delete when Cancel is clicked', async () => {
      renderWithRouter(<PartsLibraryPage />, { router: { initialPath: '/parts' } })

      await waitFor(() => {
        expect(screen.getByText('PART-001')).toBeInTheDocument()
      })

      // Open detail panel
      await user.click(screen.getByText('PART-001'))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
      })

      // Click Delete
      await user.click(screen.getByRole('button', { name: /delete/i }))

      // Click Cancel
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: 'Cancel' }))

      // Delete should not have been called
      expect(partsRepository.delete).not.toHaveBeenCalled()
    })
  })

  describe('Empty State', () => {
    it('shows empty message when no parts', async () => {
      vi.spyOn(partsRepository, 'getAll').mockResolvedValue([])

      renderWithRouter(<PartsLibraryPage />, { router: { initialPath: '/parts' } })

      await waitFor(() => {
        expect(screen.getByText('No parts found.')).toBeInTheDocument()
      })
    })
  })
})
