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
})
