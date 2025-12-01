import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImportActionCardProps {
  icon: React.ReactNode
  title: string
  description: string
  onClick: () => void
  disabled?: boolean
  loading?: boolean
  variant?: 'primary' | 'secondary'
}

export function ImportActionCard({
  icon,
  title,
  description,
  onClick,
  disabled = false,
  loading = false,
  variant = 'secondary',
}: ImportActionCardProps) {
  const isDisabled = disabled || loading

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      className={cn(
        'flex w-full items-center gap-3 rounded-md border px-4 py-3 text-left transition-all',
        'hover:bg-secondary hover:shadow-sm',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        variant === 'primary' && [
          'bg-primary text-primary-foreground border-primary',
          'hover:bg-primary/90 hover:border-primary/90',
        ],
        variant === 'secondary' && [
          'bg-card text-card-foreground border-border',
          'hover:border-primary/50',
        ],
        isDisabled && 'cursor-not-allowed opacity-50 hover:bg-card hover:shadow-none hover:border-border'
      )}
    >
      <span className="flex size-6 shrink-0 items-center justify-center">
        {loading ? <Loader2 className="size-5 animate-spin" /> : icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="font-medium">{title}</div>
        <div
          className={cn(
            'text-sm',
            variant === 'primary' ? 'text-primary-foreground/80' : 'text-muted-foreground'
          )}
        >
          {description}
        </div>
      </div>
    </button>
  )
}
