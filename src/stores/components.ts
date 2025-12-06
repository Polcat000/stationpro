import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface ComponentsState {
  activeComponentIds: Set<string>
  toggleComponent: (id: string) => void
  toggleByManufacturer: (manufacturer: string, componentIds: string[]) => void
  activateByType: (type: string, componentIds: string[]) => void
  deactivateByType: (type: string, componentIds: string[]) => void
  addAllFiltered: (componentIds: string[]) => void
  setActiveComponents: (ids: string[]) => void
  clearActiveComponents: () => void
  cleanupStaleComponentIds: (validIds: string[]) => void
}

// Custom storage that handles Set<string> serialization
const setStorage = createJSONStorage<ComponentsState>(() => localStorage, {
  reviver: (_key, value) => {
    return value
  },
  replacer: (_key, value) => {
    // Convert Sets to arrays for serialization
    if (value instanceof Set) {
      return Array.from(value)
    }
    return value
  },
})

export const useComponentsStore = create<ComponentsState>()(
  persist(
    (set) => ({
      activeComponentIds: new Set<string>(),

      toggleComponent: (id: string) =>
        set((state) => {
          const newActiveComponentIds = new Set(state.activeComponentIds)
          if (newActiveComponentIds.has(id)) {
            newActiveComponentIds.delete(id)
          } else {
            newActiveComponentIds.add(id)
          }
          return { activeComponentIds: newActiveComponentIds }
        }),

      setActiveComponents: (ids: string[]) =>
        set({ activeComponentIds: new Set(ids) }),

      clearActiveComponents: () =>
        set({ activeComponentIds: new Set<string>() }),

      // Bulk toggle by manufacturer - OR logic (any not active → add all, all active → remove all)
      toggleByManufacturer: (_manufacturer: string, componentIds: string[]) =>
        set((state) => {
          const allActive = componentIds.every((id) => state.activeComponentIds.has(id))
          const next = new Set(state.activeComponentIds)

          if (allActive) {
            // All active → remove all
            componentIds.forEach((id) => next.delete(id))
          } else {
            // Some or none active → add all
            componentIds.forEach((id) => next.add(id))
          }

          return { activeComponentIds: next }
        }),

      // Activate all components of a type (additive - doesn't remove others)
      activateByType: (_type: string, componentIds: string[]) =>
        set((state) => {
          const next = new Set(state.activeComponentIds)
          componentIds.forEach((id) => next.add(id))
          return { activeComponentIds: next }
        }),

      // Deactivate all components of a type
      deactivateByType: (_type: string, componentIds: string[]) =>
        set((state) => {
          const next = new Set(state.activeComponentIds)
          componentIds.forEach((id) => next.delete(id))
          return { activeComponentIds: next }
        }),

      // Add all filtered components (additive)
      addAllFiltered: (componentIds: string[]) =>
        set((state) => {
          const next = new Set(state.activeComponentIds)
          componentIds.forEach((id) => next.add(id))
          return { activeComponentIds: next }
        }),

      // Cleanup stale component IDs (removes IDs not in validIds)
      cleanupStaleComponentIds: (validIds: string[]) =>
        set((state) => {
          const validSet = new Set(validIds)
          const next = new Set<string>()
          state.activeComponentIds.forEach((id) => {
            if (validSet.has(id)) {
              next.add(id)
            }
          })
          return { activeComponentIds: next }
        }),
    }),
    {
      name: 'stationpro-active-components',
      storage: setStorage,
      // Merge function to convert arrays back to Sets on hydration
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<ComponentsState> | undefined
        return {
          ...currentState,
          activeComponentIds: new Set(
            Array.isArray(persisted?.activeComponentIds)
              ? persisted.activeComponentIds
              : []
          ),
        }
      },
    }
  )
)
