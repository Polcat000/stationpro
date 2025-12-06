import { Link, useRouterState } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { WorkingSetPopover } from '@/components/shared/WorkingSetPopover'

interface NavItem {
  to: '/' | '/parts' | '/stations' | '/analysis' | '/visualizer'
  label: string
}

const navItems: NavItem[] = [
  { to: '/', label: 'Home' },
  { to: '/parts', label: 'Parts' },
  { to: '/stations', label: 'Stations' },
  { to: '/analysis', label: 'Analysis' },
  { to: '/visualizer', label: 'Visualizer' },
]

function LogoMark() {
  return (
    <div
      className="size-7 rounded-md"
      style={{
        background: 'linear-gradient(135deg, var(--primary) 0%, var(--chart-2) 100%)',
      }}
      aria-hidden="true"
    />
  )
}

export function TopNav() {
  const router = useRouterState()
  const currentPath = router.location.pathname

  const isActive = (path: string) => {
    if (path === '/') return currentPath === '/'
    return currentPath.startsWith(path)
  }

  return (
    <header className="h-16 border-b border-border bg-card">
      <nav className="container mx-auto flex h-full items-center justify-between px-4">
        {/* Logo / Wordmark */}
        <Link to="/" className="flex items-center gap-2">
          <LogoMark />
          <span className="text-lg font-semibold text-foreground">StationPro</span>
        </Link>

        {/* Nav Items */}
        <div className="flex items-center gap-1">
          {navItems.map((item) => (
            <Button
              key={item.to}
              variant="ghost"
              size="sm"
              asChild
              className={cn(
                'text-sm',
                isActive(item.to)
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
            >
              <Link to={item.to}>{item.label}</Link>
            </Button>
          ))}
        </div>

        {/* Working Set Summary - hidden on home page */}
        {currentPath !== '/' ? <WorkingSetPopover /> : <div className="w-7" aria-hidden="true" />}
      </nav>
    </header>
  )
}
