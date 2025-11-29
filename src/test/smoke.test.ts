// src/test/smoke.test.ts
// PURPOSE: Verify test infrastructure is working correctly
// This file should pass immediately after setup - if it fails, something is misconfigured

import { describe, it, expect, beforeEach } from 'vitest'
import {
  createTestPart,
  createTestProfiler,
  resetPartIdCounter,
  resetComponentIdCounter,
} from '@/test/helpers'
import { smallElectronicsPart, midRangeProfiler } from '@/test/fixtures'

describe('Test Infrastructure Smoke Test', () => {
  beforeEach(() => {
    resetPartIdCounter()
    resetComponentIdCounter()
  })

  describe('Factory Functions', () => {
    it('creates a test part with defaults', () => {
      const part = createTestPart()

      expect(part.id).toBe('test-part-1')
      expect(part.callout).toBe('TEST-PART-1')
      expect(part.dimensions.width).toBe(100)
      expect(part.dimensions.height).toBe(50)
      expect(part.dimensions.length).toBe(150)
      expect(part.inspectionZones).toEqual([])
    })

    it('creates a test part with overrides', () => {
      const part = createTestPart({
        callout: 'MY-CUSTOM-PART',
        dimensions: { width: 200, height: 100, length: 300 },
      })

      expect(part.callout).toBe('MY-CUSTOM-PART')
      expect(part.dimensions.width).toBe(200)
    })

    it('creates a test profiler with defaults', () => {
      const profiler = createTestProfiler()

      expect(profiler.type).toBe('LaserLineProfiler')
      expect(profiler.fovRange.min).toBe(25)
      expect(profiler.fovRange.max).toBe(100)
    })

    it('creates a test profiler with overrides', () => {
      const profiler = createTestProfiler({
        manufacturer: 'LMI',
        model: 'Gocator 2330',
      })

      expect(profiler.manufacturer).toBe('LMI')
      expect(profiler.model).toBe('Gocator 2330')
    })
  })

  describe('Fixtures', () => {
    it('loads small electronics part fixture', () => {
      expect(smallElectronicsPart.id).toBe('fixture-small-electronics')
      expect(smallElectronicsPart.callout).toBe('USB-C-001')
      expect(smallElectronicsPart.smallestFeature).toBe(0.05)
      expect(smallElectronicsPart.inspectionZones).toHaveLength(1)
    })

    it('loads mid-range profiler fixture', () => {
      expect(midRangeProfiler.id).toBe('fixture-profiler-mid')
      expect(midRangeProfiler.manufacturer).toBe('LMI')
      expect(midRangeProfiler.fovRange.min).toBe(32)
    })
  })

  describe('Test Environment', () => {
    it('has access to vitest globals', () => {
      // If this runs, globals are working
      expect(typeof describe).toBe('function')
      expect(typeof it).toBe('function')
      expect(typeof expect).toBe('function')
    })

    it('has access to jest-dom matchers', () => {
      // Create a simple DOM element to test matchers
      const div = document.createElement('div')
      div.textContent = 'Hello'
      document.body.appendChild(div)

      expect(div).toBeInTheDocument()
      expect(div).toHaveTextContent('Hello')

      document.body.removeChild(div)
    })
  })
})
