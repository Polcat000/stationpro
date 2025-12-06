import { describe, it, expect, beforeEach } from 'vitest'
import { useComponentsStore } from '../components'

describe('componentsStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useComponentsStore.setState({
      activeComponentIds: new Set<string>(),
    })
  })

  describe('toggleComponent', () => {
    it('adds a component ID to activeComponentIds Set when not present', () => {
      const { toggleComponent } = useComponentsStore.getState()

      toggleComponent('component-1')

      const { activeComponentIds } = useComponentsStore.getState()
      expect(activeComponentIds.has('component-1')).toBe(true)
      expect(activeComponentIds.size).toBe(1)
    })

    it('removes a component ID from activeComponentIds Set when already present', () => {
      useComponentsStore.setState({
        activeComponentIds: new Set(['component-1']),
      })

      const { toggleComponent } = useComponentsStore.getState()
      toggleComponent('component-1')

      const { activeComponentIds } = useComponentsStore.getState()
      expect(activeComponentIds.has('component-1')).toBe(false)
      expect(activeComponentIds.size).toBe(0)
    })

    it('can toggle multiple different components', () => {
      const { toggleComponent } = useComponentsStore.getState()

      toggleComponent('component-1')
      toggleComponent('component-2')
      toggleComponent('component-3')

      const { activeComponentIds } = useComponentsStore.getState()
      expect(activeComponentIds.size).toBe(3)
      expect(activeComponentIds.has('component-1')).toBe(true)
      expect(activeComponentIds.has('component-2')).toBe(true)
      expect(activeComponentIds.has('component-3')).toBe(true)
    })
  })

  describe('setActiveComponents', () => {
    it('replaces entire Set with provided array of IDs', () => {
      useComponentsStore.setState({
        activeComponentIds: new Set(['old-1', 'old-2']),
      })

      const { setActiveComponents } = useComponentsStore.getState()
      setActiveComponents(['new-1', 'new-2', 'new-3'])

      const { activeComponentIds } = useComponentsStore.getState()
      expect(activeComponentIds.size).toBe(3)
      expect(activeComponentIds.has('old-1')).toBe(false)
      expect(activeComponentIds.has('old-2')).toBe(false)
      expect(activeComponentIds.has('new-1')).toBe(true)
      expect(activeComponentIds.has('new-2')).toBe(true)
      expect(activeComponentIds.has('new-3')).toBe(true)
    })

    it('can set to an empty array', () => {
      useComponentsStore.setState({
        activeComponentIds: new Set(['component-1']),
      })

      const { setActiveComponents } = useComponentsStore.getState()
      setActiveComponents([])

      const { activeComponentIds } = useComponentsStore.getState()
      expect(activeComponentIds.size).toBe(0)
    })
  })

  describe('clearActiveComponents', () => {
    it('empties the activeComponentIds Set', () => {
      useComponentsStore.setState({
        activeComponentIds: new Set(['component-1', 'component-2', 'component-3']),
      })

      const { clearActiveComponents } = useComponentsStore.getState()
      clearActiveComponents()

      const { activeComponentIds } = useComponentsStore.getState()
      expect(activeComponentIds.size).toBe(0)
    })
  })

  describe('toggleByManufacturer', () => {
    it('adds all components when none are active', () => {
      const { toggleByManufacturer } = useComponentsStore.getState()

      toggleByManufacturer('LMI Technologies', ['c1', 'c2', 'c3'])

      const { activeComponentIds } = useComponentsStore.getState()
      expect(activeComponentIds.has('c1')).toBe(true)
      expect(activeComponentIds.has('c2')).toBe(true)
      expect(activeComponentIds.has('c3')).toBe(true)
      expect(activeComponentIds.size).toBe(3)
    })

    it('removes all components when all are active', () => {
      useComponentsStore.setState({
        activeComponentIds: new Set(['c1', 'c2', 'c3']),
      })

      const { toggleByManufacturer } = useComponentsStore.getState()
      toggleByManufacturer('LMI Technologies', ['c1', 'c2', 'c3'])

      const { activeComponentIds } = useComponentsStore.getState()
      expect(activeComponentIds.size).toBe(0)
    })

    it('adds all components when some are active (OR logic)', () => {
      useComponentsStore.setState({
        activeComponentIds: new Set(['c1']),
      })

      const { toggleByManufacturer } = useComponentsStore.getState()
      toggleByManufacturer('LMI Technologies', ['c1', 'c2', 'c3'])

      const { activeComponentIds } = useComponentsStore.getState()
      expect(activeComponentIds.has('c1')).toBe(true)
      expect(activeComponentIds.has('c2')).toBe(true)
      expect(activeComponentIds.has('c3')).toBe(true)
      expect(activeComponentIds.size).toBe(3)
    })

    it('preserves components from other manufacturers', () => {
      useComponentsStore.setState({
        activeComponentIds: new Set(['other-1', 'other-2']),
      })

      const { toggleByManufacturer } = useComponentsStore.getState()
      toggleByManufacturer('LMI Technologies', ['c1', 'c2'])

      const { activeComponentIds } = useComponentsStore.getState()
      expect(activeComponentIds.has('other-1')).toBe(true)
      expect(activeComponentIds.has('other-2')).toBe(true)
      expect(activeComponentIds.has('c1')).toBe(true)
      expect(activeComponentIds.has('c2')).toBe(true)
      expect(activeComponentIds.size).toBe(4)
    })
  })

  describe('activateByType', () => {
    it('adds components without removing others (additive)', () => {
      useComponentsStore.setState({
        activeComponentIds: new Set(['existing-1']),
      })

      const { activateByType } = useComponentsStore.getState()
      activateByType('LaserLineProfiler', ['llp-1', 'llp-2'])

      const { activeComponentIds } = useComponentsStore.getState()
      expect(activeComponentIds.has('existing-1')).toBe(true)
      expect(activeComponentIds.has('llp-1')).toBe(true)
      expect(activeComponentIds.has('llp-2')).toBe(true)
      expect(activeComponentIds.size).toBe(3)
    })

    it('does not duplicate already active components', () => {
      useComponentsStore.setState({
        activeComponentIds: new Set(['llp-1']),
      })

      const { activateByType } = useComponentsStore.getState()
      activateByType('LaserLineProfiler', ['llp-1', 'llp-2'])

      const { activeComponentIds } = useComponentsStore.getState()
      expect(activeComponentIds.size).toBe(2)
    })
  })

  describe('deactivateByType', () => {
    it('removes all components of specified type', () => {
      useComponentsStore.setState({
        activeComponentIds: new Set(['llp-1', 'llp-2', 'other-1']),
      })

      const { deactivateByType } = useComponentsStore.getState()
      deactivateByType('LaserLineProfiler', ['llp-1', 'llp-2'])

      const { activeComponentIds } = useComponentsStore.getState()
      expect(activeComponentIds.has('llp-1')).toBe(false)
      expect(activeComponentIds.has('llp-2')).toBe(false)
      expect(activeComponentIds.has('other-1')).toBe(true)
      expect(activeComponentIds.size).toBe(1)
    })

    it('does nothing for components not in active set', () => {
      useComponentsStore.setState({
        activeComponentIds: new Set(['other-1']),
      })

      const { deactivateByType } = useComponentsStore.getState()
      deactivateByType('LaserLineProfiler', ['llp-1', 'llp-2'])

      const { activeComponentIds } = useComponentsStore.getState()
      expect(activeComponentIds.has('other-1')).toBe(true)
      expect(activeComponentIds.size).toBe(1)
    })
  })

  describe('addAllFiltered', () => {
    it('adds all provided IDs to active set (additive)', () => {
      useComponentsStore.setState({
        activeComponentIds: new Set(['existing-1']),
      })

      const { addAllFiltered } = useComponentsStore.getState()
      addAllFiltered(['filtered-1', 'filtered-2'])

      const { activeComponentIds } = useComponentsStore.getState()
      expect(activeComponentIds.has('existing-1')).toBe(true)
      expect(activeComponentIds.has('filtered-1')).toBe(true)
      expect(activeComponentIds.has('filtered-2')).toBe(true)
      expect(activeComponentIds.size).toBe(3)
    })
  })

  describe('cleanupStaleComponentIds', () => {
    it('removes IDs not in valid set', () => {
      useComponentsStore.setState({
        activeComponentIds: new Set(['valid-1', 'stale-1', 'valid-2', 'stale-2']),
      })

      const { cleanupStaleComponentIds } = useComponentsStore.getState()
      cleanupStaleComponentIds(['valid-1', 'valid-2', 'valid-3'])

      const { activeComponentIds } = useComponentsStore.getState()
      expect(activeComponentIds.has('valid-1')).toBe(true)
      expect(activeComponentIds.has('valid-2')).toBe(true)
      expect(activeComponentIds.has('stale-1')).toBe(false)
      expect(activeComponentIds.has('stale-2')).toBe(false)
      expect(activeComponentIds.size).toBe(2)
    })

    it('keeps all IDs when all are valid', () => {
      useComponentsStore.setState({
        activeComponentIds: new Set(['c1', 'c2']),
      })

      const { cleanupStaleComponentIds } = useComponentsStore.getState()
      cleanupStaleComponentIds(['c1', 'c2', 'c3'])

      const { activeComponentIds } = useComponentsStore.getState()
      expect(activeComponentIds.size).toBe(2)
    })

    it('empties set when no IDs are valid', () => {
      useComponentsStore.setState({
        activeComponentIds: new Set(['stale-1', 'stale-2']),
      })

      const { cleanupStaleComponentIds } = useComponentsStore.getState()
      cleanupStaleComponentIds(['valid-1', 'valid-2'])

      const { activeComponentIds } = useComponentsStore.getState()
      expect(activeComponentIds.size).toBe(0)
    })
  })
})
