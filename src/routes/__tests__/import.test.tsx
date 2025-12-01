import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import { renderWithRouter, screen, waitFor } from '@/test/router-utils'
import { ImportPage } from '../import'
import * as sampleDataModule from '@/lib/sampleData'
import { toast } from 'sonner'

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
  }),
}))

describe('Data Import Screen (Story 2.2)', () => {
  describe('AC-2.2.1: /import Route Renders Centered Card Stack Layout', () => {
    it('renders page title "Import Data"', async () => {
      renderWithRouter(<ImportPage />, { router: { initialPath: '/import' } })
      expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(
        'Import Data'
      )
    })

    it('renders subtitle text', async () => {
      renderWithRouter(<ImportPage />, { router: { initialPath: '/import' } })
      expect(
        await screen.findByText('Add parts or components to your library')
      ).toBeInTheDocument()
    })

    it('renders centered layout with max-width', async () => {
      renderWithRouter(<ImportPage />, { router: { initialPath: '/import' } })
      const heading = await screen.findByRole('heading', { level: 1 })
      const container = heading.closest('.max-w-md')
      expect(container).toBeInTheDocument()
    })

    it('renders layout centered vertically', async () => {
      renderWithRouter(<ImportPage />, { router: { initialPath: '/import' } })
      const heading = await screen.findByRole('heading', { level: 1 })
      const outerContainer = heading.closest('.items-center')
      expect(outerContainer).toBeInTheDocument()
      expect(outerContainer).toHaveClass('justify-center')
    })

    it('renders without console errors', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      renderWithRouter(<ImportPage />, { router: { initialPath: '/import' } })
      await screen.findByRole('heading', { level: 1 })
      expect(consoleSpy).not.toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  describe('AC-2.2.2: Parts and Components Tabs Are Functional', () => {
    it('renders Parts tab', async () => {
      renderWithRouter(<ImportPage />, { router: { initialPath: '/import' } })
      expect(await screen.findByRole('tab', { name: 'Parts' })).toBeInTheDocument()
    })

    it('renders Components tab', async () => {
      renderWithRouter(<ImportPage />, { router: { initialPath: '/import' } })
      expect(
        await screen.findByRole('tab', { name: 'Components' })
      ).toBeInTheDocument()
    })

    it('Parts tab is active by default', async () => {
      renderWithRouter(<ImportPage />, { router: { initialPath: '/import' } })
      const partsTab = await screen.findByRole('tab', { name: 'Parts' })
      expect(partsTab).toHaveAttribute('data-state', 'active')
    })

    it('clicking Components tab switches content', async () => {
      const user = userEvent.setup()
      renderWithRouter(<ImportPage />, { router: { initialPath: '/import' } })

      const componentsTab = await screen.findByRole('tab', { name: 'Components' })
      await user.click(componentsTab)

      expect(componentsTab).toHaveAttribute('data-state', 'active')
    })

    it('tab switching updates content area', async () => {
      const user = userEvent.setup()
      renderWithRouter(<ImportPage />, { router: { initialPath: '/import' } })

      // Parts tab active by default - verify Parts content is shown
      expect(await screen.findByText('Import parts from a JSON file')).toBeInTheDocument()

      // Switch to Components tab
      const componentsTab = await screen.findByRole('tab', { name: 'Components' })
      await user.click(componentsTab)

      // Verify Components content is shown
      expect(await screen.findByText('Import components from a JSON file')).toBeInTheDocument()
    })
  })

  describe('AC-2.2.3: Each Tab Shows 3 Action Cards', () => {
    describe('Parts Tab', () => {
      it('renders Upload JSON card', async () => {
        renderWithRouter(<ImportPage />, { router: { initialPath: '/import' } })
        expect(await screen.findByText('Upload JSON File')).toBeInTheDocument()
        expect(
          screen.getByText('Import parts from a JSON file')
        ).toBeInTheDocument()
      })

      it('renders Add Manually card', async () => {
        renderWithRouter(<ImportPage />, { router: { initialPath: '/import' } })
        expect(await screen.findByText('Add Manually')).toBeInTheDocument()
        expect(
          screen.getByText('Enter part details using a guided wizard')
        ).toBeInTheDocument()
      })

      it('renders Load Sample Data card', async () => {
        renderWithRouter(<ImportPage />, { router: { initialPath: '/import' } })
        expect(await screen.findByText('Load Sample Data')).toBeInTheDocument()
        expect(
          screen.getByText('Explore with pre-loaded example parts')
        ).toBeInTheDocument()
      })

      it('all cards are clickable', async () => {
        renderWithRouter(<ImportPage />, { router: { initialPath: '/import' } })
        const uploadCard = await screen.findByText('Upload JSON File')
        const uploadButton = uploadCard.closest('button')
        expect(uploadButton).toBeInTheDocument()
        expect(uploadButton).not.toBeDisabled()
      })
    })

    describe('Components Tab', () => {
      it('renders 3 action cards after switching', async () => {
        const user = userEvent.setup()
        renderWithRouter(<ImportPage />, { router: { initialPath: '/import' } })

        const componentsTab = await screen.findByRole('tab', { name: 'Components' })
        await user.click(componentsTab)

        expect(
          await screen.findByText('Import components from a JSON file')
        ).toBeInTheDocument()
        expect(
          screen.getByText('Enter component details using a guided wizard')
        ).toBeInTheDocument()
        expect(
          screen.getByText('Explore with pre-loaded example components')
        ).toBeInTheDocument()
      })
    })
  })

  describe('AC-2.2.3: Card Click Handlers', () => {
    const user = userEvent.setup()

    beforeEach(() => {
      vi.clearAllMocks()
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('Upload JSON card opens Parts JSON upload modal (Parts)', async () => {
      renderWithRouter(<ImportPage />, { router: { initialPath: '/import' } })

      const uploadCard = await screen.findByText('Upload JSON File')
      await user.click(uploadCard.closest('button')!)

      // Modal should open with title
      expect(await screen.findByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('Import Parts from JSON')).toBeInTheDocument()
    })

    it('Add Manually card opens manual entry modal (Parts)', async () => {
      renderWithRouter(<ImportPage />, { router: { initialPath: '/import' } })

      const addCard = await screen.findByText('Add Manually')
      await user.click(addCard.closest('button')!)

      // Modal should open with title
      expect(await screen.findByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('Add Part Manually')).toBeInTheDocument()
    })

    it('Load Sample Data card loads data and navigates to /parts', async () => {
      vi.spyOn(sampleDataModule, 'loadSampleData').mockResolvedValue(undefined)

      const { router, queryClient } = renderWithRouter(<ImportPage />, {
        router: { initialPath: '/import' },
      })

      const loadCard = await screen.findByText('Load Sample Data')
      await user.click(loadCard.closest('button')!)

      await waitFor(() => {
        expect(sampleDataModule.loadSampleData).toHaveBeenCalledWith(queryClient)
      })

      await waitFor(() => {
        expect(router.state.location.pathname).toBe('/parts')
      })

      expect(toast.success).toHaveBeenCalledWith(
        'Sample parts loaded successfully'
      )
    })

    it('Upload JSON card opens ComponentsJsonUploadModal (Components)', async () => {
      renderWithRouter(<ImportPage />, { router: { initialPath: '/import' } })

      // Switch to Components tab
      const componentsTab = await screen.findByRole('tab', { name: 'Components' })
      await user.click(componentsTab)

      const uploadCard = await screen.findByText('Upload JSON File')
      await user.click(uploadCard.closest('button')!)

      // Modal should open with title
      await waitFor(() => {
        expect(screen.getByText('Import Components from JSON')).toBeInTheDocument()
      })
    })

    it('Add Manually card shows placeholder toast (Components)', async () => {
      renderWithRouter(<ImportPage />, { router: { initialPath: '/import' } })

      // Switch to Components tab
      const componentsTab = await screen.findByRole('tab', { name: 'Components' })
      await user.click(componentsTab)

      const addCard = await screen.findByText('Add Manually')
      await user.click(addCard.closest('button')!)

      expect(toast).toHaveBeenCalledWith('Manual entry wizard coming in Story 2.6')
    })

    it('Load Sample Data card loads data and navigates to /stations (Components)', async () => {
      vi.spyOn(sampleDataModule, 'loadSampleData').mockResolvedValue(undefined)

      const { router, queryClient } = renderWithRouter(<ImportPage />, {
        router: { initialPath: '/import' },
      })

      // Switch to Components tab
      const componentsTab = await screen.findByRole('tab', { name: 'Components' })
      await user.click(componentsTab)

      const loadCard = await screen.findByText('Load Sample Data')
      await user.click(loadCard.closest('button')!)

      await waitFor(() => {
        expect(sampleDataModule.loadSampleData).toHaveBeenCalledWith(queryClient)
      })

      await waitFor(() => {
        expect(router.state.location.pathname).toBe('/stations')
      })

      expect(toast.success).toHaveBeenCalledWith(
        'Sample components loaded successfully'
      )
    })

    it('shows error toast on sample data load failure', async () => {
      vi.spyOn(sampleDataModule, 'loadSampleData').mockRejectedValue(
        new Error('Network error')
      )

      const { router } = renderWithRouter(<ImportPage />, {
        router: { initialPath: '/import' },
      })

      const loadCard = await screen.findByText('Load Sample Data')
      await user.click(loadCard.closest('button')!)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Network error')
      })

      // Should stay on import page
      expect(router.state.location.pathname).toBe('/import')
    })

    it('disables Load Sample Data card while loading', async () => {
      let resolveLoad: () => void
      const loadPromise = new Promise<void>((resolve) => {
        resolveLoad = resolve
      })

      vi.spyOn(sampleDataModule, 'loadSampleData').mockReturnValue(loadPromise)

      renderWithRouter(<ImportPage />, { router: { initialPath: '/import' } })

      const loadCard = await screen.findByText('Load Sample Data')
      const loadButton = loadCard.closest('button')!

      await user.click(loadButton)

      // Button should be disabled while loading
      expect(loadButton).toBeDisabled()

      // Resolve to cleanup
      resolveLoad!()

      await waitFor(() => {
        expect(sampleDataModule.loadSampleData).toHaveBeenCalled()
      })
    })
  })
})
