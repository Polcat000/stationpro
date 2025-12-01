import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { QueryClient } from '@tanstack/react-query'
import { loadSampleData } from '../sampleData'

// Sample test data matching data-schemas.md
const mockParts = [
  {
    PartCallout: 'TEST-PART-001',
    PartWidth_mm: 10,
    PartHeight_mm: 5,
    PartLength_mm: 20,
    SmallestLateralFeature_um: 100,
    InspectionZones: [
      {
        ZoneID: 'zone-1',
        Name: 'Top Zone',
        Face: 'Top',
        ZoneDepth_mm: 1,
        ZoneOffset_mm: 0.5,
        RequiredCoverage_pct: 100,
        MinPixelsPerFeature: 3,
      },
    ],
  },
]

const mockComponents = [
  {
    componentId: 'llp-test-001',
    componentType: 'LaserLineProfiler',
    Manufacturer: 'TestCorp',
    Model: 'LP-1000',
    NearFieldLateralFOV_mm: 50,
    MidFieldLateralFOV_mm: 100,
    FarFieldLateralFOV_mm: 150,
    StandoffDistance_mm: 200,
    MeasurementRange_mm: 100,
    PointsPerProfile: 1280,
    LateralResolution_um: 78,
    VerticalResolution_um: 5,
    MaxScanRate_kHz: 10,
  },
]

describe('loadSampleData', () => {
  let queryClient: QueryClient
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    vi.restoreAllMocks()
  })

  it('fetches both JSON files', async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.includes('sample-parts.json')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockParts),
        })
      }
      if (url.includes('sample-components.json')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockComponents),
        })
      }
      return Promise.reject(new Error('Unknown URL'))
    })

    globalThis.fetch = fetchMock as unknown as typeof fetch

    await loadSampleData(queryClient)

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock).toHaveBeenCalledWith('/data/sample-parts.json')
    expect(fetchMock).toHaveBeenCalledWith('/data/sample-components.json')
  })

  it('sets parts data in query cache', async () => {
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('sample-parts.json')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockParts),
        })
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockComponents),
      })
    }) as unknown as typeof fetch

    await loadSampleData(queryClient)

    const parts = queryClient.getQueryData(['parts'])
    expect(parts).toEqual(mockParts)
  })

  it('sets components data in query cache', async () => {
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('sample-parts.json')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockParts),
        })
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockComponents),
      })
    }) as unknown as typeof fetch

    await loadSampleData(queryClient)

    const components = queryClient.getQueryData(['components'])
    expect(components).toEqual(mockComponents)
  })

  it('throws on parts fetch error', async () => {
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('sample-parts.json')) {
        return Promise.resolve({
          ok: false,
          status: 404,
        })
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockComponents),
      })
    }) as unknown as typeof fetch

    await expect(loadSampleData(queryClient)).rejects.toThrow(
      'Failed to load sample parts: 404'
    )
  })

  it('throws on components fetch error', async () => {
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('sample-parts.json')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockParts),
        })
      }
      return Promise.resolve({
        ok: false,
        status: 500,
      })
    }) as unknown as typeof fetch

    await expect(loadSampleData(queryClient)).rejects.toThrow(
      'Failed to load sample components: 500'
    )
  })
})
