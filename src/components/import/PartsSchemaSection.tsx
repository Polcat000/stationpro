import { CopyButton } from '@/components/ui/CopyButton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export const PARTS_SCHEMA_EXAMPLE = `[
  {
    "PartCallout": "CONN-USB-C-001",
    "PartSeries": "USB-C Connectors",
    "PartWidth_mm": 8.94,
    "PartHeight_mm": 3.26,
    "PartLength_mm": 7.35,
    "SmallestLateralFeature_um": 150,
    "SmallestDepthFeature_um": 50,
    "InspectionZones": [
      {
        "ZoneID": "zone-top-1",
        "Name": "Top Surface Pins",
        "Face": "Top",
        "ZoneDepth_mm": 0.5,
        "ZoneOffset_mm": 0.25,
        "SmallestLateralFeature_um": 100,
        "RequiredCoverage_pct": 100,
        "MinPixelsPerFeature": 3
      }
    ]
  }
]`

const PART_FIELDS = [
  {
    field: 'PartCallout',
    type: 'string',
    required: true,
    description: 'Unique identifier for the part',
  },
  {
    field: 'PartSeries',
    type: 'string',
    required: false,
    description: 'Product series for grouping',
  },
  {
    field: 'PartWidth_mm',
    type: 'number',
    required: true,
    description: 'X-axis dimension in millimeters',
  },
  {
    field: 'PartHeight_mm',
    type: 'number',
    required: true,
    description: 'Y-axis dimension in millimeters',
  },
  {
    field: 'PartLength_mm',
    type: 'number',
    required: true,
    description: 'Z-axis (scan direction) dimension in millimeters',
  },
  {
    field: 'SmallestLateralFeature_um',
    type: 'number',
    required: true,
    description: 'Smallest X/Y feature to detect in micrometers',
  },
  {
    field: 'SmallestDepthFeature_um',
    type: 'number',
    required: false,
    description: 'Smallest Z feature to detect in micrometers',
  },
  {
    field: 'InspectionZones',
    type: 'array',
    required: true,
    description: 'At least one inspection zone required',
  },
]

const INSPECTION_ZONE_FIELDS = [
  {
    field: 'ZoneID',
    type: 'string',
    required: true,
    description: 'Unique zone identifier',
  },
  {
    field: 'Name',
    type: 'string',
    required: true,
    description: 'Human-readable zone name',
  },
  {
    field: 'Face',
    type: 'enum',
    required: true,
    description: 'One of: Top, Bottom, Front, Back, Left, Right',
  },
  {
    field: 'ZoneDepth_mm',
    type: 'number',
    required: true,
    description: 'Zone thickness in millimeters',
  },
  {
    field: 'ZoneOffset_mm',
    type: 'number',
    required: true,
    description: 'Distance from face to zone center plane',
  },
  {
    field: 'SmallestLateralFeature_um',
    type: 'number',
    required: false,
    description: 'Override part default (optional)',
  },
  {
    field: 'SmallestDepthFeature_um',
    type: 'number',
    required: false,
    description: 'Override part default (optional)',
  },
  {
    field: 'RequiredCoverage_pct',
    type: 'number',
    required: false,
    description: 'Coverage requirement 0-100 (default 100)',
  },
  {
    field: 'MinPixelsPerFeature',
    type: 'number',
    required: false,
    description: 'Pixels per feature (default 3)',
  },
]

export function PartsSchemaSection() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 text-sm font-medium">Example JSON</h3>
        <div className="relative">
          <CopyButton
            text={PARTS_SCHEMA_EXAMPLE}
            className="absolute right-2 top-2 z-10"
          />
          <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-sm">
            <code className="font-mono text-foreground">
              {PARTS_SCHEMA_EXAMPLE}
            </code>
          </pre>
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium">Part Fields</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Field</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Required</TableHead>
              <TableHead>Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {PART_FIELDS.map((field) => (
              <TableRow key={field.field}>
                <TableCell className="font-mono text-xs">{field.field}</TableCell>
                <TableCell className="text-muted-foreground">{field.type}</TableCell>
                <TableCell>{field.required ? 'Yes' : 'No'}</TableCell>
                <TableCell className="text-muted-foreground">
                  {field.description}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium">InspectionZone Fields</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Field</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Required</TableHead>
              <TableHead>Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {INSPECTION_ZONE_FIELDS.map((field) => (
              <TableRow key={field.field}>
                <TableCell className="font-mono text-xs">{field.field}</TableCell>
                <TableCell className="text-muted-foreground">{field.type}</TableCell>
                <TableCell>{field.required ? 'Yes' : 'No'}</TableCell>
                <TableCell className="text-muted-foreground">
                  {field.description}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
