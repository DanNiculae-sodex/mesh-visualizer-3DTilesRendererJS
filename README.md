# sdx-mesh-viewer

Angular standalone library + **dev-only viewer shell** for Service 3D. CS25D and CS3D are Potree point clouds. Mesh, typed IFC, and DXF linework are 3D Tiles via [3DTilesRendererJS](https://github.com/NASA-AMMOS/3DTilesRendererJS). All five layers share one viewport, camera, and renderer. Orthophoto tiles are not shown.

## Packages

| Project | Role |
|---------|------|
| `projects/sdx-mesh-viewer` | Publishable library (`SdxMeshViewerComponent`, `SdxMeshTilesService`) |
| `projects/mesh-viewer-dev` | Dev shell (`ng serve`) — not published with the lib |

## Prerequisites

- Node 20+
- Service 3D running with a CS25D, CS3D, mesh, IFC, and/or linework id (see processing docs)

## Setup

```bash
cd sdx-mesh-viewer
npm install
npm start
```

Open `http://localhost:4200`. Configure API base (default `http://localhost:2546/service3d/v1`), **Project id** (mesh, IFC, and linework), **CS25D id**, **CS3D id**, **Mesh id**, **IFC id**, **Linework id**, and optional bearer token. Leave an id empty to skip that layer.

## Library usage (product app)

```ts
import { SdxMeshViewerComponent } from 'sdx-mesh-viewer';

@Component({
  standalone: true,
  imports: [SdxMeshViewerComponent],
  template: `
    <sdx-mesh-viewer
      projectId="demo-project"
      cs25dId="demo-cs25d"
      cs3dId="demo-cs3d"
      meshId="demo-mesh"
      ifcId="demo-ifc"
      lineworkId="demo-linework"
      apiBaseUrl="https://your-host/service3d/v1"
      [accessToken]="token"
      [displayBoxBounds]="true"
      (productsLoaded)="onIfcProducts($event)"
      (lineworkLayersLoaded)="onLineworkLayers($event)"
    />
  `,
})
export class HostComponent {}
```

Or pass full URLs with `cs25dMetadataUrl`, `cs3dMetadataUrl`, `tilesetUrl` (mesh), `ifcTilesetUrl` (IFC), and `lineworkTilesetUrl`.

Expected Service 3D paths:

- CS25D: `{apiBaseUrl}/cube/simple/{cs25dId}/metadata.json` (plus `hierarchy.bin` and `octree.bin`)
- CS3D: `{apiBaseUrl}/cube-3d/simple/{cs3dId}/metadata.json` (plus `hierarchy.bin` and `octree.bin`)
- Mesh: `{apiBaseUrl}/mesh/simple/{projectId}/{meshId}/tileset.json`
- IFC: `{apiBaseUrl}/ifc/simple/{projectId}/{ifcId}/tileset.json` and `.../manifest`
- Linework: `{apiBaseUrl}/linework/simple/{projectId}/{lineworkId}/tileset.json` and `.../manifest`

An unfiltered IFC tileset request has no `types=` query, so each tile GLB contains every component.
IFC product visibility and hover highlight update a GPU texture and do not refetch tiles. Linework layer checkboxes refetch the tileset with `layers=`. Tile OBBs use `DebugTilesPlugin` (`displayBoxBounds` / `displayParentBounds`) on all layers.

The viewer treats every layer as **origin-relative ENH, Z-up** (X east, Y north, Z height). Mesh vertices and Potree positions are already in that frame; the client does not remap axes or add `mesh.json.origin`. Potree `metadata.offset` is the octree quantization origin, not a scene translation. Camera and orbit use `+Z` as up. The camera frames the union of loaded CS25D, CS3D, mesh, IFC, and linework bounds.

CS25D and CS3D use Potree 2 `DEFAULT` packing (int32 position, uint16 rgb). The same error target and cache limits drive point-cloud refinement: higher `errorTarget` keeps coarser nodes. RGB is the default color mode from `octree.bin`.

**Tile budget inputs** (live-updatable, shared by all layers): `errorTarget`, `maxDepth`, `cacheMaxTiles`, `cacheMinTiles`, `cacheMaxMb`, `maxDownloadJobs`, `maxParseJobs`. Higher `errorTarget` and lower cache limits load fewer tiles.

## Build library

```bash
npm run build:lib
```

Output: `dist/sdx-mesh-viewer`.
