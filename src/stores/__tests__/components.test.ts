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
})
