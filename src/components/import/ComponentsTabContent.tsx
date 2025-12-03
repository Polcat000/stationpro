import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { FileJson, Plus, Database, HelpCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ImportActionCard } from '@/components/import/ImportActionCard'
import { ComponentsJsonUploadModal } from '@/components/import/ComponentsJsonUploadModal'
import { ComponentManualEntryModal } from '@/components/import/ComponentManualEntryModal'
import { SchemaHelpModal } from '@/components/import/SchemaHelpModal'
import { loadSampleData } from '@/lib/sampleData'

export function ComponentsTabContent() {
  const [isLoadingSamples, setIsLoadingSamples] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showManualEntryModal, setShowManualEntryModal] = useState(false)
  const [isSchemaHelpOpen, setIsSchemaHelpOpen] = useState(false)
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const handleUploadJson = () => {
    setShowUploadModal(true)
  }

  const handleAddManually = () => {
    setShowManualEntryModal(true)
  }

  const handleLoadSamples = async () => {
    if (isLoadingSamples) return

    setIsLoadingSamples(true)
    try {
      await loadSampleData(queryClient)
      toast.success('Sample components loaded successfully')
      await navigate({ to: '/stations' })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load sample components'
      toast.error(message)
    } finally {
      setIsLoadingSamples(false)
    }
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSchemaHelpOpen(true)}
            className="text-muted-foreground"
          >
            <HelpCircle className="mr-1 size-4" />
            View Schema
          </Button>
        </div>
        <ImportActionCard
          icon={<FileJson className="size-5" />}
          title="Upload JSON File"
          description="Import components from a JSON file"
          onClick={handleUploadJson}
          variant="primary"
        />
        <ImportActionCard
          icon={<Plus className="size-5" />}
          title="Add Manually"
          description="Enter component details using a guided wizard"
          onClick={handleAddManually}
        />
        <ImportActionCard
          icon={<Database className="size-5" />}
          title="Load Sample Data"
          description="Explore with pre-loaded example components"
          onClick={handleLoadSamples}
          loading={isLoadingSamples}
        />
      </div>

      <ComponentsJsonUploadModal
        open={showUploadModal}
        onOpenChange={setShowUploadModal}
      />

      <ComponentManualEntryModal
        open={showManualEntryModal}
        onOpenChange={setShowManualEntryModal}
      />

      <SchemaHelpModal
        open={isSchemaHelpOpen}
        onOpenChange={setIsSchemaHelpOpen}
      />
    </>
  )
}
