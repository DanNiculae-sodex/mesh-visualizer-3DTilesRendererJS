import { Injectable, OnDestroy } from '@angular/core';
import {
  AmbientLight,
  DirectionalLight,
  PerspectiveCamera,
  Scene,
  Sphere,
  WebGLRenderer,
  Color,
} from 'three';
import { TilesRenderer } from '3d-tiles-renderer';
import { DebugTilesPlugin } from '3d-tiles-renderer/plugins';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

/** Controls how aggressively tiles load / stay resident (3DTilesRendererJS knobs). */
export interface SdxTileBudget {
  /** Screen-space error target. Higher = fewer / coarser tiles. Default 6. */
  errorTarget?: number;
  /** Max tileset depth to refine into. Default unlimited (Infinity). */
  maxDepth?: number;
  /** Max tiles kept in the LRU cache (count). Default library value (~800). */
  cacheMaxTiles?: number;
  /** Soft floor for LRU eviction (count). */
  cacheMinTiles?: number;
  /** Max cached GPU/CPU tile bytes. Exposed in MB in the UI. */
  cacheMaxBytes?: number;
  /** Parallel tile downloads. */
  maxDownloadJobs?: number;
  /** Parallel tile parses. */
  maxParseJobs?: number;
}

export interface SdxMeshTilesOptions extends SdxTileBudget {
  tilesetUrl: string;
  accessToken?: string;
  /** Show OBB helpers for visible tiles (DebugTilesPlugin). */
  displayBoxBounds?: boolean;
  /** Also show ancestor bounding volumes. */
  displayParentBounds?: boolean;
}

export interface SdxMeshTilesStats {
  errorTarget: number;
  maxDepth: number;
  downloading: number;
  parsing: number;
  visible: number;
  cached: number;
  cacheMaxTiles: number;
}

const DEFAULT_BUDGET: Required<SdxTileBudget> = {
  errorTarget: 6,
  maxDepth: Number.POSITIVE_INFINITY,
  cacheMaxTiles: 800,
  cacheMinTiles: 600,
  cacheMaxBytes: 0.5 * 2 ** 30, // ~0.5 GiB — library-ish default scale
  maxDownloadJobs: 10,
  maxParseJobs: 1,
};

@Injectable()
export class SdxMeshTilesService implements OnDestroy {
  private tiles: TilesRenderer | null = null;
  private debugPlugin: DebugTilesPlugin | null = null;
  private renderer: WebGLRenderer | null = null;
  private scene: Scene | null = null;
  private camera: PerspectiveCamera | null = null;
  private controls: OrbitControls | null = null;
  private animationId = 0;
  private resizeObserver: ResizeObserver | null = null;

  mount(host: HTMLElement, options: SdxMeshTilesOptions): void {
    this.dispose();

    const width = Math.max(host.clientWidth, 1);
    const height = Math.max(host.clientHeight, 1);

    const scene = new Scene();
    scene.background = new Color(0x1a1d23);

    const camera = new PerspectiveCamera(60, width / height, 0.1, 1e7);
    camera.position.set(0, 40, 80);

    const renderer = new WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    host.innerHTML = '';
    host.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    scene.add(new AmbientLight(0xffffff, 0.7));
    const sun = new DirectionalLight(0xffffff, 0.9);
    sun.position.set(50, 100, 30);
    scene.add(sun);

    const tiles = new TilesRenderer(options.tilesetUrl);
    tiles.setCamera(camera);
    tiles.setResolutionFromRenderer(camera, renderer);

    if (options.accessToken) {
      tiles.fetchOptions = {
        ...tiles.fetchOptions,
        headers: {
          ...(tiles.fetchOptions?.headers || {}),
          Authorization: `Bearer ${options.accessToken}`,
        },
      };
    }

    this.applyBudgetToTiles(tiles, options);

    const debugPlugin = new DebugTilesPlugin({
      displayBoxBounds: options.displayBoxBounds ?? false,
      displayParentBounds: options.displayParentBounds ?? false,
      enabled: true,
    });
    tiles.registerPlugin(debugPlugin);

    tiles.addEventListener('load-root-tileset', () => {
      // 3DTilesRendererJS treats tileset space as Z-up. For asset.gltfUpAxis === 'Y'
      // (library default) it applies +90° about X to GLB content only — not to
      // boundingVolume.box. Our mesh.bin positions and boxes are already Three.js
      // Y-up, so that correction tips the mesh relative to the debug boxes.
      // Force identity regardless of tileset asset.gltfUpAxis.
      const runtime = tiles as unknown as {
        _upRotationMatrix: { identity: () => unknown };
      };
      runtime._upRotationMatrix.identity();

      const sphere = new Sphere();
      tiles.getBoundingSphere(sphere);
      tiles.group.position.copy(sphere.center).multiplyScalar(-1);
      const r = Math.max(sphere.radius, 1);
      camera.position.set(r * 0.8, r * 0.6, r * 1.2);
      controls.target.set(0, 0, 0);
      controls.update();
    });

    scene.add(tiles.group);

    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.controls = controls;
    this.tiles = tiles;
    this.debugPlugin = debugPlugin;

    this.resizeObserver = new ResizeObserver(() => {
      if (!this.renderer || !this.camera || !host.isConnected) {
        return;
      }
      const w = Math.max(host.clientWidth, 1);
      const h = Math.max(host.clientHeight, 1);
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
      this.tiles?.setResolutionFromRenderer(this.camera, this.renderer);
    });
    this.resizeObserver.observe(host);

    const tick = () => {
      this.animationId = requestAnimationFrame(tick);
      if (!this.tiles || !this.camera || !this.renderer || !this.scene || !this.controls) {
        return;
      }
      this.controls.update();
      this.camera.updateMatrixWorld();
      this.tiles.update();
      this.renderer.render(this.scene, this.camera);
    };
    tick();
  }

  applyTileBudget(budget: SdxTileBudget): void {
    if (!this.tiles) {
      return;
    }
    this.applyBudgetToTiles(this.tiles, budget);
  }

  setDisplayBoxBounds(enabled: boolean): void {
    if (!this.debugPlugin) {
      return;
    }
    this.debugPlugin.displayBoxBounds = enabled;
    this.debugPlugin.update();
  }

  setDisplayParentBounds(enabled: boolean): void {
    if (!this.debugPlugin) {
      return;
    }
    this.debugPlugin.displayParentBounds = enabled;
    this.debugPlugin.update();
  }

  getTilesRenderer(): TilesRenderer | null {
    return this.tiles;
  }

  getStats(): SdxMeshTilesStats | null {
    if (!this.tiles) {
      return null;
    }
    const tiles = this.tiles;
    // `stats` exists at runtime on TilesRendererBase but is omitted from public .d.ts
    const runtime = tiles as unknown as {
      stats?: { downloading?: number; parsing?: number };
      visibleTiles?: Set<unknown>;
      lruCache: { maxSize: number; itemList?: unknown[] };
    };
    const cached = runtime.lruCache.itemList?.length ?? 0;
    return {
      errorTarget: tiles.errorTarget,
      maxDepth: tiles.maxDepth,
      downloading: runtime.stats?.downloading ?? 0,
      parsing: runtime.stats?.parsing ?? 0,
      visible: runtime.visibleTiles?.size ?? 0,
      cached,
      cacheMaxTiles: tiles.lruCache.maxSize,
    };
  }

  ngOnDestroy(): void {
    this.dispose();
  }

  dispose(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = 0;
    }
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.controls?.dispose();
    this.controls = null;
    this.debugPlugin = null;
    this.tiles?.dispose();
    this.tiles = null;
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.domElement.remove();
      this.renderer = null;
    }
    this.scene = null;
    this.camera = null;
  }

  private applyBudgetToTiles(tiles: TilesRenderer, budget: SdxTileBudget): void {
    const errorTarget = budget.errorTarget ?? DEFAULT_BUDGET.errorTarget;
    const maxDepth = budget.maxDepth ?? DEFAULT_BUDGET.maxDepth;
    const cacheMaxTiles = budget.cacheMaxTiles ?? DEFAULT_BUDGET.cacheMaxTiles;
    const cacheMinTiles = budget.cacheMinTiles ?? Math.min(DEFAULT_BUDGET.cacheMinTiles, cacheMaxTiles);
    const cacheMaxBytes = budget.cacheMaxBytes ?? DEFAULT_BUDGET.cacheMaxBytes;
    const maxDownloadJobs = budget.maxDownloadJobs ?? DEFAULT_BUDGET.maxDownloadJobs;
    const maxParseJobs = budget.maxParseJobs ?? DEFAULT_BUDGET.maxParseJobs;

    tiles.errorTarget = errorTarget;
    tiles.maxDepth = maxDepth;
    tiles.lruCache.maxSize = cacheMaxTiles;
    tiles.lruCache.minSize = Math.min(cacheMinTiles, cacheMaxTiles);
    tiles.lruCache.maxBytesSize = cacheMaxBytes;
    tiles.downloadQueue.maxJobs = maxDownloadJobs;
    tiles.parseQueue.maxJobs = maxParseJobs;
  }
}
