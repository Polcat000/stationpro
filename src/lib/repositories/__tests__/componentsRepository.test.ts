// src/lib/repositories/__tests__/componentsRepository.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { componentsRepository } from '../componentsRepository'
import type { LaserLineProfiler, AreascanCamera } from '@/lib/schemas/component'
import { _resetDBConnection } from '@/lib/storage/indexedDBAdapter'
import { _resetMigrationState } from '@/lib/storage/migrateLegacyStorage'

describe('componentsRepository', () => {
  const testComponent1: LaserLineProfiler = {
    componentId: 'profiler-001',
    componentType: 'LaserLineProfiler',
    Manufacturer: 'LMI',
    Model: 'Gocator 2330',
    NearFieldLateralFOV_mm: 32,
    MidFieldLateralFOV_mm: 55,
    FarFieldLateralFOV_mm: 88,
    StandoffDistance_mm: 125,
    MeasurementRange_mm: 60,
    PointsPerProfile: 1280,
    LateralResolution_um: 27,
    VerticalResolution_um: 12,
    MaxScanRate_kHz: 5,
  }

  const testComponent2: AreascanCamera = {
    componentId: 'areascan-001',
    componentType: 'AreascanCamera',
    Manufacturer: 'Basler',
    Model: 'a2A5320-23gmPRO',
    ResolutionHorizontal_px: 5320,
    ResolutionVertical_px: 4600,
    PixelSizeHorizontal_um: 2.33,
    PixelSizeVertical_um: 2.33,
    FrameRate_fps: 23,
    LensMount: 'C-Mount',
  }

  const testComponent3: LaserLineProfiler = {
    ...testComponent1,
    componentId: 'profiler-002',
    Model: 'Gocator 2380',
  }

  beforeEach(async () => {
    _resetMigrationState()
    _resetDBConnection()
    localStorage.clear()
    await componentsRepository.clear()
  })

  afterEach(() => {
    _resetMigrationState()
    _resetDBConnection()
  })

  describe('getAll', () => {
    it('returns empty array when no components stored', async () => {
      const components = await componentsRepository.getAll()
      expect(components).toEqual([])
    })

    it('returns all stored components', async () => {
      await componentsRepository.save(testComponent1)
      await componentsRepository.save(testComponent2)

      const components = await componentsRepository.getAll()

      expect(components).toHaveLength(2)
      expect(components.map((c) => c.componentId)).toContain('profiler-001')
      expect(components.map((c) => c.componentId)).toContain('areascan-001')
    })
  })

  describe('getById', () => {
    it('returns null when component not found', async () => {
      const component = await componentsRepository.getById('NONEXISTENT')
      expect(component).toBeNull()
    })

    it('returns matching component', async () => {
      await componentsRepository.save(testComponent1)
      await componentsRepository.save(testComponent2)

      const component = await componentsRepository.getById('profiler-001')

      expect(component).not.toBeNull()
      expect(component?.componentId).toBe('profiler-001')
      expect((component as LaserLineProfiler).Model).toBe('Gocator 2330')
    })
  })

  describe('getByIds', () => {
    it('returns empty array when none found', async () => {
      const components = await componentsRepository.getByIds(['NONEXISTENT'])
      expect(components).toEqual([])
    })

    it('returns matching components', async () => {
      await componentsRepository.save(testComponent1)
      await componentsRepository.save(testComponent2)
      await componentsRepository.save(testComponent3)

      const components = await componentsRepository.getByIds(['profiler-001', 'profiler-002'])

      expect(components).toHaveLength(2)
      expect(components.map((c) => c.componentId)).toContain('profiler-001')
      expect(components.map((c) => c.componentId)).toContain('profiler-002')
    })

    it('returns only found components when some not found', async () => {
      await componentsRepository.save(testComponent1)

      const components = await componentsRepository.getByIds(['profiler-001', 'NONEXISTENT'])

      expect(components).toHaveLength(1)
      expect(components[0].componentId).toBe('profiler-001')
    })
  })

  describe('save', () => {
    it('saves a new component', async () => {
      const saved = await componentsRepository.save(testComponent1)

      expect(saved.componentId).toBe('profiler-001')

      const retrieved = await componentsRepository.getById('profiler-001')
      expect(retrieved).not.toBeNull()
    })

    it('overwrites existing component with same componentId', async () => {
      await componentsRepository.save(testComponent1)

      const updated: LaserLineProfiler = { ...testComponent1, MaxScanRate_kHz: 999 }
      await componentsRepository.save(updated)

      const components = await componentsRepository.getAll()
      expect(components).toHaveLength(1)
      expect((components[0] as LaserLineProfiler).MaxScanRate_kHz).toBe(999)
    })
  })

  describe('saveMany', () => {
    it('saves multiple new components', async () => {
      const saved = await componentsRepository.saveMany([testComponent1, testComponent2])

      expect(saved).toHaveLength(2)

      const all = await componentsRepository.getAll()
      expect(all).toHaveLength(2)
    })

    it('skips components that already exist', async () => {
      await componentsRepository.save(testComponent1)

      const saved = await componentsRepository.saveMany([testComponent1, testComponent2])

      // Only testComponent2 should be saved (testComponent1 already exists)
      expect(saved).toHaveLength(1)
      expect(saved[0].componentId).toBe('areascan-001')

      const all = await componentsRepository.getAll()
      expect(all).toHaveLength(2)
    })

    it('returns empty array when all components already exist', async () => {
      await componentsRepository.save(testComponent1)
      await componentsRepository.save(testComponent2)

      const saved = await componentsRepository.saveMany([testComponent1, testComponent2])

      expect(saved).toEqual([])
    })

    it('handles empty input', async () => {
      const saved = await componentsRepository.saveMany([])
      expect(saved).toEqual([])
    })
  })

  describe('upsertMany', () => {
    it('creates new components', async () => {
      const result = await componentsRepository.upsertMany([testComponent1, testComponent2])

      expect(result.created).toHaveLength(2)
      expect(result.updated).toHaveLength(0)

      const all = await componentsRepository.getAll()
      expect(all).toHaveLength(2)
    })

    it('updates existing components', async () => {
      await componentsRepository.save(testComponent1)

      const updated: LaserLineProfiler = { ...testComponent1, MaxScanRate_kHz: 999 }
      const result = await componentsRepository.upsertMany([updated])

      expect(result.created).toHaveLength(0)
      expect(result.updated).toHaveLength(1)

      const retrieved = await componentsRepository.getById('profiler-001')
      expect((retrieved as LaserLineProfiler)?.MaxScanRate_kHz).toBe(999)
    })

    it('handles mix of new and existing components', async () => {
      await componentsRepository.save(testComponent1)

      const updated1: LaserLineProfiler = { ...testComponent1, MaxScanRate_kHz: 999 }
      const result = await componentsRepository.upsertMany([updated1, testComponent2])

      expect(result.created).toHaveLength(1)
      expect(result.created[0].componentId).toBe('areascan-001')
      expect(result.updated).toHaveLength(1)
      expect(result.updated[0].componentId).toBe('profiler-001')
    })

    it('handles empty input', async () => {
      const result = await componentsRepository.upsertMany([])
      expect(result.created).toEqual([])
      expect(result.updated).toEqual([])
    })
  })

  describe('delete', () => {
    it('returns false when component not found', async () => {
      const deleted = await componentsRepository.delete('NONEXISTENT')
      expect(deleted).toBe(false)
    })

    it('deletes existing component', async () => {
      await componentsRepository.save(testComponent1)
      await componentsRepository.save(testComponent2)

      const deleted = await componentsRepository.delete('profiler-001')

      expect(deleted).toBe(true)

      const components = await componentsRepository.getAll()
      expect(components).toHaveLength(1)
      expect(components[0].componentId).toBe('areascan-001')
    })
  })

  describe('clear', () => {
    it('removes all components', async () => {
      await componentsRepository.save(testComponent1)
      await componentsRepository.save(testComponent2)

      await componentsRepository.clear()

      const components = await componentsRepository.getAll()
      expect(components).toEqual([])
    })
  })

  describe('findExistingIds', () => {
    it('returns empty array when no matches', async () => {
      const existing = await componentsRepository.findExistingIds(['NONEXISTENT'])
      expect(existing).toEqual([])
    })

    it('returns matching componentIds', async () => {
      await componentsRepository.save(testComponent1)
      await componentsRepository.save(testComponent2)

      const existing = await componentsRepository.findExistingIds(['profiler-001', 'profiler-003', 'areascan-001'])

      expect(existing).toHaveLength(2)
      expect(existing).toContain('profiler-001')
      expect(existing).toContain('areascan-001')
    })

    it('handles empty input', async () => {
      const existing = await componentsRepository.findExistingIds([])
      expect(existing).toEqual([])
    })
  })
})
