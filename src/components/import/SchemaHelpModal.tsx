import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PartsSchemaSection } from './PartsSchemaSection'
import { ComponentsSchemaSection } from './ComponentsSchemaSection'

interface SchemaHelpModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SchemaHelpModal({ open, onOpenChange }: SchemaHelpModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] sm:max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>JSON Import Schema</DialogTitle>
          <DialogDescription>
            Reference documentation for JSON file formats used when importing
            parts and components.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="parts" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="parts">Parts Schema</TabsTrigger>
            <TabsTrigger value="components">Components Schema</TabsTrigger>
          </TabsList>

          <TabsContent value="parts" className="mt-4">
            <PartsSchemaSection />
          </TabsContent>

          <TabsContent value="components" className="mt-4">
            <ComponentsSchemaSection />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
