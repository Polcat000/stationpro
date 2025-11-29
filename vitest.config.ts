// vitest.config.ts
// PURPOSE: Vitest test framework configuration
// SOURCE: architecture.md "Testing Framework" section
// DO NOT MODIFY without updating architecture.md

import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    // Use global test APIs (describe, it, expect) without imports
    globals: true,

    // Use jsdom for DOM simulation (React components)
    environment: 'jsdom',

    // Load test setup file before each test file
    setupFiles: ['./src/test/setup.ts'],

    // Only include files matching this pattern
    include: ['src/**/*.test.{ts,tsx}'],

    // Exclude these from test runs
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],

    // Coverage configuration
    coverage: {
      // Use V8 coverage provider (faster than Istanbul)
      provider: 'v8',

      // Output formats: text (console), json (CI), html (local review)
      reporter: ['text', 'json', 'html'],

      // Only measure coverage on these files
      include: [
        'src/lib/**/*.ts',
        'src/stores/**/*.ts',
      ],

      // Exclude test files and test utilities from coverage
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.test.tsx',
        'src/test/**',
      ],

      // Coverage thresholds - CI will fail if not met
      // These are INITIAL thresholds; will be enforced more strictly as code grows
      thresholds: {
        // Global thresholds (applies to all covered files)
        statements: 50,
        branches: 50,
        functions: 50,
        lines: 50,
      },
    },

    // Reporter configuration
    reporters: ['verbose'],

    // Timeout for individual tests (ms)
    testTimeout: 10000,

    // Timeout for hooks (beforeEach, afterEach, etc.)
    hookTimeout: 10000,
  },
})
