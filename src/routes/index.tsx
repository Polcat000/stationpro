import { useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { Check, ImageIcon, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { loadSampleData } from '@/lib/sampleData'

export const Route = createFileRoute('/')({
  component: HomeScreen,
})

// Export component for testing
export { HomeScreen }

const features = [
  { label: 'FOV Validation' },
  { label: 'Resolution Check' },
  { label: 'DOF Analysis' },
]

function HomeScreen() {
  const [isLoading, setIsLoading] = useState(false)
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const handleSampleData = async () => {
    if (isLoading) return

    setIsLoading(true)
    try {
      await loadSampleData(queryClient)
      toast.success('Sample data loaded successfully')
      await navigate({ to: '/parts' })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load sample data'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="grid min-h-[calc(100vh-64px)] grid-cols-1 lg:grid-cols-2">
      {/* Hero Left - Content */}
      <div className="flex flex-col justify-center px-8 py-12 lg:px-16">
        {/* Tagline */}
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          Machine Vision Planning Tool
        </p>

        {/* Title */}
        <h1 className="mt-4 text-4xl font-bold leading-tight text-foreground lg:text-[2.75rem]">
          See Your System Before You Build It
        </h1>

        {/* Subtitle */}
        <p className="mt-4 text-lg text-muted-foreground">
          StationPro helps you plan machine vision inspection stations by
          validating camera and lens combinations against your part requirements
          before purchasing hardware.
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-wrap gap-4">
          <Button variant="default" size="lg" asChild>
            <Link to="/import">Import Parts</Link>
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={handleSampleData}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
            Load Sample Data
          </Button>
        </div>

        {/* Feature Highlights */}
        <div className="mt-8 flex flex-wrap gap-6 lg:gap-8">
          {features.map((feature) => (
            <div
              key={feature.label}
              className="flex items-center gap-2 text-sm text-muted-foreground"
            >
              <Check className="size-4 text-primary" />
              <span>{feature.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Hero Right - Visual Placeholder */}
      <div className="hidden bg-muted lg:flex lg:items-center lg:justify-center">
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-gradient-to-br from-muted to-muted/50 p-12">
          <div className="mb-4 rounded-full bg-primary/10 p-4">
            <ImageIcon className="size-8 text-primary" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Hero Visual
          </span>
          <p className="mt-2 max-w-xs text-center text-sm text-muted-foreground">
            3D envelope visualization will be displayed here
          </p>
        </div>
      </div>
    </div>
  )
}
