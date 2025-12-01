import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity, // Static data for MVP
      gcTime: 1000 * 60 * 60, // 1 hour garbage collection
    },
  },
})
