// src/hooks/usePanelPersistence.ts
// Hook for persisting panel collapse state to localStorage
// AC-3.10.3: State Persistence, AC-3.10.4: Restore on Load

import { useState, useEffect, useCallback, useRef } from 'react'

const STORAGE_KEY = 'stationpro-analysis-panels'
const DEBOUNCE_MS = 100

type PanelStates = Record<string, boolean>

/**
 * Reads all panel states from localStorage
 * Returns empty object if localStorage is unavailable or contains invalid JSON
 */
function readPanelStates(): PanelStates {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return {}
    const parsed = JSON.parse(stored)
    // Validate that it's an object with boolean values
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return {}
    }
    // Filter to only include boolean values
    const result: PanelStates = {}
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === 'boolean') {
        result[key] = value
      }
    }
    return result
  } catch {
    // Invalid JSON or localStorage error - return empty object
    return {}
  }
}

/**
 * Writes all panel states to localStorage
 * Silently fails if localStorage is unavailable or quota exceeded
 */
function writePanelStates(states: PanelStates): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(states))
  } catch {
    // localStorage unavailable or quota exceeded - fail silently
  }
}

/**
 * Hook for managing panel collapse state with localStorage persistence
 *
 * @param panelId - Unique identifier for the panel (e.g., 'stats', 'envelope')
 * @param defaultExpanded - Default expanded state if not persisted (default: true)
 * @returns Object with isExpanded state and setExpanded/toggleExpanded functions
 *
 * @example
 * function MyPanel() {
 *   const { isExpanded, toggleExpanded } = usePanelPersistence('stats')
 *   return (
 *     <Collapsible open={isExpanded} onOpenChange={toggleExpanded}>
 *       ...
 *     </Collapsible>
 *   )
 * }
 */
export function usePanelPersistence(
  panelId: string,
  defaultExpanded: boolean = true
): {
  isExpanded: boolean
  setExpanded: (expanded: boolean) => void
  toggleExpanded: () => void
} {
  // Initialize state from localStorage or default
  const [isExpanded, setIsExpandedState] = useState<boolean>(() => {
    const states = readPanelStates()
    return panelId in states ? states[panelId] : defaultExpanded
  })

  // Ref for debounce timeout
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  // Debounced write to localStorage
  const debouncedWrite = useCallback((newValue: boolean) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(() => {
      const states = readPanelStates()
      states[panelId] = newValue
      writePanelStates(states)
    }, DEBOUNCE_MS)
  }, [panelId])

  // Set expanded state and persist
  const setExpanded = useCallback((expanded: boolean) => {
    setIsExpandedState(expanded)
    debouncedWrite(expanded)
  }, [debouncedWrite])

  // Toggle expanded state
  const toggleExpanded = useCallback(() => {
    setIsExpandedState((prev) => {
      const newValue = !prev
      debouncedWrite(newValue)
      return newValue
    })
  }, [debouncedWrite])

  return {
    isExpanded,
    setExpanded,
    toggleExpanded,
  }
}
