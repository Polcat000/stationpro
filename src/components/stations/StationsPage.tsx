// src/components/stations/StationsPage.tsx
// Main container with tabbed layout for Stations Library (AC 2.8.1)
// Ref: docs/sprint-artifacts/2-8-components-library-screen.md

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StationsTab } from './StationsTab'
import { ComponentsTab } from './ComponentsTab'
import { AnalysisTab } from './AnalysisTab'

type TabValue = 'stations' | 'components' | 'analysis'

const TAB_SESSION_KEY = 'stationpro-stations-active-tab'

function getInitialTab(): TabValue {
  const saved = sessionStorage.getItem(TAB_SESSION_KEY)
  if (saved && ['stations', 'components', 'analysis'].includes(saved)) {
    return saved as TabValue
  }
  return 'stations'
}

export function StationsPage() {
  const [activeTab, setActiveTab] = useState<TabValue>(getInitialTab)

  // Persist tab state to session storage
  const handleTabChange = (value: string) => {
    const tabValue = value as TabValue
    setActiveTab(tabValue)
    sessionStorage.setItem(TAB_SESSION_KEY, tabValue)
  }

  const titleMap: Record<TabValue, string> = {
    stations: 'Stations',
    components: 'Component Library',
    analysis: 'Component Analysis',
  }

  return (
    <div className="flex h-full flex-col p-4">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="flex h-full flex-col">
        {/* Sticky header zone - title + tab selector */}
        <div className="sticky top-0 z-10 bg-background pb-4">
          <h1 className="mb-4 text-2xl font-semibold">{titleMap[activeTab]}</h1>
          <TabsList className="w-fit">
            <TabsTrigger value="stations" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Stations
            </TabsTrigger>
            <TabsTrigger value="components" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Components
            </TabsTrigger>
            <TabsTrigger value="analysis" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Analysis
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="stations" className="flex-1 overflow-auto">
          <StationsTab />
        </TabsContent>

        <TabsContent value="components" className="flex-1 overflow-auto">
          <ComponentsTab />
        </TabsContent>

        <TabsContent value="analysis" className="flex-1 overflow-auto">
          <AnalysisTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
