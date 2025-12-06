// src/components/stations/ComponentsTab.tsx
// Main container for Components tab (AC 2.8.2)
// Ref: docs/sprint-artifacts/2-8-components-library-screen.md

import { useState, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getGroupedRowModel,
  getExpandedRowModel,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  type GroupingState,
  type ExpandedState,
} from '@tanstack/react-table'
import { componentsQueryOptions } from '@/lib/queries/components'
import { componentsRepository } from '@/lib/repositories/componentsRepository'
import type { Component } from '@/lib/schemas/component'
import { toast } from 'sonner'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { ComponentEntryWizard } from '@/components/wizards/ComponentEntryWizard'
import { ComponentsDataGrid } from './ComponentsDataGrid'
import { columns, specColumnIds } from './columns'
import { ComponentsFilterPanel } from './ComponentsFilterPanel'
import { ComponentsFilterChip } from './ComponentsFilterChip'
import { ComponentsColumnConfigDropdown } from './ComponentsColumnConfigDropdown'
import { ComponentDetailPanel } from './ComponentDetailPanel'
import { DeleteComponentDialog } from './DeleteComponentDialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { ActiveComponentsCounter } from './ActiveComponentsCounter'
import { SelectByTypeDropdown } from './SelectByTypeDropdown'
import { useComponentsStore } from '@/stores/components'

const COLUMN_VISIBILITY_KEY = 'stationpro-components-columns'

/**
 * Default column visibility state.
 * Spec columns are hidden by default; users opt-in to what they need.
 * Base columns (Manufacturer, Model, componentType) and active remain visible.
 */
function getDefaultColumnVisibility(): VisibilityState {
  const visibility: VisibilityState = {}
  // Hide all spec columns by default
  for (const columnId of specColumnIds) {
    visibility[columnId] = false
  }
  return visibility
}

export interface ComponentFilters {
  model: string
  manufacturers: string[]
  types: string[]
}

const defaultFilters: ComponentFilters = {
  model: '',
  manufacturers: [],
  types: [],
}

function countActiveFilters(filters: ComponentFilters): number {
  let count = 0
  if (filters.model) count++
  if (filters.manufacturers.length > 0) count++
  if (filters.types.length > 0) count++
  return count
}

export function ComponentsTab() {
  const queryClient = useQueryClient()
  const { data: components = [], isLoading } = useQuery(componentsQueryOptions)
  const { activeComponentIds, addAllFiltered, clearActiveComponents, cleanupStaleComponentIds } = useComponentsStore()

  // UI State
  const [filterPanelOpen, setFilterPanelOpen] = useState(false)
  const [detailPanelOpen, setDetailPanelOpen] = useState(false)
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  // Filter State
  const [filters, setFilters] = useState<ComponentFilters>(defaultFilters)

  // TanStack Table State
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    getDefaultColumnVisibility
  )
  const [grouping, setGrouping] = useState<GroupingState>(['Manufacturer'])
  const [expanded, setExpanded] = useState<ExpandedState>(true)

  // Load column visibility from localStorage (merges with defaults)
  useEffect(() => {
    const saved = localStorage.getItem(COLUMN_VISIBILITY_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as VisibilityState
        // Merge saved preferences with defaults (saved preferences take precedence)
        setColumnVisibility((prev) => ({ ...prev, ...parsed }))
      } catch {
        // Ignore invalid JSON, keep defaults
      }
    }
  }, [])

  // Cleanup stale component IDs when components data loads (AC 3.2.4)
  useEffect(() => {
    if (components.length > 0) {
      const validIds = components.map((c) => c.componentId)
      cleanupStaleComponentIds(validIds)
    }
  }, [components, cleanupStaleComponentIds])

  // Persist column visibility to localStorage
  useEffect(() => {
    localStorage.setItem(COLUMN_VISIBILITY_KEY, JSON.stringify(columnVisibility))
  }, [columnVisibility])

  // Convert ComponentFilters to TanStack column filters
  useEffect(() => {
    const newFilters: ColumnFiltersState = []

    if (filters.model) {
      newFilters.push({ id: 'Model', value: filters.model })
    }
    if (filters.manufacturers.length > 0) {
      newFilters.push({ id: 'Manufacturer', value: filters.manufacturers })
    }
    if (filters.types.length > 0) {
      newFilters.push({ id: 'componentType', value: filters.types })
    }

    setColumnFilters(newFilters)
  }, [filters])

  // Get unique manufacturers for multi-select
  const uniqueManufacturers = useMemo(() => {
    const mfrSet = new Set<string>()
    components.forEach((c) => {
      if (c.Manufacturer) {
        mfrSet.add(c.Manufacturer)
      }
    })
    return Array.from(mfrSet).sort()
  }, [components])

  // TanStack Table instance
  const table = useReactTable({
    data: components,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      grouping,
      expanded,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGroupingChange: setGrouping,
    onExpandedChange: setExpanded,
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => componentsRepository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['components'] })
      toast.success('Component deleted')
      setDeleteDialogOpen(false)
      setDetailPanelOpen(false)
      setSelectedComponent(null)
    },
    onError: () => {
      toast.error('Failed to delete component')
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (component: Component) => componentsRepository.save(component),
    onSuccess: (_, updatedComponent) => {
      queryClient.invalidateQueries({ queryKey: ['components'] })
      toast.success('Component updated successfully')
      setEditModalOpen(false)
      // Keep panel open and update with new data
      setSelectedComponent(updatedComponent)
    },
    onError: () => {
      toast.error('Failed to update component')
    },
  })

  const handleRowClick = (component: Component) => {
    setSelectedComponent(component)
    setDetailPanelOpen(true)
  }

  const handleEdit = () => {
    setEditModalOpen(true)
  }

  const handleDelete = () => {
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = () => {
    if (selectedComponent) {
      deleteMutation.mutate(selectedComponent.componentId)
    }
  }

  const handleEditComplete = (data: Component) => {
    updateMutation.mutate(data)
  }

  const handleClearFilters = () => {
    setFilters(defaultFilters)
    setFilterPanelOpen(false)
  }

  const activeFilterCount = countActiveFilters(filters)

  if (isLoading) {
    return (
      <div className="flex h-full flex-col gap-4" data-testid="components-loading-skeleton">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
        <div className="flex-1">
          <Skeleton className="h-full w-full" />
        </div>
      </div>
    )
  }

  if (components.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4 text-muted-foreground">
        <p className="text-lg">No components imported yet</p>
        <p className="text-sm">
          Import components via Data Import or add them manually using the Component Entry Wizard.
        </p>
      </div>
    )
  }

  // Get filtered component IDs for "Select All Filtered" action
  const filteredComponentIds = table.getFilteredRowModel().rows.map((row) => row.original.componentId)

  const handleSelectAllFiltered = () => {
    addAllFiltered(filteredComponentIds)
  }

  const handleClearAll = () => {
    clearActiveComponents()
  }

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <ActiveComponentsCounter />
        <div className="flex items-center gap-2">
          <SelectByTypeDropdown components={components} />
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectAllFiltered}
            disabled={filteredComponentIds.length === 0}
          >
            Select All Filtered
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearAll}
            disabled={activeComponentIds.size === 0}
          >
            Clear All
          </Button>
          <ComponentsFilterChip
            activeCount={activeFilterCount}
            onClick={() => setFilterPanelOpen(true)}
          />
          <ComponentsColumnConfigDropdown
            table={table}
            lockedColumns={['Manufacturer']}
          />
        </div>
      </div>

      {/* Data Grid - Table component handles its own scrolling */}
      <div className="min-h-0 flex-1">
        <ComponentsDataGrid table={table} onRowClick={handleRowClick} />
      </div>

      {/* Filter Panel */}
      <ComponentsFilterPanel
        open={filterPanelOpen}
        onOpenChange={setFilterPanelOpen}
        filters={filters}
        onFiltersChange={setFilters}
        uniqueManufacturers={uniqueManufacturers}
        onClearAll={handleClearFilters}
      />

      {/* Detail Panel */}
      <ComponentDetailPanel
        open={detailPanelOpen}
        onOpenChange={setDetailPanelOpen}
        component={selectedComponent}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-2xl">
          {selectedComponent && (
            <ComponentEntryWizard
              defaultValues={selectedComponent}
              onComplete={handleEditComplete}
              onCancel={() => setEditModalOpen(false)}
              isEditMode
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <DeleteComponentDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        componentName={selectedComponent ? `${selectedComponent.Manufacturer} ${selectedComponent.Model}` : ''}
        onConfirm={handleConfirmDelete}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  )
}
