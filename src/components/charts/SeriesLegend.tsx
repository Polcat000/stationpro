// src/components/charts/SeriesLegend.tsx
// Legend component for dimensional distribution charts showing series colors
// AC 3.7.2: Series legend/key visible near charts

import { useMemo } from 'react'

// =============================================================================
// Types
// =============================================================================

export interface SeriesLegendProps {
  /** Series names to display */
  seriesNames: string[]
  /** Whether to show outlier indicator */
  showOutlierIndicator?: boolean
}

// =============================================================================
// Constants
// =============================================================================

/**
 * Series colors using CSS variables from Nature theme.
 * AC 3.7.5: Charts use hsl(var(--chart-N)) for series colors.
 */
const SERIES_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
]

/**
 * Outlier color using destructive theme variable.
 * AC 3.7.5: Outlier highlight uses hsl(var(--destructive)).
 */
const OUTLIER_COLOR = 'var(--destructive)'

// =============================================================================
// Main Component
// =============================================================================

/**
 * Legend component showing series colors and names.
 * Displays color swatches with series names for chart interpretation.
 *
 * Per AC 3.7.2:
 * - Each series has a distinct color from Nature theme
 * - Legend shows all series names with matching colors
 *
 * Per AC 3.7.5:
 * - Uses hsl(var(--chart-N)) for colors
 * - Outlier indicator uses hsl(var(--destructive))
 */
export function SeriesLegend({ seriesNames, showOutlierIndicator = false }: SeriesLegendProps) {
  // Memoize color mapping for consistency with chart
  const seriesColorMap = useMemo(() => {
    const map = new Map<string, string>()
    seriesNames.forEach((name, index) => {
      map.set(name, SERIES_COLORS[index % SERIES_COLORS.length])
    })
    return map
  }, [seriesNames])

  if (seriesNames.length === 0 && !showOutlierIndicator) {
    return null
  }

  return (
    <div
      className="flex flex-wrap gap-4 text-sm"
      role="list"
      aria-label="Chart legend"
    >
      {seriesNames.map((name) => (
        <div
          key={name}
          className="flex items-center gap-2"
          role="listitem"
        >
          <div
            className="w-3 h-3 rounded-sm flex-shrink-0"
            style={{ backgroundColor: seriesColorMap.get(name) }}
            aria-hidden="true"
          />
          <span className="text-muted-foreground truncate max-w-[120px]" title={name}>
            {name}
          </span>
        </div>
      ))}
      {showOutlierIndicator && (
        <div
          className="flex items-center gap-2"
          role="listitem"
        >
          <div
            className="w-3 h-3 rounded-sm flex-shrink-0 border-2"
            style={{
              backgroundColor: OUTLIER_COLOR,
              borderColor: OUTLIER_COLOR,
            }}
            aria-hidden="true"
          />
          <span className="text-muted-foreground">Outlier</span>
        </div>
      )}
    </div>
  )
}
