import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface WorkingSetState {
  partIds: Set<string>
  stationIds: Set<string>
  togglePart: (id: string) => void
  toggleStation: (id: string) => void
  clearParts: () => void
  clearStations: () => void
  clearAll: () => void
}

// Custom storage that handles Set<string> serialization
const setStorage = createJSONStorage<WorkingSetState>(() => localStorage, {
  reviver: (_key, value) => {
    // The persist middleware wraps state in { state: {...}, version: n }
    // We handle arrays that should be Sets in the partialify merge
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

export const useWorkingSetStore = create<WorkingSetState>()(
  persist(
    (set) => ({
      partIds: new Set<string>(),
      stationIds: new Set<string>(),

      togglePart: (id: string) =>
        set((state) => {
          const newPartIds = new Set(state.partIds)
          if (newPartIds.has(id)) {
            newPartIds.delete(id)
          } else {
            newPartIds.add(id)
          }
          return { partIds: newPartIds }
        }),

      toggleStation: (id: string) =>
        set((state) => {
          const newStationIds = new Set(state.stationIds)
          if (newStationIds.has(id)) {
            newStationIds.delete(id)
          } else {
            newStationIds.add(id)
          }
          return { stationIds: newStationIds }
        }),

      clearParts: () => set({ partIds: new Set<string>() }),

      clearStations: () => set({ stationIds: new Set<string>() }),

      clearAll: () =>
        set({
          partIds: new Set<string>(),
          stationIds: new Set<string>(),
        }),
    }),
    {
      name: 'stationpro-working-set',
      storage: setStorage,
      // Merge function to convert arrays back to Sets on hydration
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<WorkingSetState> | undefined
        return {
          ...currentState,
          partIds: new Set(
            Array.isArray(persisted?.partIds) ? persisted.partIds : []
          ),
          stationIds: new Set(
            Array.isArray(persisted?.stationIds) ? persisted.stationIds : []
          ),
        }
      },
    }
  )
)
