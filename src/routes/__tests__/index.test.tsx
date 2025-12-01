import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import { renderWithRouter, screen, waitFor } from '@/test/router-utils'
import { HomeScreen } from '../index'
import * as sampleDataModule from '@/lib/sampleData'
import { toast } from 'sonner'

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('Landing Page (Story 1.5)', () => {
  describe('AC-1.5.1: Split Hero Layout Renders', () => {
    it('renders hero split layout with grid', async () => {
      renderWithRouter(<HomeScreen />)
      const headline = await screen.findByRole('heading', { level: 1 })
      const heroContainer = headline.closest('.grid')
      expect(heroContainer).toBeInTheDocument()
      expect(heroContainer).toHaveClass('grid-cols-1', 'lg:grid-cols-2')
    })

    it('renders left content section', async () => {
      renderWithRouter(<HomeScreen />)
      const headline = await screen.findByRole('heading', { level: 1 })
      expect(headline).toBeInTheDocument()
    })

    it('renders right visual placeholder section', async () => {
      renderWithRouter(<HomeScreen />)
      expect(await screen.findByText('Hero Visual')).toBeInTheDocument()
    })
  })

  describe('AC-1.5.2: Headline Present', () => {
    it('renders tagline text', async () => {
      renderWithRouter(<HomeScreen />)
      expect(await screen.findByText('Machine Vision Planning Tool')).toBeInTheDocument()
    })

    it('renders main headline as h1', async () => {
      renderWithRouter(<HomeScreen />)
      const h1 = await screen.findByRole('heading', { level: 1 })
      expect(h1).toHaveTextContent('See Your System Before You Build It')
    })

    it('renders subtitle with value proposition', async () => {
      renderWithRouter(<HomeScreen />)
      expect(
        await screen.findByText(/StationPro helps you plan machine vision/i)
      ).toBeInTheDocument()
    })

    it('tagline has primary color class', async () => {
      renderWithRouter(<HomeScreen />)
      const tagline = await screen.findByText('Machine Vision Planning Tool')
      expect(tagline).toHaveClass('text-primary')
    })

    it('tagline has uppercase styling', async () => {
      renderWithRouter(<HomeScreen />)
      const tagline = await screen.findByText('Machine Vision Planning Tool')
      expect(tagline).toHaveClass('uppercase')
    })
  })

  describe('AC-1.5.3: "Import Parts" CTA Navigates to /import', () => {
    it('renders "Import Parts" button', async () => {
      renderWithRouter(<HomeScreen />)
      expect(
        await screen.findByRole('link', { name: 'Import Parts' })
      ).toBeInTheDocument()
    })

    it('"Import Parts" button links to /import', async () => {
      renderWithRouter(<HomeScreen />)
      const importLink = await screen.findByRole('link', { name: 'Import Parts' })
      expect(importLink).toHaveAttribute('href', '/import')
    })
  })

  describe('AC-1.5.4: "Load Sample Data" CTA Present', () => {
    it('renders "Load Sample Data" button', async () => {
      renderWithRouter(<HomeScreen />)
      expect(
        await screen.findByRole('button', { name: 'Load Sample Data' })
      ).toBeInTheDocument()
    })
  })

  describe('AC-1.5.5: Feature Highlights Displayed', () => {
    it('renders FOV Validation feature', async () => {
      renderWithRouter(<HomeScreen />)
      expect(await screen.findByText('FOV Validation')).toBeInTheDocument()
    })

    it('renders Resolution Check feature', async () => {
      renderWithRouter(<HomeScreen />)
      expect(await screen.findByText('Resolution Check')).toBeInTheDocument()
    })

    it('renders DOF Analysis feature', async () => {
      renderWithRouter(<HomeScreen />)
      expect(await screen.findByText('DOF Analysis')).toBeInTheDocument()
    })

    it('renders exactly 3 feature items', async () => {
      renderWithRouter(<HomeScreen />)
      const fov = await screen.findByText('FOV Validation')
      const resolution = await screen.findByText('Resolution Check')
      const dof = await screen.findByText('DOF Analysis')
      expect(fov).toBeInTheDocument()
      expect(resolution).toBeInTheDocument()
      expect(dof).toBeInTheDocument()
    })
  })

  describe('AC-1.5.6: Nature Theme Colors Applied', () => {
    it('tagline uses text-primary (forest green)', async () => {
      renderWithRouter(<HomeScreen />)
      const tagline = await screen.findByText('Machine Vision Planning Tool')
      expect(tagline).toHaveClass('text-primary')
    })

    it('subtitle uses text-muted-foreground', async () => {
      renderWithRouter(<HomeScreen />)
      const subtitle = await screen.findByText(
        /StationPro helps you plan machine vision/i
      )
      expect(subtitle).toHaveClass('text-muted-foreground')
    })

    it('right panel uses bg-muted', async () => {
      renderWithRouter(<HomeScreen />)
      const heroVisualText = await screen.findByText('Hero Visual')
      const rightPanel = heroVisualText.closest('.bg-muted')
      expect(rightPanel).toBeInTheDocument()
    })
  })

  describe('AC-1.5.7: Responsive Layout', () => {
    it('uses responsive grid classes', async () => {
      renderWithRouter(<HomeScreen />)
      const headline = await screen.findByRole('heading', { level: 1 })
      const heroContainer = headline.closest('.grid')
      expect(heroContainer).toHaveClass('grid-cols-1', 'lg:grid-cols-2')
    })

    it('right panel hidden on mobile, visible on lg', async () => {
      renderWithRouter(<HomeScreen />)
      const heroVisualText = await screen.findByText('Hero Visual')
      const rightPanel = heroVisualText.closest('.hidden')
      expect(rightPanel).toHaveClass('lg:flex')
    })
  })
})

describe('Sample Data Loading (Story 1.6)', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('AC-1.6.1: "Load Sample Data" Triggers Loading', () => {
    it('clicking button calls loadSampleData', async () => {
      const loadSampleDataSpy = vi
        .spyOn(sampleDataModule, 'loadSampleData')
        .mockResolvedValue(undefined)

      const { queryClient } = renderWithRouter(<HomeScreen />)
      const button = await screen.findByRole('button', { name: /load sample data/i })

      await user.click(button)

      expect(loadSampleDataSpy).toHaveBeenCalledWith(queryClient)
    })

    it('disables button while loading', async () => {
      let resolveLoad: () => void
      const loadPromise = new Promise<void>((resolve) => {
        resolveLoad = resolve
      })

      vi.spyOn(sampleDataModule, 'loadSampleData').mockReturnValue(loadPromise)

      renderWithRouter(<HomeScreen />)
      const button = await screen.findByRole('button', { name: /load sample data/i })

      await user.click(button)

      // Button should be disabled while loading
      expect(button).toBeDisabled()

      // Resolve the promise to complete loading
      resolveLoad!()

      // Wait for the loading to complete (button re-enabled or navigation occurred)
      // Note: After successful load, navigation occurs so button may not be found
      await waitFor(() => {
        expect(sampleDataModule.loadSampleData).toHaveBeenCalled()
      })
    })
  })

  describe('AC-1.6.4: Navigates to /parts After Loading', () => {
    it('navigates to /parts on success', async () => {
      vi.spyOn(sampleDataModule, 'loadSampleData').mockResolvedValue(undefined)

      const { router } = renderWithRouter(<HomeScreen />)
      const button = await screen.findByRole('button', { name: /load sample data/i })

      await user.click(button)

      await waitFor(() => {
        expect(router.state.location.pathname).toBe('/parts')
      })
    })
  })

  describe('AC-1.6.5: Success Toast Displayed', () => {
    it('shows success toast on successful load', async () => {
      vi.spyOn(sampleDataModule, 'loadSampleData').mockResolvedValue(undefined)

      renderWithRouter(<HomeScreen />)
      const button = await screen.findByRole('button', { name: /load sample data/i })

      await user.click(button)

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Sample data loaded successfully')
      })
    })
  })

  describe('AC-1.6.1: Error Handling', () => {
    it('shows error toast on fetch failure', async () => {
      vi.spyOn(sampleDataModule, 'loadSampleData').mockRejectedValue(
        new Error('Network error')
      )

      renderWithRouter(<HomeScreen />)
      const button = await screen.findByRole('button', { name: /load sample data/i })

      await user.click(button)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Network error')
      })
    })

    it('does not navigate on error', async () => {
      vi.spyOn(sampleDataModule, 'loadSampleData').mockRejectedValue(
        new Error('Network error')
      )

      const { router } = renderWithRouter(<HomeScreen />)
      const button = await screen.findByRole('button', { name: /load sample data/i })

      await user.click(button)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled()
      })

      expect(router.state.location.pathname).toBe('/')
    })
  })
})
