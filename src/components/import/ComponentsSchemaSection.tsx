import { CopyButton } from '@/components/ui/CopyButton'

export const COMPONENTS_SCHEMA_EXAMPLE = `{
  "Components": [
    {
      "componentType": "LaserLineProfiler",
      "componentId": "gocator-2512-001",
      "Manufacturer": "LMI Technologies",
      "Model": "Gocator 2512",
      "NearFieldLateralFOV_mm": 140,
      "MidFieldLateralFOV_mm": 210,
      "FarFieldLateralFOV_mm": 280,
      "StandoffDistance_mm": 370,
      "MeasurementRange_mm": 260,
      "PointsPerProfile": 3200,
      "LateralResolution_um": 65,
      "VerticalResolution_um": 12,
      "MaxScanRate_kHz": 5
    },
    {
      "componentType": "AreascanCamera",
      "componentId": "basler-a2a2590",
      "Manufacturer": "Basler",
      "Model": "a2A2590-22gcPRO",
      "ResolutionHorizontal_px": 2592,
      "ResolutionVertical_px": 1944,
      "PixelSizeHorizontal_um": 4.8,
      "PixelSizeVertical_um": 4.8,
      "FrameRate_fps": 22,
      "LensMount": "C"
    },
    {
      "componentType": "LinescanCamera",
      "componentId": "basler-rala4096",
      "Manufacturer": "Basler",
      "Model": "raL4096-24gm",
      "ResolutionHorizontal_px": 4096,
      "ResolutionVertical_px": 1,
      "PixelSizeHorizontal_um": 7.0,
      "PixelSizeVertical_um": 7.0,
      "LineRate_kHz": 24,
      "LensMount": "F"
    },
    {
      "componentType": "Lens",
      "componentId": "tc-lens-025x",
      "Manufacturer": "Opto Engineering",
      "Model": "TC23036",
      "LensType": "Telecentric",
      "Mount": "C",
      "MaxSensorSize_mm": 11.0,
      "ApertureMin_fnum": 8.0,
      "ApertureMax_fnum": 11.0,
      "Magnification": 0.243,
      "WorkingDistance_mm": 103.5,
      "FieldDepth_mm": 3.3
    },
    {
      "componentType": "Lens",
      "componentId": "ffl-lens-25mm",
      "Manufacturer": "Edmund Optics",
      "Model": "58-000",
      "LensType": "FixedFocalLength",
      "Mount": "C",
      "MaxSensorSize_mm": 11.0,
      "ApertureMin_fnum": 1.4,
      "ApertureMax_fnum": 16.0,
      "FocalLength_mm": 25.0,
      "WorkingDistanceMin_mm": 200.0
    },
    {
      "componentType": "SnapshotSensor",
      "componentId": "gocator-3504",
      "Manufacturer": "LMI Technologies",
      "Model": "Gocator 3504",
      "FOV_X_mm": 93.0,
      "FOV_Y_mm": 74.0,
      "MeasurementRange_mm": 75.0,
      "WorkingDistance_mm": 500.0,
      "XYDataInterval_um": 30.0
    }
  ]
}`

const COMPONENT_TYPES = [
  {
    type: 'LaserLineProfiler',
    description:
      'Self-contained 3D profiler that scans a laser line across the part. Provides lateral and depth resolution.',
  },
  {
    type: 'AreascanCamera',
    description:
      'Area scan camera body (requires lens pairing). Captures 2D images for inspection.',
  },
  {
    type: 'LinescanCamera',
    description:
      'Line scan camera body (requires lens pairing). Captures continuous line images during motion.',
  },
  {
    type: 'Lens',
    description:
      'Optical lens for cameras. Can be Telecentric (fixed magnification) or FixedFocalLength (variable magnification).',
  },
  {
    type: 'SnapshotSensor',
    description:
      'Self-contained sensor capturing both 2D appearance and 3D depth in a single acquisition.',
  },
]

export function ComponentsSchemaSection() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 text-sm font-medium">Example JSON</h3>
        <div className="relative">
          <CopyButton
            text={COMPONENTS_SCHEMA_EXAMPLE}
            className="absolute right-2 top-2 z-10"
          />
          <pre className="max-h-96 overflow-auto rounded-lg bg-muted p-4 text-sm">
            <code className="font-mono text-foreground">
              {COMPONENTS_SCHEMA_EXAMPLE}
            </code>
          </pre>
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium">Component Types</h3>
        <p className="mb-3 text-sm text-muted-foreground">
          Use the <code className="rounded bg-muted px-1">componentType</code>{' '}
          field to specify which type of component. Each type has its own
          required fields.
        </p>
        <div className="space-y-3">
          {COMPONENT_TYPES.map((comp) => (
            <div
              key={comp.type}
              className="rounded-lg border bg-card p-3 text-card-foreground"
            >
              <div className="font-mono text-sm font-medium">{comp.type}</div>
              <div className="mt-1 text-sm text-muted-foreground">
                {comp.description}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium">Base Fields (All Components)</h3>
        <div className="rounded-lg border bg-card p-3 text-sm">
          <ul className="space-y-1 text-muted-foreground">
            <li>
              <code className="font-mono">componentType</code> - Discriminator
              field (required)
            </li>
            <li>
              <code className="font-mono">componentId</code> - Unique identifier
              (required)
            </li>
            <li>
              <code className="font-mono">Manufacturer</code> - Vendor/brand
              name (required)
            </li>
            <li>
              <code className="font-mono">Model</code> - Model identifier
              (required)
            </li>
            <li>
              <code className="font-mono">PartNumber</code> - SKU/part number
              (optional)
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
