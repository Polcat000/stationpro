import { queryOptions } from '@tanstack/react-query'
import type { Part } from '@/types/domain'
import { partsRepository } from '@/lib/repositories/partsRepository'

export type { Part }

export const partsQueryOptions = queryOptions({
  queryKey: ['parts'],
  queryFn: () => partsRepository.getAll(),
  staleTime: Infinity,
})
