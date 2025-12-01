import { queryOptions } from '@tanstack/react-query'
import type { Component } from '@/types/domain'

export type { Component }

export const componentsQueryOptions = queryOptions({
  queryKey: ['components'],
  queryFn: async () => [] as Component[],
  staleTime: Infinity,
})
