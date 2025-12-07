// src/components/analysis/EnvelopePanel.tsx
// Component for displaying worst-case envelope across working set parts
// AC 3.6.1: Envelope displayed, AC 3.6.2: Driver identification

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useEnvelopeCalculation } from '@/hooks/useEnvelopeCalculation'
import type { EnvelopeDriver, EnvelopeResult } from '@/lib/analysis/envelope'

// =============================================================================
// Formatting Utilities
// =============================================================================

/**
 * Formats a numeric value with 2 decimal places (AC 3.6.1)
 */
function formatValue(value: number): string {
  return value.toFixed(2)
}

// =============================================================================
// Sub-Components
// =============================================================================

interface DimensionDisplayProps {
  label: string
  driver: EnvelopeDriver
}

/**
 * Renders a single dimension with value and driver callout
 * AC 3.6.1: Display Max Width, Max Height, Max Length with values in mm
 * AC 3.6.2: Display driver part callout for each dimension
 */
function DimensionDisplay({ label, driver }: DimensionDisplayProps) {
  return (
    <div className="flex justify-between items-baseline py-2 border-b last:border-b-0">
      <span className="font-medium">{label}</span>
      <div className="text-right">
        <span className="text-lg font-semibold">
          {formatValue(driver.value)} mm
        </span>
        {/* AC 3.6.2: Driver callout styled as secondary text (muted color) */}
        <span className="ml-2 text-sm text-muted-foreground">
          ({driver.partCallout})
        </span>
      </div>
    </div>
  )
}

// =============================================================================
// Standalone Component (for testing)
// =============================================================================

export interface EnvelopePanelStandaloneProps {
  envelope: EnvelopeResult | null
  isLoading: boolean
  isEmpty: boolean
}

/**
 * Standalone component that accepts props directly (for testing without hook)
 */
export function EnvelopePanelStandalone({
  envelope,
  isLoading,
  isEmpty,
}: EnvelopePanelStandaloneProps) {
  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Worst-Case Envelope</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    )
  }

  // Empty state (AC 3.6.1: panel with clear header)
  if (isEmpty || !envelope) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Worst-Case Envelope</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Select parts to view envelope
          </p>
        </CardContent>
      </Card>
    )
  }

  // Envelope display (AC 3.6.1, AC 3.6.2)
  return (
    <Card>
      <CardHeader>
        <CardTitle>Worst-Case Envelope</CardTitle>
      </CardHeader>
      {/* AC 3.6.1: ARIA label for accessibility */}
      <CardContent aria-label="Worst-case envelope dimensions">
        <DimensionDisplay label="Max Width" driver={envelope.drivers.maxWidth} />
        <DimensionDisplay label="Max Height" driver={envelope.drivers.maxHeight} />
        <DimensionDisplay label="Max Length" driver={envelope.drivers.maxLength} />
      </CardContent>
    </Card>
  )
}

// =============================================================================
// Main Component (with hook)
// =============================================================================

/**
 * Main component that uses the useEnvelopeCalculation hook
 * AC 3.6.3: Auto-update on working set change (via hook)
 */
export function EnvelopePanel() {
  const { envelope, isLoading, isEmpty } = useEnvelopeCalculation()

  return (
    <EnvelopePanelStandalone
      envelope={envelope}
      isLoading={isLoading}
      isEmpty={isEmpty}
    />
  )
}
