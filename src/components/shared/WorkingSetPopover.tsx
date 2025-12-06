import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { WorkingSetBadge } from './WorkingSetBadge'
import { useWorkingSetStore } from '@/stores/workingSet'
import { useComponentsStore } from '@/stores/components'
import { useQuery } from '@tanstack/react-query'
import { partsQueryOptions } from '@/lib/queries/parts'
import { componentsQueryOptions } from '@/lib/queries/components'

const MAX_DISPLAY_ITEMS = 5

interface ItemListProps {
  title: string
  items: string[]
  isLoading?: boolean
}

function ItemList({ title, items, isLoading }: ItemListProps) {
  const displayedItems = items.slice(0, MAX_DISPLAY_ITEMS)
  const overflowCount = items.length - MAX_DISPLAY_ITEMS

  if (isLoading) {
    return (
      <div className="space-y-1">
        <h4 className="text-sm font-medium">{title}</h4>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (items.length === 0) {
    return null
  }

  return (
    <div className="space-y-1">
      <h4 className="text-sm font-medium">{title}</h4>
      <ul className="text-sm space-y-0.5">
        {displayedItems.map((item) => (
          <li key={item} className="truncate text-muted-foreground">
            {item}
          </li>
        ))}
        {overflowCount > 0 && (
          <li className="text-muted-foreground italic">+ {overflowCount} more</li>
        )}
      </ul>
    </div>
  )
}

export function WorkingSetPopover() {
  const { partIds, clearParts } = useWorkingSetStore()
  const { activeComponentIds, clearActiveComponents } = useComponentsStore()

  const { data: allParts, isLoading: partsLoading } = useQuery(partsQueryOptions)
  const { data: allComponents, isLoading: componentsLoading } = useQuery(componentsQueryOptions)

  // Filter to selected parts and get their callouts
  const selectedPartCallouts = allParts
    ?.filter((p) => partIds.has(p.PartCallout))
    .map((p) => p.PartCallout) ?? []

  // Filter to active components and get their model names
  const activeComponentNames = allComponents
    ?.filter((c) => activeComponentIds.has(c.componentId))
    .map((c) => c.Model) ?? []

  const partsCount = partIds.size
  const componentsCount = activeComponentIds.size
  const isEmpty = partsCount === 0 && componentsCount === 0

  const handleClearAll = () => {
    clearParts()
    clearActiveComponents()
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <WorkingSetBadge />
      </PopoverTrigger>
      <PopoverContent className="w-80" side="bottom" align="end">
        {isEmpty ? (
          <div className="text-center py-4 space-y-2">
            <p className="text-muted-foreground">No items selected</p>
            <p className="text-xs text-muted-foreground">
              Select parts in Parts Library and activate components in Stations
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Parts Section */}
            <ItemList
              title="Parts"
              items={selectedPartCallouts}
              isLoading={partsLoading}
            />

            {/* Components Section */}
            <ItemList
              title="Components"
              items={activeComponentNames}
              isLoading={componentsLoading}
            />

            <Separator />

            {/* Actions Section */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={clearParts}
                disabled={partsCount === 0}
                className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/50"
              >
                Clear Parts
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearActiveComponents}
                disabled={componentsCount === 0}
                className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/50"
              >
                Clear Components
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAll}
                disabled={isEmpty}
                className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/50"
              >
                Clear All
              </Button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
