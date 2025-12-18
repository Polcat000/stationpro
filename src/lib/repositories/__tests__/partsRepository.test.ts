// src/lib/repositories/__tests__/partsRepository.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { partsRepository } from '../partsRepository'
import type { Part } from '@/lib/schemas/part'
import { _resetDBConnection } from '@/lib/storage/indexedDBAdapter'
import { _resetMigrationState } from '@/lib/storage/migrateLegacyStorage'

describe('partsRepository', () => {
  const testPart1: Part = {
    PartCallout: 'TEST-001',
    PartWidth_mm: 100,
    PartHeight_mm: 50,
    PartLength_mm: 150,
    SmallestLateralFeature_um: 100,
    InspectionZones: [
      {
        ZoneID: 'zone-1',
        Name: 'Top Surface',
        Face: 'Top',
        ZoneDepth_mm: 2,
        ZoneOffset_mm: 0,
        RequiredCoverage_pct: 100,
        MinPixelsPerFeature: 3,
      },
    ],
  }

  const testPart2: Part = {
    ...testPart1,
    PartCallout: 'TEST-002',
    PartWidth_mm: 200,
  }

  const testPart3: Part = {
    ...testPart1,
    PartCallout: 'TEST-003',
    PartWidth_mm: 300,
  }

  beforeEach(async () => {
    _resetMigrationState()
    _resetDBConnection()
    localStorage.clear()
    await partsRepository.clear()
  })

  afterEach(() => {
    _resetMigrationState()
    _resetDBConnection()
  })

  describe('getAll', () => {
    it('returns empty array when no parts stored', async () => {
      const parts = await partsRepository.getAll()
      expect(parts).toEqual([])
    })

    it('returns all stored parts', async () => {
      await partsRepository.save(testPart1)
      await partsRepository.save(testPart2)

      const parts = await partsRepository.getAll()

      expect(parts).toHaveLength(2)
      expect(parts.map((p) => p.PartCallout)).toContain('TEST-001')
      expect(parts.map((p) => p.PartCallout)).toContain('TEST-002')
    })
  })

  describe('getByCallout', () => {
    it('returns null when part not found', async () => {
      const part = await partsRepository.getByCallout('NONEXISTENT')
      expect(part).toBeNull()
    })

    it('returns matching part', async () => {
      await partsRepository.save(testPart1)
      await partsRepository.save(testPart2)

      const part = await partsRepository.getByCallout('TEST-001')

      expect(part).not.toBeNull()
      expect(part?.PartCallout).toBe('TEST-001')
      expect(part?.PartWidth_mm).toBe(100)
    })
  })

  describe('getByCallouts', () => {
    it('returns empty array when none found', async () => {
      const parts = await partsRepository.getByCallouts(['NONEXISTENT'])
      expect(parts).toEqual([])
    })

    it('returns matching parts', async () => {
      await partsRepository.save(testPart1)
      await partsRepository.save(testPart2)
      await partsRepository.save(testPart3)

      const parts = await partsRepository.getByCallouts(['TEST-001', 'TEST-003'])

      expect(parts).toHaveLength(2)
      expect(parts.map((p) => p.PartCallout)).toContain('TEST-001')
      expect(parts.map((p) => p.PartCallout)).toContain('TEST-003')
    })

    it('returns only found parts when some not found', async () => {
      await partsRepository.save(testPart1)

      const parts = await partsRepository.getByCallouts(['TEST-001', 'NONEXISTENT'])

      expect(parts).toHaveLength(1)
      expect(parts[0].PartCallout).toBe('TEST-001')
    })
  })

  describe('save', () => {
    it('saves a new part', async () => {
      const saved = await partsRepository.save(testPart1)

      expect(saved.PartCallout).toBe('TEST-001')

      const retrieved = await partsRepository.getByCallout('TEST-001')
      expect(retrieved).not.toBeNull()
    })

    it('overwrites existing part with same callout', async () => {
      await partsRepository.save(testPart1)

      const updated = { ...testPart1, PartWidth_mm: 999 }
      await partsRepository.save(updated)

      const parts = await partsRepository.getAll()
      expect(parts).toHaveLength(1)
      expect(parts[0].PartWidth_mm).toBe(999)
    })
  })

  describe('saveMany', () => {
    it('saves multiple new parts', async () => {
      const saved = await partsRepository.saveMany([testPart1, testPart2])

      expect(saved).toHaveLength(2)

      const all = await partsRepository.getAll()
      expect(all).toHaveLength(2)
    })

    it('skips parts that already exist', async () => {
      await partsRepository.save(testPart1)

      const saved = await partsRepository.saveMany([testPart1, testPart2])

      // Only testPart2 should be saved (testPart1 already exists)
      expect(saved).toHaveLength(1)
      expect(saved[0].PartCallout).toBe('TEST-002')

      const all = await partsRepository.getAll()
      expect(all).toHaveLength(2)
    })

    it('returns empty array when all parts already exist', async () => {
      await partsRepository.save(testPart1)
      await partsRepository.save(testPart2)

      const saved = await partsRepository.saveMany([testPart1, testPart2])

      expect(saved).toEqual([])
    })

    it('handles empty input', async () => {
      const saved = await partsRepository.saveMany([])
      expect(saved).toEqual([])
    })
  })

  describe('upsertMany', () => {
    it('creates new parts', async () => {
      const result = await partsRepository.upsertMany([testPart1, testPart2])

      expect(result.created).toHaveLength(2)
      expect(result.updated).toHaveLength(0)

      const all = await partsRepository.getAll()
      expect(all).toHaveLength(2)
    })

    it('updates existing parts', async () => {
      await partsRepository.save(testPart1)

      const updated = { ...testPart1, PartWidth_mm: 999 }
      const result = await partsRepository.upsertMany([updated])

      expect(result.created).toHaveLength(0)
      expect(result.updated).toHaveLength(1)

      const retrieved = await partsRepository.getByCallout('TEST-001')
      expect(retrieved?.PartWidth_mm).toBe(999)
    })

    it('handles mix of new and existing parts', async () => {
      await partsRepository.save(testPart1)

      const updated1 = { ...testPart1, PartWidth_mm: 999 }
      const result = await partsRepository.upsertMany([updated1, testPart2])

      expect(result.created).toHaveLength(1)
      expect(result.created[0].PartCallout).toBe('TEST-002')
      expect(result.updated).toHaveLength(1)
      expect(result.updated[0].PartCallout).toBe('TEST-001')
    })

    it('handles empty input', async () => {
      const result = await partsRepository.upsertMany([])
      expect(result.created).toEqual([])
      expect(result.updated).toEqual([])
    })
  })

  describe('delete', () => {
    it('returns false when part not found', async () => {
      const deleted = await partsRepository.delete('NONEXISTENT')
      expect(deleted).toBe(false)
    })

    it('deletes existing part', async () => {
      await partsRepository.save(testPart1)
      await partsRepository.save(testPart2)

      const deleted = await partsRepository.delete('TEST-001')

      expect(deleted).toBe(true)

      const parts = await partsRepository.getAll()
      expect(parts).toHaveLength(1)
      expect(parts[0].PartCallout).toBe('TEST-002')
    })
  })

  describe('clear', () => {
    it('removes all parts', async () => {
      await partsRepository.save(testPart1)
      await partsRepository.save(testPart2)

      await partsRepository.clear()

      const parts = await partsRepository.getAll()
      expect(parts).toEqual([])
    })
  })

  describe('findExistingCallouts', () => {
    it('returns empty array when no matches', async () => {
      const existing = await partsRepository.findExistingCallouts(['NONEXISTENT'])
      expect(existing).toEqual([])
    })

    it('returns matching callouts', async () => {
      await partsRepository.save(testPart1)
      await partsRepository.save(testPart2)

      const existing = await partsRepository.findExistingCallouts(['TEST-001', 'TEST-003', 'TEST-002'])

      expect(existing).toHaveLength(2)
      expect(existing).toContain('TEST-001')
      expect(existing).toContain('TEST-002')
    })

    it('handles empty input', async () => {
      const existing = await partsRepository.findExistingCallouts([])
      expect(existing).toEqual([])
    })
  })

  describe('large dataset storage (IndexedDB)', () => {
    it('handles 1000+ parts without error', async () => {
      const largeParts: Part[] = Array.from({ length: 1000 }, (_, i) => ({
        PartCallout: `PART-${String(i).padStart(4, '0')}`,
        PartWidth_mm: 100 + i,
        PartHeight_mm: 50,
        PartLength_mm: 150,
        SmallestLateralFeature_um: 100,
        InspectionZones: [
          {
            ZoneID: `zone-${i}`,
            Name: `Zone ${i}`,
            Face: 'Top',
            ZoneDepth_mm: 2,
            ZoneOffset_mm: 0,
            RequiredCoverage_pct: 100,
            MinPixelsPerFeature: 3,
          },
        ],
      }))

      const result = await partsRepository.upsertMany(largeParts)

      expect(result.created).toHaveLength(1000)

      const all = await partsRepository.getAll()
      expect(all).toHaveLength(1000)
      expect(all[0].PartCallout).toBe('PART-0000')
      expect(all[999].PartCallout).toBe('PART-0999')
    })
  })
})
