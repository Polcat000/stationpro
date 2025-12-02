import { queryOptions } from '@tanstack/react-query'
import { componentsRepository } from '@/lib/repositories/componentsRepository'
import type { Component } from '@/lib/schemas/component'

export type { Component }

export const componentsQueryOptions = queryOptions({
  queryKey: ['components'],
  queryFn: () => componentsRepository.getAll(),
  staleTime: Infinity,
})
