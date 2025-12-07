// src/components/analysis/BiasAlertBadge.tsx
// Component for displaying working set bias alerts
// AC 3.4.1, 3.4.2, 3.4.3, 3.4.5: Visual indicators with details on hover

import { AlertTriangle, Info } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useBiasDetection } from '@/hooks/useBiasDetection'
import type { BiasResult } from '@/lib/analysis/bias'

/**
 * Props for standalone badge (for testing without hook)
 */
interface BiasAlertBadgeStandaloneProps {
  biases: BiasResult[]
  hasBias: boolean
}

/**
 * Internal badge display for a single bias result
 */
function BiasAlertItem({ bias }: { bias: BiasResult }) {
  const isWarning = bias.severity === 'warning'

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={
              isWarning
                ? 'border-amber-500 text-amber-700 bg-amber-50 dark:bg-amber-950 dark:text-amber-400 cursor-help'
                : 'border-blue-500 text-blue-700 bg-blue-50 dark:bg-blue-950 dark:text-blue-400 cursor-help'
            }
            aria-label={bias.message}
          >
            {isWarning ? (
              <AlertTriangle className="h-3 w-3" aria-hidden="true" />
            ) : (
              <Info className="h-3 w-3" aria-hidden="true" />
            )}
            {bias.biasType === 'series-dominant' && 'Series Bias'}
            {bias.biasType === 'too-few-parts' && 'Small Sample'}
            {bias.biasType === 'outlier-skew' && 'Outlier Detected'}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <p className="font-medium text-sm">{bias.message}</p>

          {/* AC 3.4.5: Detailed breakdown based on bias type */}
          {bias.details.dominantSeries && (
            <p className="text-xs text-muted-foreground mt-1">
              {bias.details.dominantSeries.count} of {bias.details.dominantSeries.total} parts
              from "{bias.details.dominantSeries.name}"
            </p>
          )}

          {bias.details.partCount !== undefined && (
            <p className="text-xs text-muted-foreground mt-1">
              Add more parts for meaningful statistical analysis.
            </p>
          )}

          {bias.details.outlierPart && (
            <p className="text-xs text-muted-foreground mt-1">
              {bias.details.outlierPart.dimension}: {bias.details.outlierPart.value}mm
              (mean: {bias.details.outlierPart.mean}mm)
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

/**
 * Standalone component that accepts biases directly (for testing)
 */
export function BiasAlertBadgeStandalone({ biases, hasBias }: BiasAlertBadgeStandaloneProps) {
  if (!hasBias) return null

  return (
    <div className="flex flex-wrap gap-1" role="status" aria-live="polite">
      {biases.map((bias, index) => (
        <BiasAlertItem key={`${bias.biasType}-${index}`} bias={bias} />
      ))}
    </div>
  )
}

/**
 * Main component that uses the useBiasDetection hook
 * AC 3.4.4: Non-blocking - informational only
 */
export function BiasAlertBadge() {
  const { biases, hasBias } = useBiasDetection()

  return <BiasAlertBadgeStandalone biases={biases} hasBias={hasBias} />
}
