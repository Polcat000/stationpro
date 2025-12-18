// src/lib/storage/__tests__/indexedDBAdapter.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { indexedDBAdapter, _resetDBConnection } from '../indexedDBAdapter'

describe('indexedDBAdapter', () => {
  beforeEach(() => {
    _resetDBConnection()
  })

  afterEach(async () => {
    // Clean up all keys after each test
    const keys = await indexedDBAdapter.keys()
    for (const key of keys) {
      await indexedDBAdapter.delete(key)
    }
    _resetDBConnection()
  })

  describe('get', () => {
    it('returns null for missing key', async () => {
      const value = await indexedDBAdapter.get('nonexistent')
      expect(value).toBeNull()
    })

    it('retrieves stored value with correct type', async () => {
      await indexedDBAdapter.set('test-key', { foo: 'bar', count: 42 })

      const value = await indexedDBAdapter.get<{ foo: string; count: number }>('test-key')

      expect(value).toEqual({ foo: 'bar', count: 42 })
    })
  })

  describe('set', () => {
    it('stores a string value', async () => {
      await indexedDBAdapter.set('string-key', 'hello world')

      const value = await indexedDBAdapter.get<string>('string-key')
      expect(value).toBe('hello world')
    })

    it('stores an array value', async () => {
      const array = [1, 2, 3, 4, 5]
      await indexedDBAdapter.set('array-key', array)

      const value = await indexedDBAdapter.get<number[]>('array-key')
      expect(value).toEqual([1, 2, 3, 4, 5])
    })

    it('stores a complex object', async () => {
      const obj = {
        id: '123',
        name: 'Test',
        nested: { a: 1, b: [1, 2, 3] },
        date: '2024-01-01',
      }
      await indexedDBAdapter.set('object-key', obj)

      const value = await indexedDBAdapter.get<typeof obj>('object-key')
      expect(value).toEqual(obj)
    })

    it('overwrites existing value', async () => {
      await indexedDBAdapter.set('key', 'first')
      await indexedDBAdapter.set('key', 'second')

      const value = await indexedDBAdapter.get<string>('key')
      expect(value).toBe('second')
    })
  })

  describe('delete', () => {
    it('removes stored value', async () => {
      await indexedDBAdapter.set('to-delete', 'value')
      await indexedDBAdapter.delete('to-delete')

      const value = await indexedDBAdapter.get('to-delete')
      expect(value).toBeNull()
    })

    it('does not throw for nonexistent key', async () => {
      await expect(indexedDBAdapter.delete('nonexistent')).resolves.toBeUndefined()
    })
  })

  describe('keys', () => {
    it('returns empty array when no keys stored', async () => {
      const keys = await indexedDBAdapter.keys()
      expect(keys).toEqual([])
    })

    it('returns all stored keys', async () => {
      await indexedDBAdapter.set('key1', 'value1')
      await indexedDBAdapter.set('key2', 'value2')
      await indexedDBAdapter.set('key3', 'value3')

      const keys = await indexedDBAdapter.keys()

      expect(keys).toHaveLength(3)
      expect(keys).toContain('key1')
      expect(keys).toContain('key2')
      expect(keys).toContain('key3')
    })
  })

  describe('large data storage', () => {
    it('stores and retrieves large array (1000+ items)', async () => {
      const largeArray = Array.from({ length: 1000 }, (_, i) => ({
        id: `item-${i}`,
        data: `data-${i}`.repeat(100),
      }))

      await indexedDBAdapter.set('large-array', largeArray)

      const retrieved = await indexedDBAdapter.get<typeof largeArray>('large-array')

      expect(retrieved).toHaveLength(1000)
      expect(retrieved?.[0].id).toBe('item-0')
      expect(retrieved?.[999].id).toBe('item-999')
    })

    it('stores data exceeding localStorage limits (~5MB)', async () => {
      // Create ~6MB of data (exceeds typical localStorage 5MB limit)
      const largeData = 'x'.repeat(6 * 1024 * 1024)

      await indexedDBAdapter.set('large-data', largeData)

      const retrieved = await indexedDBAdapter.get<string>('large-data')

      expect(retrieved).toHaveLength(6 * 1024 * 1024)
    })
  })
})
