import { describe, it, expect, beforeEach } from 'vitest'
import { useWorkingSetStore } from '../workingSet'

describe('workingSetStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useWorkingSetStore.setState({
      partIds: new Set<string>(),
      stationIds: new Set<string>(),
    })
  })

  describe('togglePart', () => {
    it('adds a part ID to partIds Set when not present', () => {
      const { togglePart } = useWorkingSetStore.getState()

      togglePart('part-1')

      const { partIds } = useWorkingSetStore.getState()
      expect(partIds.has('part-1')).toBe(true)
      expect(partIds.size).toBe(1)
    })

    it('removes a part ID from partIds Set when already present', () => {
      // Setup: add a part first
      useWorkingSetStore.setState({
        partIds: new Set(['part-1']),
        stationIds: new Set<string>(),
      })

      const { togglePart } = useWorkingSetStore.getState()
      togglePart('part-1')

      const { partIds } = useWorkingSetStore.getState()
      expect(partIds.has('part-1')).toBe(false)
      expect(partIds.size).toBe(0)
    })

    it('can toggle multiple different parts', () => {
      const { togglePart } = useWorkingSetStore.getState()

      togglePart('part-1')
      togglePart('part-2')
      togglePart('part-3')

      const { partIds } = useWorkingSetStore.getState()
      expect(partIds.size).toBe(3)
      expect(partIds.has('part-1')).toBe(true)
      expect(partIds.has('part-2')).toBe(true)
      expect(partIds.has('part-3')).toBe(true)
    })
  })

  describe('toggleStation', () => {
    it('adds a station ID to stationIds Set when not present', () => {
      const { toggleStation } = useWorkingSetStore.getState()

      toggleStation('station-1')

      const { stationIds } = useWorkingSetStore.getState()
      expect(stationIds.has('station-1')).toBe(true)
      expect(stationIds.size).toBe(1)
    })

    it('removes a station ID from stationIds Set when already present', () => {
      useWorkingSetStore.setState({
        partIds: new Set<string>(),
        stationIds: new Set(['station-1']),
      })

      const { toggleStation } = useWorkingSetStore.getState()
      toggleStation('station-1')

      const { stationIds } = useWorkingSetStore.getState()
      expect(stationIds.has('station-1')).toBe(false)
      expect(stationIds.size).toBe(0)
    })
  })

  describe('clearParts', () => {
    it('empties the partIds Set', () => {
      useWorkingSetStore.setState({
        partIds: new Set(['part-1', 'part-2', 'part-3']),
        stationIds: new Set(['station-1']),
      })

      const { clearParts } = useWorkingSetStore.getState()
      clearParts()

      const { partIds, stationIds } = useWorkingSetStore.getState()
      expect(partIds.size).toBe(0)
      // stationIds should remain unchanged
      expect(stationIds.size).toBe(1)
    })
  })

  describe('clearStations', () => {
    it('empties the stationIds Set', () => {
      useWorkingSetStore.setState({
        partIds: new Set(['part-1']),
        stationIds: new Set(['station-1', 'station-2']),
      })

      const { clearStations } = useWorkingSetStore.getState()
      clearStations()

      const { partIds, stationIds } = useWorkingSetStore.getState()
      expect(stationIds.size).toBe(0)
      // partIds should remain unchanged
      expect(partIds.size).toBe(1)
    })
  })

  describe('clearAll', () => {
    it('empties both partIds and stationIds Sets', () => {
      useWorkingSetStore.setState({
        partIds: new Set(['part-1', 'part-2']),
        stationIds: new Set(['station-1', 'station-2']),
      })

      const { clearAll } = useWorkingSetStore.getState()
      clearAll()

      const { partIds, stationIds } = useWorkingSetStore.getState()
      expect(partIds.size).toBe(0)
      expect(stationIds.size).toBe(0)
    })
  })

  describe('toggleSeries', () => {
    it('adds all parts when none are in working set', () => {
      const { toggleSeries } = useWorkingSetStore.getState()

      toggleSeries('USB-C', ['p1', 'p2', 'p3'])

      const { partIds } = useWorkingSetStore.getState()
      expect(partIds.size).toBe(3)
      expect(partIds.has('p1')).toBe(true)
      expect(partIds.has('p2')).toBe(true)
      expect(partIds.has('p3')).toBe(true)
    })

    it('removes all parts when all are in working set', () => {
      useWorkingSetStore.setState({
        partIds: new Set(['p1', 'p2', 'p3']),
        stationIds: new Set<string>(),
      })

      const { toggleSeries } = useWorkingSetStore.getState()
      toggleSeries('USB-C', ['p1', 'p2', 'p3'])

      const { partIds } = useWorkingSetStore.getState()
      expect(partIds.size).toBe(0)
    })

    it('adds all parts when some are in working set (OR logic)', () => {
      useWorkingSetStore.setState({
        partIds: new Set(['p1']),
        stationIds: new Set<string>(),
      })

      const { toggleSeries } = useWorkingSetStore.getState()
      toggleSeries('USB-C', ['p1', 'p2', 'p3'])

      const { partIds } = useWorkingSetStore.getState()
      expect(partIds.size).toBe(3)
      expect(partIds.has('p1')).toBe(true)
      expect(partIds.has('p2')).toBe(true)
      expect(partIds.has('p3')).toBe(true)
    })

    it('does not affect parts outside the series', () => {
      useWorkingSetStore.setState({
        partIds: new Set(['other-part']),
        stationIds: new Set<string>(),
      })

      const { toggleSeries } = useWorkingSetStore.getState()
      toggleSeries('USB-C', ['p1', 'p2'])

      const { partIds } = useWorkingSetStore.getState()
      expect(partIds.size).toBe(3)
      expect(partIds.has('other-part')).toBe(true)
    })
  })

  describe('addAllFiltered', () => {
    it('adds all provided part IDs to working set', () => {
      const { addAllFiltered } = useWorkingSetStore.getState()

      addAllFiltered(['p1', 'p2', 'p3'])

      const { partIds } = useWorkingSetStore.getState()
      expect(partIds.size).toBe(3)
      expect(partIds.has('p1')).toBe(true)
      expect(partIds.has('p2')).toBe(true)
      expect(partIds.has('p3')).toBe(true)
    })

    it('is idempotent - does not duplicate existing IDs', () => {
      useWorkingSetStore.setState({
        partIds: new Set(['p1', 'p2']),
        stationIds: new Set<string>(),
      })

      const { addAllFiltered } = useWorkingSetStore.getState()
      addAllFiltered(['p2', 'p3', 'p4'])

      const { partIds } = useWorkingSetStore.getState()
      expect(partIds.size).toBe(4)
      expect(partIds.has('p1')).toBe(true)
      expect(partIds.has('p2')).toBe(true)
      expect(partIds.has('p3')).toBe(true)
      expect(partIds.has('p4')).toBe(true)
    })

    it('handles empty array', () => {
      useWorkingSetStore.setState({
        partIds: new Set(['p1']),
        stationIds: new Set<string>(),
      })

      const { addAllFiltered } = useWorkingSetStore.getState()
      addAllFiltered([])

      const { partIds } = useWorkingSetStore.getState()
      expect(partIds.size).toBe(1)
    })
  })

  describe('cleanupStalePartIds', () => {
    it('removes part IDs not in valid list', () => {
      useWorkingSetStore.setState({
        partIds: new Set(['p1', 'p2', 'stale-1', 'stale-2']),
        stationIds: new Set<string>(),
      })

      const { cleanupStalePartIds } = useWorkingSetStore.getState()
      cleanupStalePartIds(['p1', 'p2', 'p3'])

      const { partIds } = useWorkingSetStore.getState()
      expect(partIds.size).toBe(2)
      expect(partIds.has('p1')).toBe(true)
      expect(partIds.has('p2')).toBe(true)
      expect(partIds.has('stale-1')).toBe(false)
      expect(partIds.has('stale-2')).toBe(false)
    })

    it('keeps all parts when all are valid', () => {
      useWorkingSetStore.setState({
        partIds: new Set(['p1', 'p2']),
        stationIds: new Set<string>(),
      })

      const { cleanupStalePartIds } = useWorkingSetStore.getState()
      cleanupStalePartIds(['p1', 'p2', 'p3'])

      const { partIds } = useWorkingSetStore.getState()
      expect(partIds.size).toBe(2)
    })

    it('empties working set when no valid IDs match', () => {
      useWorkingSetStore.setState({
        partIds: new Set(['old-1', 'old-2']),
        stationIds: new Set<string>(),
      })

      const { cleanupStalePartIds } = useWorkingSetStore.getState()
      cleanupStalePartIds(['new-1', 'new-2'])

      const { partIds } = useWorkingSetStore.getState()
      expect(partIds.size).toBe(0)
    })

    it('does not affect stationIds', () => {
      useWorkingSetStore.setState({
        partIds: new Set(['p1', 'stale']),
        stationIds: new Set(['s1', 's2']),
      })

      const { cleanupStalePartIds } = useWorkingSetStore.getState()
      cleanupStalePartIds(['p1'])

      const { stationIds } = useWorkingSetStore.getState()
      expect(stationIds.size).toBe(2)
    })
  })
})
