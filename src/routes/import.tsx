import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod/v4'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { PartsTabContent } from '@/components/import/PartsTabContent'
import { ComponentsTabContent } from '@/components/import/ComponentsTabContent'

const importSearchSchema = z.object({
  type: z.enum(['parts', 'components']).default('parts').catch('parts'),
})

export const Route = createFileRoute('/import')({
  component: ImportPage,
  validateSearch: importSearchSchema,
})

export { ImportPage }

function ImportPage() {
  const search = Route.useSearch()
  // Default to 'parts' if type is not provided or undefined
  const activeTab = search?.type ?? 'parts'

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-foreground">Import Data</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Add parts or components to your library
          </p>
        </div>

        {/* Import Card with Tabs */}
        <Card className="overflow-hidden py-0">
          <Tabs defaultValue={activeTab} className="gap-0">
            <TabsList className="grid h-auto w-full grid-cols-2 rounded-none border-b bg-transparent p-0">
              <TabsTrigger
                value="parts"
                className="rounded-none border-0 py-3 data-[state=active]:bg-secondary data-[state=active]:text-primary data-[state=active]:shadow-none"
              >
                Parts
              </TabsTrigger>
              <TabsTrigger
                value="components"
                className="rounded-none border-0 py-3 data-[state=active]:bg-secondary data-[state=active]:text-primary data-[state=active]:shadow-none"
              >
                Components
              </TabsTrigger>
            </TabsList>
            <CardContent className="p-4">
              <TabsContent value="parts" className="mt-0">
                <PartsTabContent />
              </TabsContent>
              <TabsContent value="components" className="mt-0">
                <ComponentsTabContent />
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  )
}
