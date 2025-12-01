import { describe, it, expect, beforeEach } from 'vitest'
import { useUIStore } from '../ui'

describe('uiStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useUIStore.setState({
      activeZoneId: null,
      sidePanelOpen: false,
      activeTab: 'parts',
    })
  })

  describe('setActiveZone', () => {
    it('updates activeZoneId to provided value', () => {
      const { setActiveZone } = useUIStore.getState()

      setActiveZone('zone-1')

      const { activeZoneId } = useUIStore.getState()
      expect(activeZoneId).toBe('zone-1')
    })

    it('can set activeZoneId to null', () => {
      useUIStore.setState({ activeZoneId: 'zone-1' })

      const { setActiveZone } = useUIStore.getState()
      setActiveZone(null)

      const { activeZoneId } = useUIStore.getState()
      expect(activeZoneId).toBeNull()
    })

    it('can change from one zone to another', () => {
      useUIStore.setState({ activeZoneId: 'zone-1' })

      const { setActiveZone } = useUIStore.getState()
      setActiveZone('zone-2')

      const { activeZoneId } = useUIStore.getState()
      expect(activeZoneId).toBe('zone-2')
    })
  })

  describe('toggleSidePanel', () => {
    it('flips sidePanelOpen from false to true', () => {
      const { toggleSidePanel } = useUIStore.getState()

      toggleSidePanel()

      const { sidePanelOpen } = useUIStore.getState()
      expect(sidePanelOpen).toBe(true)
    })

    it('flips sidePanelOpen from true to false', () => {
      useUIStore.setState({ sidePanelOpen: true })

      const { toggleSidePanel } = useUIStore.getState()
      toggleSidePanel()

      const { sidePanelOpen } = useUIStore.getState()
      expect(sidePanelOpen).toBe(false)
    })

    it('can toggle multiple times', () => {
      const { toggleSidePanel } = useUIStore.getState()

      toggleSidePanel() // false -> true
      expect(useUIStore.getState().sidePanelOpen).toBe(true)

      toggleSidePanel() // true -> false
      expect(useUIStore.getState().sidePanelOpen).toBe(false)

      toggleSidePanel() // false -> true
      expect(useUIStore.getState().sidePanelOpen).toBe(true)
    })
  })

  describe('setActiveTab', () => {
    it('updates activeTab to provided value', () => {
      const { setActiveTab } = useUIStore.getState()

      setActiveTab('stations')

      const { activeTab } = useUIStore.getState()
      expect(activeTab).toBe('stations')
    })

    it('can change from one tab to another', () => {
      useUIStore.setState({ activeTab: 'parts' })

      const { setActiveTab } = useUIStore.getState()
      setActiveTab('analysis')

      const { activeTab } = useUIStore.getState()
      expect(activeTab).toBe('analysis')
    })
  })
})
