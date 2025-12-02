// src/components/parts/PartsLibraryPage.tsx
// Main container for Parts Library screen (AC 2.7.1)
// Ref: docs/sprint-artifacts/2-7-parts-library-screen.md

import { useState, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
} from '@tanstack/react-table'
import { partsQueryOptions } from '@/lib/queries/parts'
import { partsRepository } from '@/lib/repositories/partsRepository'
import type { Part } from '@/lib/schemas/part'
import { toast } from 'sonner'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PartEntryWizard } from '@/components/wizards/PartEntryWizard'
import { PartsDataGrid } from './PartsDataGrid'
import { columns } from './columns'
import { PartsFilterPanel } from './PartsFilterPanel'
import { FilterChip } from './FilterChip'
import { ColumnConfigDropdown } from './ColumnConfigDropdown'
import { PartDetailPanel } from './PartDetailPanel'
import { DeletePartDialog } from './DeletePartDialog'
import { Skeleton } from '@/components/ui/skeleton'

const COLUMN_VISIBILITY_KEY = 'stationpro-parts-columns'
const TAB_SESSION_KEY = 'stationpro-parts-tab'

type TabValue = 'parts' | 'analysis'

function getInitialTab(): TabValue {
  const saved = sessionStorage.getItem(TAB_SESSION_KEY)
  if (saved && ['parts', 'analysis'].includes(saved)) {
    return saved as TabValue
  }
  return 'parts'
}

export interface PartFilters {
  callout: string
  series: string[]
  widthRange: [number | null, number | null]
  heightRange: [number | null, number | null]
  lengthRange: [number | null, number | null]
  zoneCountRange: [number | null, number | null]
}

const defaultFilters: PartFilters = {
  callout: '',
  series: [],
  widthRange: [null, null],
  heightRange: [null, null],
  lengthRange: [null, null],
  zoneCountRange: [null, null],
}

function countActiveFilters(filters: PartFilters): number {
  let count = 0
  if (filters.callout) count++
  if (filters.series.length > 0) count++
  if (filters.widthRange[0] !== null || filters.widthRange[1] !== null) count++
  if (filters.heightRange[0] !== null || filters.heightRange[1] !== null) count++
  if (filters.lengthRange[0] !== null || filters.lengthRange[1] !== null) count++
  if (filters.zoneCountRange[0] !== null || filters.zoneCountRange[1] !== null) count++
  return count
}

export function PartsLibraryPage() {
  const queryClient = useQueryClient()
  const { data: parts = [], isLoading } = useQuery(partsQueryOptions)

  // Tab State
  const [activeTab, setActiveTab] = useState<TabValue>(getInitialTab)

  const handleTabChange = (value: string) => {
    const tabValue = value as TabValue
    setActiveTab(tabValue)
    sessionStorage.setItem(TAB_SESSION_KEY, tabValue)
  }

  // UI State
  const [filterPanelOpen, setFilterPanelOpen] = useState(false)
  const [detailPanelOpen, setDetailPanelOpen] = useState(false)
  const [selectedPart, setSelectedPart] = useState<Part | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  // Filter State
  const [filters, setFilters] = useState<PartFilters>(defaultFilters)

  // TanStack Table State
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

  // Load column visibility from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(COLUMN_VISIBILITY_KEY)
    if (saved) {
      try {
        setColumnVisibility(JSON.parse(saved))
      } catch {
        // Ignore invalid JSON
      }
    }
  }, [])

  // Persist column visibility to localStorage
  useEffect(() => {
    localStorage.setItem(COLUMN_VISIBILITY_KEY, JSON.stringify(columnVisibility))
  }, [columnVisibility])

  // Convert PartFilters to TanStack column filters
  useEffect(() => {
    const newFilters: ColumnFiltersState = []

    if (filters.callout) {
      newFilters.push({ id: 'PartCallout', value: filters.callout })
    }
    if (filters.series.length > 0) {
      newFilters.push({ id: 'PartSeries', value: filters.series })
    }
    if (filters.widthRange[0] !== null || filters.widthRange[1] !== null) {
      newFilters.push({ id: 'PartWidth_mm', value: filters.widthRange })
    }
    if (filters.heightRange[0] !== null || filters.heightRange[1] !== null) {
      newFilters.push({ id: 'PartHeight_mm', value: filters.heightRange })
    }
    if (filters.lengthRange[0] !== null || filters.lengthRange[1] !== null) {
      newFilters.push({ id: 'PartLength_mm', value: filters.lengthRange })
    }
    if (filters.zoneCountRange[0] !== null || filters.zoneCountRange[1] !== null) {
      newFilters.push({ id: 'zoneCount', value: filters.zoneCountRange })
    }

    setColumnFilters(newFilters)
  }, [filters])

  // Get unique series values for multi-select
  const uniqueSeries = useMemo(() => {
    const seriesSet = new Set<string>()
    parts.forEach((p) => {
      if (p.PartSeries) {
        seriesSet.add(p.PartSeries)
      }
    })
    return Array.from(seriesSet).sort()
  }, [parts])

  // TanStack Table instance
  // Filter functions are defined directly in columns.tsx for proper typing
  const table = useReactTable({
    data: parts,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (callout: string) => partsRepository.delete(callout),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parts'] })
      toast.success('Part deleted')
      setDeleteDialogOpen(false)
      setDetailPanelOpen(false)
      setSelectedPart(null)
    },
    onError: () => {
      toast.error('Failed to delete part')
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (part: Part) => partsRepository.save(part),
    onSuccess: (_, updatedPart) => {
      queryClient.invalidateQueries({ queryKey: ['parts'] })
      toast.success('Part updated successfully')
      setEditModalOpen(false)
      // Keep panel open and update with new data
      setSelectedPart(updatedPart)
    },
    onError: () => {
      toast.error('Failed to update part')
    },
  })

  const handleRowClick = (part: Part) => {
    setSelectedPart(part)
    setDetailPanelOpen(true)
  }

  const handleEdit = () => {
    setEditModalOpen(true)
  }

  const handleDelete = () => {
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = () => {
    if (selectedPart) {
      deleteMutation.mutate(selectedPart.PartCallout)
    }
  }

  const handleEditComplete = (data: Part) => {
    updateMutation.mutate(data)
  }

  const handleClearFilters = () => {
    setFilters(defaultFilters)
    setFilterPanelOpen(false)
  }

  const activeFilterCount = countActiveFilters(filters)

  if (isLoading) {
    return (
      <div className="flex h-full flex-col gap-4 p-4" data-testid="parts-loading-skeleton">
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

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      {/* Page Title */}
      <h1 className="text-2xl font-semibold">Parts Library</h1>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="flex h-full flex-col">
        <TabsList className="w-fit">
          <TabsTrigger value="parts" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Parts
          </TabsTrigger>
          <TabsTrigger value="analysis" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Analysis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="parts" className="flex flex-1 flex-col gap-4">
          {/* Toolbar */}
          <div className="flex items-center justify-end">
            <div className="flex items-center gap-2">
              <FilterChip
                activeCount={activeFilterCount}
                onClick={() => setFilterPanelOpen(true)}
              />
              <ColumnConfigDropdown
                table={table}
                lockedColumns={['PartCallout']}
              />
            </div>
          </div>

          {/* Data Grid */}
          <div className="flex-1 overflow-auto">
            <PartsDataGrid table={table} onRowClick={handleRowClick} />
          </div>

          {/* Filter Panel */}
          <PartsFilterPanel
            open={filterPanelOpen}
            onOpenChange={setFilterPanelOpen}
            filters={filters}
            onFiltersChange={setFilters}
            uniqueSeries={uniqueSeries}
            onClearAll={handleClearFilters}
          />

          {/* Detail Panel */}
          <PartDetailPanel
            open={detailPanelOpen}
            onOpenChange={setDetailPanelOpen}
            part={selectedPart}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />

          {/* Edit Modal */}
          <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
            <DialogContent className="max-w-2xl">
              {selectedPart && (
                <PartEntryWizard
                  defaultValues={selectedPart}
                  onComplete={handleEditComplete}
                  onCancel={() => setEditModalOpen(false)}
                />
              )}
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation */}
          <DeletePartDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            partCallout={selectedPart?.PartCallout ?? ''}
            onConfirm={handleConfirmDelete}
            isDeleting={deleteMutation.isPending}
          />
        </TabsContent>

        <TabsContent value="analysis" className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground">Parts analysis and metrics coming soon</p>
        </TabsContent>
      </Tabs>
    </div>
  )
}
