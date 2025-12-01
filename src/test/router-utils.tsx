// src/test/router-utils.tsx
// PURPOSE: TanStack Router test utilities for rendering components with router context
// SOURCE: Architecture Decision - TanStack Router Testing Infrastructure
// USAGE: import { renderWithRouter } from '@/test/router-utils'

import { render, type RenderOptions, type RenderResult } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
  type AnyRouter,
  type RouterHistory,
} from '@tanstack/react-router'
import type { ReactElement } from 'react'

// Store the component to render - used by the test route
let componentToRender: ReactElement | null = null

/**
 * Options for configuring the test router
 */
export interface RouterTestOptions {
  /**
   * Initial URL path for the router (default: '/')
   * This affects useRouterState().location.pathname
   */
  initialPath?: string

  /**
   * Initial search params as a query string or object
   * @example '?id=123' or { id: '123' }
   */
  initialSearch?: string | Record<string, string>

  /**
   * Additional route paths to register (for Link validation)
   * By default, common app routes are pre-registered
   */
  additionalRoutes?: string[]
}

/**
 * Options for renderWithRouter, extending Testing Library's RenderOptions
 */
export interface RenderWithRouterOptions extends Omit<RenderOptions, 'wrapper'> {
  /**
   * Router configuration options
   */
  router?: RouterTestOptions
}

/**
 * Return type for renderWithRouter, extending Testing Library's RenderResult
 */
export interface RenderWithRouterResult extends RenderResult {
  /**
   * The router instance - use for programmatic navigation in tests
   * @example await act(() => result.router.navigate({ to: '/parts' }))
   */
  router: AnyRouter

  /**
   * The QueryClient instance - use for cache manipulation in tests
   */
  queryClient: QueryClient

  /**
   * The history instance - use for history state assertions
   */
  history: RouterHistory
}

/**
 * Common app routes - pre-registered so Link components don't warn about invalid paths
 */
const DEFAULT_ROUTES = [
  '/',
  '/import',
  '/parts',
  '/stations',
  '/analysis',
  '/visualizer',
  '/export',
]

/**
 * Builds the initial URL from path and search params
 */
function buildInitialUrl(options: RouterTestOptions): string {
  const { initialPath = '/', initialSearch } = options

  if (!initialSearch) {
    return initialPath
  }

  const searchString =
    typeof initialSearch === 'string'
      ? initialSearch.startsWith('?')
        ? initialSearch
        : `?${initialSearch}`
      : `?${new URLSearchParams(initialSearch).toString()}`

  return `${initialPath}${searchString}`
}

/**
 * Creates a test router that renders the component at the specified path.
 *
 * The approach:
 * 1. Create a root route with Outlet
 * 2. Create a route for each path that renders the test component
 * 3. Create placeholder routes for other paths (for Link validation)
 * 4. Use memory history starting at initialPath
 */
function createTestRouter(ui: ReactElement, options: RouterTestOptions = {}) {
  const { initialPath = '/', additionalRoutes = [] } = options
  const initialUrl = buildInitialUrl(options)

  // Store component for rendering
  componentToRender = ui

  // Root route with Outlet for child routes
  const rootRoute = createRootRoute({
    component: Outlet,
  })

  // Collect all route paths
  const allPaths = new Set([...DEFAULT_ROUTES, ...additionalRoutes])

  // Create routes for each path
  const childRoutes = Array.from(allPaths).map((path) => {
    // The route matching initialPath renders our test component
    // Other routes render placeholders (for Link destination validation)
    const isTestRoute = path === initialPath

    return createRoute({
      getParentRoute: () => rootRoute,
      path,
      component: isTestRoute
        ? () => componentToRender
        : () => <div data-testid={`placeholder-${path}`}>Route: {path}</div>,
    })
  })

  const routeTree = rootRoute.addChildren(childRoutes)

  const history = createMemoryHistory({
    initialEntries: [initialUrl],
  })

  const router = createRouter({
    routeTree,
    history,
    defaultPendingMinMs: 0, // Critical: prevents 500ms+ delay per navigation in tests
    defaultPreloadStaleTime: 0,
  })

  return { router, history }
}

/**
 * Creates a fresh QueryClient configured for testing.
 *
 * - Disables retries to make tests deterministic
 * - Disables garbage collection during tests
 * - Each test gets an isolated client to prevent state leakage
 */
function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
        staleTime: Infinity,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

/**
 * Renders a component within TanStack Router and React Query context.
 *
 * Use this for testing any component that:
 * - Uses TanStack Router's Link component
 * - Uses router hooks (useRouterState, useNavigate, useMatch, etc.)
 * - Is a route component exported from src/routes/*.tsx
 *
 * @example
 * // Basic usage - renders at root path '/'
 * import { HomeScreen } from '@/routes/index'
 *
 * it('renders home screen', () => {
 *   renderWithRouter(<HomeScreen />)
 *   expect(screen.getByRole('heading')).toHaveTextContent('See Your System')
 * })
 *
 * @example
 * // Testing component at specific path (affects useRouterState)
 * import { TopNav } from '@/components/layout/TopNav'
 *
 * it('highlights active nav item', () => {
 *   renderWithRouter(<TopNav />, {
 *     router: { initialPath: '/parts' }
 *   })
 *   expect(screen.getByText('Parts').closest('a')).toHaveClass('bg-primary')
 * })
 *
 * @example
 * // Testing with search params
 * it('displays part from search params', () => {
 *   renderWithRouter(<PartDetails />, {
 *     router: {
 *       initialPath: '/parts',
 *       initialSearch: { tab: 'specs' }
 *     }
 *   })
 * })
 *
 * @example
 * // Programmatic navigation in tests
 * import { act } from 'react'
 *
 * it('navigates to import page', async () => {
 *   const { router } = renderWithRouter(<TopNav />)
 *
 *   await act(() => router.navigate({ to: '/import' }))
 *
 *   expect(router.state.location.pathname).toBe('/import')
 * })
 */
export function renderWithRouter(
  ui: ReactElement,
  options: RenderWithRouterOptions = {}
): RenderWithRouterResult {
  const { router: routerOptions = {}, ...renderOptions } = options

  const { router, history } = createTestRouter(ui, routerOptions)
  const queryClient = createTestQueryClient()

  /**
   * Full test wrapper with QueryClient and Router
   */
  function TestApp() {
    return (
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    )
  }

  const renderResult = render(<TestApp />, renderOptions)

  return {
    ...renderResult,
    router,
    queryClient,
    history,
  }
}

/**
 * Re-export common testing utilities for convenience.
 * Tests can import everything from '@/test/router-utils'
 */
export { screen, waitFor, within, fireEvent } from '@testing-library/react'
export { act } from 'react'
