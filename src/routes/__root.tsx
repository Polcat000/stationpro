import { createRootRoute, Outlet } from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { RouteErrorBoundary } from '@/components/error/RouteErrorBoundary'
import { TopNav } from '@/components/layout/TopNav'
import { Toaster } from '@/components/ui/sonner'
import { queryClient } from '@/lib/queryClient'

export const Route = createRootRoute({
  component: RootLayout,
  errorComponent: RouteErrorBoundary,
})

function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <TopNav />
      <main className="container mx-auto h-[calc(100vh-4rem)] overflow-hidden py-6">
        <Outlet />
      </main>
      <Toaster position="bottom-right" />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
