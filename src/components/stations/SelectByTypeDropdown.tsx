// src/components/stations/SelectByTypeDropdown.tsx
// Dropdown for bulk activate/deactivate by component type (AC 3.2.3)

import { ChevronDown, Plus, Minus } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { useComponentsStore } from '@/stores/components'
import type { Component } from '@/lib/schemas/component'
import { typeLabels } from './columns'

export interface SelectByTypeDropdownProps {
  components: Component[]
}

interface TypeGroup {
  type: string
  label: string
  componentIds: string[]
}

function getTypeGroups(components: Component[]): TypeGroup[] {
  const groupMap = new Map<string, string[]>()

  components.forEach((component) => {
    const type = component.componentType
    if (!groupMap.has(type)) {
      groupMap.set(type, [])
    }
    groupMap.get(type)!.push(component.componentId)
  })

  return Array.from(groupMap.entries())
    .map(([type, componentIds]) => ({
      type,
      label: typeLabels[type] || type,
      componentIds,
    }))
    .sort((a, b) => a.label.localeCompare(b.label))
}

export function SelectByTypeDropdown({ components }: SelectByTypeDropdownProps) {
  const { activateByType, deactivateByType } = useComponentsStore()
  const typeGroups = getTypeGroups(components)

  if (typeGroups.length === 0) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          Select by Type
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Plus className="mr-2 h-4 w-4" />
            Activate by Type
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {typeGroups.map(({ type, label, componentIds }) => (
              <DropdownMenuItem
                key={`activate-${type}`}
                onClick={() => activateByType(type, componentIds)}
              >
                {label} ({componentIds.length})
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Minus className="mr-2 h-4 w-4" />
            Clear by Type
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {typeGroups.map(({ type, label, componentIds }) => (
              <DropdownMenuItem
                key={`deactivate-${type}`}
                onClick={() => deactivateByType(type, componentIds)}
              >
                {label} ({componentIds.length})
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
