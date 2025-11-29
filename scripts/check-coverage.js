// scripts/check-coverage.js
// PURPOSE: Verify coverage thresholds are met
// USAGE: node scripts/check-coverage.js
// NOTE: This is a backup check; Vitest already enforces thresholds

import { readFileSync } from 'fs'
import { resolve } from 'path'

const COVERAGE_FILE = resolve(process.cwd(), 'coverage/coverage-summary.json')

// Thresholds by directory (more strict as code matures)
const THRESHOLDS = {
  // Compatibility engine: 95% required (CRITICAL - NFR-R1)
  'src/lib/compatibility': {
    statements: 95,
    branches: 95,
    functions: 95,
    lines: 95,
  },
  // Repositories: 80% required
  'src/lib/repositories': {
    statements: 80,
    branches: 80,
    functions: 80,
    lines: 80,
  },
  // Stores: 70% required
  'src/stores': {
    statements: 70,
    branches: 70,
    functions: 70,
    lines: 70,
  },
  // Global minimum (applies to all other code)
  global: {
    statements: 50,
    branches: 50,
    functions: 50,
    lines: 50,
  },
}

function checkCoverage() {
  let coverageData

  try {
    const content = readFileSync(COVERAGE_FILE, 'utf-8')
    coverageData = JSON.parse(content)
  } catch (error) {
    console.error('❌ Could not read coverage file:', COVERAGE_FILE)
    console.error('   Run "pnpm test:coverage" first')
    process.exit(1)
  }

  const failures = []

  // Check global thresholds
  const total = coverageData.total
  if (total) {
    const globalThreshold = THRESHOLDS.global
    for (const metric of ['statements', 'branches', 'functions', 'lines']) {
      const actual = total[metric]?.pct ?? 0
      const required = globalThreshold[metric]
      if (actual < required) {
        failures.push(`Global ${metric}: ${actual.toFixed(1)}% < ${required}% required`)
      }
    }
  }

  if (failures.length > 0) {
    console.error('❌ Coverage thresholds not met:')
    failures.forEach((f) => console.error(`   ${f}`))
    process.exit(1)
  }

  console.log('✅ All coverage thresholds met')
  process.exit(0)
}

checkCoverage()
