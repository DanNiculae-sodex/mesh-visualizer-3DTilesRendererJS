# sdx-mesh-viewer

Angular standalone library + **dev-only viewer shell** for streaming LOD meshes, typed IFC, and DXF linework 3D Tiles via [3DTilesRendererJS](https://github.com/NASA-AMMOS/3DTilesRendererJS). Mesh, IFC, and linework share one viewport, camera, and renderer.

## Packages

| Project | Role |
|---------|------|
| `projects/sdx-mesh-viewer` | Publishable library (`SdxMeshViewerComponent`, `SdxMeshTilesService`) |
| `projects/mesh-viewer-dev` | Dev shell (`ng serve`) — not published with the lib |

## Prerequisites

- Node 20+
- Service 3D running with a built mesh, IFC, and/or linework container (see processing docs)

## Setup

```bash
cd sdx-mesh-viewer
npm install
npm start
```

Open `http://localhost:4200`. Configure API base (default `http://localhost:2546/service3d/v1`), **Mesh id**, **IFC id**, **Linework id**, and optional bearer token. Leave an id empty to skip that layer.

## Library usage (product app)

```ts
import { SdxMeshViewerComponent } from 'sdx-mesh-viewer';

@Component({
  standalone: true,
  imports: [SdxMeshViewerComponent],
  template: `
    <sdx-mesh-viewer
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

Or pass full URLs with `tilesetUrl` (mesh), `ifcTilesetUrl` (IFC), and `lineworkTilesetUrl`.

Expected Service 3D paths:

- Mesh: `{apiBaseUrl}/mesh/simple/{meshId}/tileset.json`
- IFC: `{apiBaseUrl}/ifc/simple/{ifcId}/tileset.json` and `{apiBaseUrl}/ifc/simple/{ifcId}/manifest`
- Linework: `{apiBaseUrl}/linework/simple/{lineworkId}/tileset.json` and `{apiBaseUrl}/linework/simple/{lineworkId}/manifest`

An unfiltered IFC tileset request has no `types=` query, so each tile GLB contains every component.
IFC product visibility and hover highlight update a GPU texture and do not refetch tiles. Linework layer checkboxes refetch the tileset with `layers=`. Tile OBBs use `DebugTilesPlugin` (`displayBoxBounds` / `displayParentBounds`) on all layers.

The viewer treats tileset space as **origin-relative ENH, Z-up** (X east, Y north, Z height) — the same local frame as cube/Potree. Vertices and `boundingVolume.box` are already in that frame; the client does not remap axes or add `mesh.json.origin`. Camera and orbit use `+Z` as up. The camera frames the union of loaded mesh, IFC, and linework bounds.

**Tile budget inputs** (live-updatable, shared by all layers): `errorTarget`, `maxDepth`, `cacheMaxTiles`, `cacheMinTiles`, `cacheMaxMb`, `maxDownloadJobs`, `maxParseJobs`. Higher `errorTarget` and lower cache limits load fewer tiles.

## Build library

```bash
npm run build:lib
```

Output: `dist/sdx-mesh-viewer`.
