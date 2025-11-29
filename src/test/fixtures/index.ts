// src/test/fixtures/index.ts
// PURPOSE: Re-export all test fixtures
// USAGE: import { fixtures } from '@/test/fixtures'

export * from './parts'
export * from './components'
export * from './expectedResults'

// Convenience namespace export
import * as partsFixtures from './parts'
import * as componentFixtures from './components'
import * as expectedResults from './expectedResults'

export const fixtures = {
  parts: partsFixtures,
  components: componentFixtures,
  expected: expectedResults,
}
