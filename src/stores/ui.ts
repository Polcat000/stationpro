import { create } from 'zustand'

export interface UIState {
  activeZoneId: string | null
  sidePanelOpen: boolean
  activeTab: string
  setActiveZone: (id: string | null) => void
  toggleSidePanel: () => void
  setActiveTab: (tab: string) => void
}

export const useUIStore = create<UIState>()((set) => ({
  activeZoneId: null,
  sidePanelOpen: false,
  activeTab: 'parts',

  setActiveZone: (id: string | null) => set({ activeZoneId: id }),

  toggleSidePanel: () =>
    set((state) => ({ sidePanelOpen: !state.sidePanelOpen })),

  setActiveTab: (tab: string) => set({ activeTab: tab }),
}))
