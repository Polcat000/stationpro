import { queryOptions } from '@tanstack/react-query'
import type { Part } from '@/types/domain'

export type { Part }

export const partsQueryOptions = queryOptions({
  queryKey: ['parts'],
  queryFn: async () => [] as Part[],
  staleTime: Infinity,
})
