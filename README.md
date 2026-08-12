# sdx-mesh-viewer

Angular standalone library + **dev-only viewer shell** for streaming LOD meshes via [3DTilesRendererJS](https://github.com/NASA-AMMOS/3DTilesRendererJS).

## Packages

| Project | Role |
|---------|------|
| `projects/sdx-mesh-viewer` | Publishable library (`SdxMeshViewerComponent`, `SdxMeshTilesService`) |
| `projects/mesh-viewer-dev` | Dev shell (`ng serve`) — not published with the lib |

## Prerequisites

- Node 20+
- Service 3D running locally with a built mesh container (see processing docs)

## Setup

```bash
cd sdx-mesh-viewer
npm install
npm start
```

Open `http://localhost:4200`. Configure API base (default `http://localhost:2546/service3d/v1`), mesh id, and optional bearer token.

## Library usage (product app)

```ts
import { SdxMeshViewerComponent } from 'sdx-mesh-viewer';

@Component({
  standalone: true,
  imports: [SdxMeshViewerComponent],
  template: `
    <sdx-mesh-viewer
      meshId="demo"
      apiBaseUrl="https://your-host/service3d/v1"
      [accessToken]="token"
      [displayBoxBounds]="true"
    />
  `,
})
export class HostComponent {}
```

Or pass a full `tilesetUrl`. Tile OBBs use `DebugTilesPlugin` (`displayBoxBounds` / `displayParentBounds`).

**Tile budget inputs** (live-updatable): `errorTarget`, `maxDepth`, `cacheMaxTiles`, `cacheMinTiles`, `cacheMaxMb`, `maxDownloadJobs`, `maxParseJobs`. Higher `errorTarget` and lower cache limits load fewer tiles.

## Build library

```bash
npm run build:lib
```

Output: `dist/sdx-mesh-viewer`.
