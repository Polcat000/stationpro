import { describe, it, expect } from 'vitest'
import { renderWithRouter, screen } from '@/test/router-utils'
import { TopNav } from '../TopNav'

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
})
