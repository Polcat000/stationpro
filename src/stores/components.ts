import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface ComponentsState {
  activeComponentIds: Set<string>
  toggleComponent: (id: string) => void
  setActiveComponents: (ids: string[]) => void
  clearActiveComponents: () => void
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
