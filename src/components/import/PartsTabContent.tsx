import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { FileJson, Plus, Database } from 'lucide-react'
import { toast } from 'sonner'
import { ImportActionCard } from '@/components/import/ImportActionCard'
import { PartsJsonUploadModal } from '@/components/import/PartsJsonUploadModal'
import { PartManualEntryModal } from '@/components/import/PartManualEntryModal'
import { loadSampleData } from '@/lib/sampleData'

export function PartsTabContent() {
  const [isLoadingSamples, setIsLoadingSamples] = useState(false)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false)
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const handleUploadJson = () => {
    setIsUploadModalOpen(true)
  }

  const handleUploadSuccess = () => {
    navigate({ to: '/parts' })
  }

  const handleAddManually = () => {
    setIsManualEntryOpen(true)
  }

  const handleManualEntrySuccess = () => {
    navigate({ to: '/parts' })
  }

  const handleLoadSamples = async () => {
    if (isLoadingSamples) return

    setIsLoadingSamples(true)
    try {
      await loadSampleData(queryClient)
      toast.success('Sample parts loaded successfully')
      await navigate({ to: '/parts' })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load sample parts'
      toast.error(message)
    } finally {
      setIsLoadingSamples(false)
    }
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        <ImportActionCard
          icon={<FileJson className="size-5" />}
          title="Upload JSON File"
          description="Import parts from a JSON file"
          onClick={handleUploadJson}
          variant="primary"
        />
        <ImportActionCard
          icon={<Plus className="size-5" />}
          title="Add Manually"
          description="Enter part details using a guided wizard"
          onClick={handleAddManually}
        />
        <ImportActionCard
          icon={<Database className="size-5" />}
          title="Load Sample Data"
          description="Explore with pre-loaded example parts"
          onClick={handleLoadSamples}
          loading={isLoadingSamples}
        />
      </div>

      <PartsJsonUploadModal
        open={isUploadModalOpen}
        onOpenChange={setIsUploadModalOpen}
        onSuccess={handleUploadSuccess}
      />

      <PartManualEntryModal
        open={isManualEntryOpen}
        onOpenChange={setIsManualEntryOpen}
        onSuccess={handleManualEntrySuccess}
      />
    </>
  )
}
