import { Injectable, OnDestroy } from '@angular/core';
import {
  AmbientLight,
  Color,
  DataTexture,
  DirectionalLight,
  Line,
  LineSegments,
  Material,
  Mesh,
  NearestFilter,
  Object3D,
  PerspectiveCamera,
  RedFormat,
  Scene,
  Sphere,
  UnsignedByteType,
  Vector3,
  WebGLRenderer,
} from 'three';
import { TilesRenderer } from '3d-tiles-renderer';
import { DebugTilesPlugin, GLTFExtensionsPlugin } from '3d-tiles-renderer/plugins';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { PotreeCloudStats, SdxPotreeCloud } from './sdx-potree-cloud';

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

/** Origin-relative ENH: X east, Y north, Z height. Same frame as cube/Potree. */
const WORLD_UP = new Vector3(0, 0, 1);

/** Unfiltered IFC tilesets omit types=; strip it so tile GLBs return every component. */
function stripQueryParam(url: string, key: string): string {
  const hashIndex = url.indexOf('#');
  const hash = hashIndex >= 0 ? url.slice(hashIndex) : '';
  const withoutHash = hashIndex >= 0 ? url.slice(0, hashIndex) : url;
  const queryIndex = withoutHash.indexOf('?');
  if (queryIndex < 0) {
    return url;
  }
  const path = withoutHash.slice(0, queryIndex);
  const params = new URLSearchParams(withoutHash.slice(queryIndex + 1));
  if (!params.has(key)) {
    return url;
  }
  params.delete(key);
  const query = params.toString();
  return query ? `${path}?${query}${hash}` : `${path}${hash}`;
}

function stripIfcTypesQuery(url: string): string {
  return stripQueryParam(url, 'types');
}

class StripIfcTypesPlugin {
  preprocessURL(url: string): string {
    return stripIfcTypesQuery(url);
  }
}

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

export interface LineworkLayer {
  layer_id: number;
  name: string;
  color: number[];
}

export interface SdxMeshTilesOptions extends SdxTileBudget {
  tilesetUrl?: string;
  ifcTilesetUrl?: string;
  lineworkTilesetUrl?: string;
  accessToken?: string;
  products?: IfcProduct[];
  lineworkLayers?: LineworkLayer[];
  /** Show OBB helpers for visible tiles (DebugTilesPlugin). */
  displayBoxBounds?: boolean;
  /** Also show ancestor bounding volumes. */
  displayParentBounds?: boolean;
}

export interface IfcProduct {
  component_id: number;
  express_id: number;
  global_id: string | null;
  ifc_class: string;
  name: string | null;
}

export interface SdxMeshTilesStats {
  errorTarget: number;
  maxDepth: number;
  downloading: number;
  parsing: number;
  visible: number;
  cached: number;
  cacheMaxTiles: number;
  productsVisible: number;
  productsTotal: number;
  pointsVisible: number;
  pointsCached: number;
}

const DEFAULT_BUDGET: Required<SdxTileBudget> = {
  errorTarget: 6,
  maxDepth: Number.POSITIVE_INFINITY,
  cacheMaxTiles: 800,
  cacheMinTiles: 600,
  cacheMaxBytes: 0.5 * 2 ** 30,
  maxDownloadJobs: 10,
  maxParseJobs: 1,
};

interface LayerRuntime {
  tiles: TilesRenderer;
  debugPlugin: DebugTilesPlugin;
}

@Injectable()
export class SdxMeshTilesService implements OnDestroy {
  private meshLayer: LayerRuntime | null = null;
  private ifcLayer: LayerRuntime | null = null;
  private lineworkLayer: LayerRuntime | null = null;
  private readonly potreeLayers: Record<'cs25d' | 'cs3d', SdxPotreeCloud | null> = {
    cs25d: null,
    cs3d: null,
  };
  private readonly potreeGeneration: Record<'cs25d' | 'cs3d', number> = { cs25d: 0, cs3d: 0 };
  private readonly potreeLoading: Record<'cs25d' | 'cs3d', SdxPotreeCloud | null> = {
    cs25d: null,
    cs3d: null,
  };
  private renderer: WebGLRenderer | null = null;
  private scene: Scene | null = null;
  private camera: PerspectiveCamera | null = null;
  private controls: OrbitControls | null = null;
  private animationId = 0;
  private resizeObserver: ResizeObserver | null = null;
  private host: HTMLElement | null = null;
  private accessToken: string | undefined;
  private displayBoxBounds = false;
  private displayParentBounds = false;
  private budget: Required<SdxTileBudget> = { ...DEFAULT_BUDGET };

  private products: IfcProduct[] = [];
  private productsByType = new Map<string, number[]>();
  private visibilityData = new Uint8Array([255]);
  private visibilityTexture: DataTexture | null = null;
  private highlightData = new Uint8Array([0]);
  private highlightTexture: DataTexture | null = null;
  private highlightedComponentId: number | null = null;
  private visibilityWidth = 1;
  private visibilityHeight = 1;

  ensureScene(host: HTMLElement): void {
    if (this.scene && this.renderer && this.host === host) {
      return;
    }
    this.disposeLayer(this.meshLayer);
    this.meshLayer = null;
    this.disposeLayer(this.ifcLayer);
    this.ifcLayer = null;
    this.disposeLayer(this.lineworkLayer);
    this.lineworkLayer = null;
    this.disposePotreeLayer('cs25d');
    this.disposePotreeLayer('cs3d');
    this.disposeScene();

    const width = Math.max(host.clientWidth, 1);
    const height = Math.max(host.clientHeight, 1);

    const scene = new Scene();
    scene.background = new Color(0x1a1d23);

    const camera = new PerspectiveCamera(60, width / height, 0.1, 1e7);
    camera.up.copy(WORLD_UP);
    camera.position.set(0, -80, 40);

    const renderer = new WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    host.innerHTML = '';
    host.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    // Zoom moves the pivot with the cursor. A fixed pivot on the cube mid-plane
    // stops dolly before the camera reaches points that sit off that plane.
    controls.zoomToCursor = true;
    controls.screenSpacePanning = true;

    scene.add(new AmbientLight(0xffffff, 0.7));
    const sun = new DirectionalLight(0xffffff, 0.9);
    sun.position.set(0.45, 0.25, 1);
    scene.add(sun);

    this.host = host;
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.controls = controls;

    this.resizeObserver = new ResizeObserver(() => {
      if (!this.renderer || !this.camera || !host.isConnected) {
        return;
      }
      const w = Math.max(host.clientWidth, 1);
      const h = Math.max(host.clientHeight, 1);
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
      this.meshLayer?.tiles.setResolutionFromRenderer(this.camera, this.renderer);
      this.ifcLayer?.tiles.setResolutionFromRenderer(this.camera, this.renderer);
      this.lineworkLayer?.tiles.setResolutionFromRenderer(this.camera, this.renderer);
    });
    this.resizeObserver.observe(host);

    const tick = () => {
      this.animationId = requestAnimationFrame(tick);
      if (!this.camera || !this.renderer || !this.scene || !this.controls) {
        return;
      }
      this.controls.update();
      this.updateCameraClipping();
      this.camera.updateMatrixWorld();
      this.meshLayer?.tiles.update();
      this.ifcLayer?.tiles.update();
      this.lineworkLayer?.tiles.update();
      this.potreeLayers.cs25d?.update(this.camera, this.renderer, this.budget);
      this.potreeLayers.cs3d?.update(this.camera, this.renderer, this.budget);
      this.renderer.render(this.scene, this.camera);
    };
    tick();
  }

  setLayerOptions(options: SdxMeshTilesOptions): void {
    if ('accessToken' in options) {
      this.accessToken = options.accessToken;
    }
    if (options.displayBoxBounds !== undefined) {
      this.displayBoxBounds = options.displayBoxBounds;
    }
    if (options.displayParentBounds !== undefined) {
      this.displayParentBounds = options.displayParentBounds;
    }
    this.budget = {
      errorTarget: options.errorTarget ?? this.budget.errorTarget,
      maxDepth: options.maxDepth ?? this.budget.maxDepth,
      cacheMaxTiles: options.cacheMaxTiles ?? this.budget.cacheMaxTiles,
      cacheMinTiles: options.cacheMinTiles ?? this.budget.cacheMinTiles,
      cacheMaxBytes: options.cacheMaxBytes ?? this.budget.cacheMaxBytes,
      maxDownloadJobs: options.maxDownloadJobs ?? this.budget.maxDownloadJobs,
      maxParseJobs: options.maxParseJobs ?? this.budget.maxParseJobs,
    };
  }

  setMeshTileset(tilesetUrl: string | null): void {
    this.disposeLayer(this.meshLayer);
    this.meshLayer = null;
    if (!tilesetUrl || !this.scene || !this.camera || !this.renderer) {
      return;
    }
    this.meshLayer = this.createLayer(tilesetUrl, 'mesh');
    this.scene.add(this.meshLayer.tiles.group);
  }

  setIfcTileset(tilesetUrl: string | null, products: IfcProduct[]): void {
    this.disposeLayer(this.ifcLayer);
    this.ifcLayer = null;
    this.configureProducts(products);
    if (!tilesetUrl || !this.scene || !this.camera || !this.renderer) {
      return;
    }
    this.ifcLayer = this.createLayer(tilesetUrl, 'ifc');
    this.scene.add(this.ifcLayer.tiles.group);
  }

  async setPotreeLayer(kind: 'cs25d' | 'cs3d', metadataUrl: string | null): Promise<string | null> {
    const generation = ++this.potreeGeneration[kind];
    this.disposePotreeLayer(kind);
    if (!metadataUrl || !this.scene) {
      return null;
    }
    const cloud = new SdxPotreeCloud(metadataUrl, this.accessToken);
    this.potreeLoading[kind] = cloud;
    try {
      await cloud.load();
    } catch (error: unknown) {
      cloud.dispose();
      if (this.potreeLoading[kind] === cloud) {
        this.potreeLoading[kind] = null;
      }
      if (generation !== this.potreeGeneration[kind] || !this.scene || isAbortError(error)) {
        return null;
      }
      const label = kind === 'cs25d' ? 'CS25D' : 'CS3D';
      const message = error instanceof Error ? error.message : String(error);
      return `${label}: ${message}`;
    }
    if (this.potreeLoading[kind] === cloud) {
      this.potreeLoading[kind] = null;
    }
    if (generation !== this.potreeGeneration[kind] || !this.scene) {
      cloud.dispose();
      return null;
    }
    this.scene.add(cloud.group);
    this.potreeLayers[kind] = cloud;
    this.frameToLoadedLayers();
    return null;
  }

  setLineworkTileset(tilesetUrl: string | null): void {
    this.disposeLayer(this.lineworkLayer);
    this.lineworkLayer = null;
    if (!tilesetUrl || !this.scene || !this.camera || !this.renderer) {
      return;
    }
    this.lineworkLayer = this.createLayer(tilesetUrl, 'linework');
    this.scene.add(this.lineworkLayer.tiles.group);
  }

  applyTileBudget(budget: SdxTileBudget): void {
    this.setLayerOptions(budget);
    if (this.meshLayer) {
      this.applyBudgetToTiles(this.meshLayer.tiles, this.budget);
    }
    if (this.ifcLayer) {
      this.applyBudgetToTiles(this.ifcLayer.tiles, this.budget);
    }
    if (this.lineworkLayer) {
      this.applyBudgetToTiles(this.lineworkLayer.tiles, this.budget);
    }
  }

  setProductVisible(componentId: number, visible: boolean): void {
    if (componentId < 0 || componentId >= this.visibilityData.length) {
      return;
    }
    this.visibilityData[componentId] = visible ? 255 : 0;
    if (this.visibilityTexture) {
      this.visibilityTexture.needsUpdate = true;
    }
  }

  setTypeVisible(ifcClass: string, visible: boolean): void {
    for (const componentId of this.productsByType.get(ifcClass.toUpperCase()) ?? []) {
      this.visibilityData[componentId] = visible ? 255 : 0;
    }
    if (this.visibilityTexture) {
      this.visibilityTexture.needsUpdate = true;
    }
  }

  setProductHighlighted(componentId: number | null): void {
    if (
      this.highlightedComponentId !== null &&
      this.highlightedComponentId < this.highlightData.length
    ) {
      this.highlightData[this.highlightedComponentId] = 0;
    }
    this.highlightedComponentId =
      componentId !== null && componentId >= 0 && componentId < this.highlightData.length
        ? componentId
        : null;
    if (this.highlightedComponentId !== null) {
      this.highlightData[this.highlightedComponentId] = 255;
    }
    if (this.highlightTexture) {
      this.highlightTexture.needsUpdate = true;
    }
  }

  showAllProducts(): void {
    this.visibilityData.fill(255);
    if (this.visibilityTexture) {
      this.visibilityTexture.needsUpdate = true;
    }
  }

  hideAllProducts(): void {
    this.visibilityData.fill(0);
    if (this.visibilityTexture) {
      this.visibilityTexture.needsUpdate = true;
    }
  }

  getProducts(): IfcProduct[] {
    return this.products;
  }

  setDisplayBoxBounds(enabled: boolean): void {
    this.displayBoxBounds = enabled;
    for (const layer of [this.meshLayer, this.ifcLayer, this.lineworkLayer]) {
      if (!layer) {
        continue;
      }
      layer.debugPlugin.displayBoxBounds = enabled;
      layer.debugPlugin.update();
    }
  }

  setDisplayParentBounds(enabled: boolean): void {
    this.displayParentBounds = enabled;
    for (const layer of [this.meshLayer, this.ifcLayer, this.lineworkLayer]) {
      if (!layer) {
        continue;
      }
      layer.debugPlugin.displayParentBounds = enabled;
      layer.debugPlugin.update();
    }
  }

  getTilesRenderer(): TilesRenderer | null {
    return this.meshLayer?.tiles ?? this.ifcLayer?.tiles ?? this.lineworkLayer?.tiles ?? null;
  }

  getStats(): SdxMeshTilesStats | null {
    const layers = [this.meshLayer, this.ifcLayer, this.lineworkLayer].filter(
      (layer): layer is LayerRuntime => layer !== null,
    );
    const pointStats = this.collectPointStats();
    if (layers.length === 0 && !this.potreeLayers.cs25d && !this.potreeLayers.cs3d) {
      return null;
    }
    const runtimes = layers.map((layer) => this.runtimeStats(layer.tiles));
    const primary = layers[0]?.tiles;
    return {
      errorTarget: primary?.errorTarget ?? this.budget.errorTarget,
      maxDepth: primary?.maxDepth ?? this.budget.maxDepth,
      downloading:
        runtimes.reduce((sum, stats) => sum + stats.downloading, 0) + pointStats.downloading,
      parsing: runtimes.reduce((sum, stats) => sum + stats.parsing, 0),
      visible: runtimes.reduce((sum, stats) => sum + stats.visible, 0),
      cached: runtimes.reduce((sum, stats) => sum + stats.cached, 0),
      cacheMaxTiles: primary?.lruCache.maxSize ?? this.budget.cacheMaxTiles,
      productsVisible: this.products.reduce(
        (count, product) =>
          count + (this.visibilityData[product.component_id] > 0 ? 1 : 0),
        0,
      ),
      productsTotal: this.products.length,
      pointsVisible: pointStats.visiblePoints,
      pointsCached: pointStats.loadedNodes,
    };
  }

  ngOnDestroy(): void {
    this.dispose();
  }

  dispose(): void {
    this.disposeLayer(this.meshLayer);
    this.meshLayer = null;
    this.disposeLayer(this.ifcLayer);
    this.ifcLayer = null;
    this.disposeLayer(this.lineworkLayer);
    this.lineworkLayer = null;
    this.disposePotreeLayer('cs25d');
    this.disposePotreeLayer('cs3d');
    this.clearProducts();
    this.disposeScene();
  }

  private disposePotreeLayer(kind: 'cs25d' | 'cs3d'): void {
    this.potreeLoading[kind]?.dispose();
    this.potreeLoading[kind] = null;
    this.potreeLayers[kind]?.dispose();
    this.potreeLayers[kind] = null;
  }

  private collectPointStats(): PotreeCloudStats {
    const empty: PotreeCloudStats = { visiblePoints: 0, loadedNodes: 0, downloading: 0 };
    for (const cloud of [this.potreeLayers.cs25d, this.potreeLayers.cs3d]) {
      if (!cloud) {
        continue;
      }
      const stats = cloud.getLastStats();
      empty.visiblePoints += stats.visiblePoints;
      empty.loadedNodes += stats.loadedNodes;
      empty.downloading += stats.downloading;
    }
    return empty;
  }

  private createLayer(tilesetUrl: string, kind: 'mesh' | 'ifc' | 'linework'): LayerRuntime {
    const tiles = new TilesRenderer(kind === 'ifc' ? stripIfcTypesQuery(tilesetUrl) : tilesetUrl);
    tiles.setCamera(this.camera!);
    tiles.setResolutionFromRenderer(this.camera!, this.renderer!);

    if (this.accessToken) {
      tiles.fetchOptions = {
        ...tiles.fetchOptions,
        headers: {
          ...(tiles.fetchOptions?.headers || {}),
          Authorization: `Bearer ${this.accessToken}`,
        },
      };
    }

    this.applyBudgetToTiles(tiles, this.budget);

    if (kind === 'ifc') {
      tiles.registerPlugin(new StripIfcTypesPlugin());
      tiles.registerPlugin(new GLTFExtensionsPlugin({ metadata: true, autoDispose: false }));
      tiles.addEventListener('load-model', (event) => {
        this.patchLoadedModel(event.scene);
      });
    }
    if (kind === 'linework') {
      tiles.addEventListener('load-model', (event) => {
        this.patchLineworkModel(event.scene);
      });
    }

    const debugPlugin = new DebugTilesPlugin({
      displayBoxBounds: this.displayBoxBounds,
      displayParentBounds: this.displayParentBounds,
      enabled: true,
    });
    tiles.registerPlugin(debugPlugin);

    tiles.addEventListener('load-error', (event) => {
      const detail = event as unknown as { url?: string; error?: unknown };
      console.error(`[sdx-${kind}] tile load failed`, detail.url, detail.error);
    });

    tiles.addEventListener('load-root-tileset', () => {
      this.frameToLoadedLayers();
    });

    return { tiles, debugPlugin };
  }

  private frameToLoadedLayers(): void {
    if (!this.camera || !this.controls) {
      return;
    }
    const combined = new Sphere();
    let hasSphere = false;
    for (const layer of [this.meshLayer, this.ifcLayer, this.lineworkLayer]) {
      if (!layer) {
        continue;
      }
      const sphere = new Sphere();
      if (!layer.tiles.getBoundingSphere(sphere)) {
        continue;
      }
      if (!hasSphere) {
        combined.copy(sphere);
        hasSphere = true;
      } else {
        combined.union(sphere);
      }
    }
    for (const cloud of [this.potreeLayers.cs25d, this.potreeLayers.cs3d]) {
      const sphere = cloud?.getBoundingSphere();
      if (!sphere) {
        continue;
      }
      if (!hasSphere) {
        combined.copy(sphere);
        hasSphere = true;
      } else {
        combined.union(sphere);
      }
    }
    if (!hasSphere) {
      return;
    }
    const r = Math.max(combined.radius, 1);
    this.camera.up.copy(WORLD_UP);
    this.controls.target.copy(combined.center);
    this.camera.position.set(
      combined.center.x + r * 0.8,
      combined.center.y - r * 1.2,
      combined.center.z + r * 0.6,
    );
    this.controls.update();
  }

  private updateCameraClipping(): void {
    if (!this.camera || !this.controls) {
      return;
    }
    const distance = Math.max(this.camera.position.distanceTo(this.controls.target), 0.05);
    const near = Math.max(0.01, distance / 200);
    const far = Math.max(distance * 500, 1000);
    if (Math.abs(this.camera.near - near) < near * 0.05 && Math.abs(this.camera.far - far) < far * 0.05) {
      return;
    }
    this.camera.near = near;
    this.camera.far = far;
    this.camera.updateProjectionMatrix();
  }

  private disposeLayer(layer: LayerRuntime | null): void {
    if (!layer) {
      return;
    }
    this.scene?.remove(layer.tiles.group);
    layer.tiles.dispose();
  }

  private disposeScene(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = 0;
    }
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.controls?.dispose();
    this.controls = null;
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.domElement.remove();
      this.renderer = null;
    }
    this.scene = null;
    this.camera = null;
    this.host = null;
  }

  private applyBudgetToTiles(tiles: TilesRenderer, budget: SdxTileBudget): void {
    const errorTarget = budget.errorTarget ?? DEFAULT_BUDGET.errorTarget;
    const maxDepth = budget.maxDepth ?? DEFAULT_BUDGET.maxDepth;
    const cacheMaxTiles = budget.cacheMaxTiles ?? DEFAULT_BUDGET.cacheMaxTiles;
    const cacheMinTiles =
      budget.cacheMinTiles ?? Math.min(DEFAULT_BUDGET.cacheMinTiles, cacheMaxTiles);
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

  private runtimeStats(tiles: TilesRenderer): {
    downloading: number;
    parsing: number;
    visible: number;
    cached: number;
  } {
    const runtime = tiles as unknown as {
      stats?: { downloading?: number; parsing?: number };
      visibleTiles?: Set<unknown>;
      lruCache: { maxSize: number; itemList?: unknown[] };
    };
    return {
      downloading: runtime.stats?.downloading ?? 0,
      parsing: runtime.stats?.parsing ?? 0,
      visible: runtime.visibleTiles?.size ?? 0,
      cached: runtime.lruCache.itemList?.length ?? 0,
    };
  }

  private configureProducts(products: IfcProduct[]): void {
    this.products = [...products];
    this.productsByType.clear();
    for (const product of products) {
      const key = product.ifc_class.toUpperCase();
      const ids = this.productsByType.get(key) ?? [];
      ids.push(product.component_id);
      this.productsByType.set(key, ids);
    }

    const componentCount = products.reduce(
      (count, product) => Math.max(count, product.component_id + 1),
      0,
    );
    const maxTextureSize = this.renderer?.capabilities.maxTextureSize ?? 4096;
    this.visibilityWidth = Math.max(1, Math.min(componentCount || 1, maxTextureSize));
    this.visibilityHeight = Math.max(1, Math.ceil((componentCount || 1) / this.visibilityWidth));
    this.visibilityData = new Uint8Array(this.visibilityWidth * this.visibilityHeight);
    this.visibilityData.fill(255);
    this.visibilityTexture?.dispose();
    this.visibilityTexture = new DataTexture(
      this.visibilityData,
      this.visibilityWidth,
      this.visibilityHeight,
      RedFormat,
      UnsignedByteType,
    );
    this.visibilityTexture.minFilter = NearestFilter;
    this.visibilityTexture.magFilter = NearestFilter;
    this.visibilityTexture.generateMipmaps = false;
    this.visibilityTexture.needsUpdate = true;
    this.highlightData = new Uint8Array(this.visibilityWidth * this.visibilityHeight);
    this.highlightTexture?.dispose();
    this.highlightTexture = new DataTexture(
      this.highlightData,
      this.visibilityWidth,
      this.visibilityHeight,
      RedFormat,
      UnsignedByteType,
    );
    this.highlightTexture.minFilter = NearestFilter;
    this.highlightTexture.magFilter = NearestFilter;
    this.highlightTexture.generateMipmaps = false;
    this.highlightTexture.needsUpdate = true;
    this.highlightedComponentId = null;
  }

  private clearProducts(): void {
    this.visibilityTexture?.dispose();
    this.visibilityTexture = null;
    this.highlightTexture?.dispose();
    this.highlightTexture = null;
    this.products = [];
    this.productsByType.clear();
    this.visibilityData = new Uint8Array([255]);
    this.highlightData = new Uint8Array([0]);
    this.highlightedComponentId = null;
  }

  private patchLineworkModel(scene: Object3D): void {
    scene.traverse((object) => {
      if (!(object instanceof Line) && !(object instanceof LineSegments) && !(object instanceof Mesh)) {
        return;
      }
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of materials) {
        if ('vertexColors' in material) {
          (material as Material & { vertexColors: boolean }).vertexColors = true;
        }
        material.needsUpdate = true;
      }
    });
  }

  private patchLoadedModel(scene: Object3D): void {
    scene.traverse((object) => {
      if (!(object instanceof Mesh) || !object.geometry.getAttribute('_feature_id_0')) {
        return;
      }
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of materials) {
        this.patchMaterial(material);
      }
    });
  }

  private patchMaterial(material: Material): void {
    if (
      material.userData['ifcVisibilityPatched'] ||
      !this.visibilityTexture ||
      !this.highlightTexture
    ) {
      return;
    }
    material.userData['ifcVisibilityPatched'] = true;
    const previousCompile = material.onBeforeCompile.bind(material);
    const previousCacheKey = material.customProgramCacheKey.bind(material);
    const texture = this.visibilityTexture;
    const highlightTexture = this.highlightTexture;
    const width = this.visibilityWidth;
    const height = this.visibilityHeight;
    material.onBeforeCompile = (shader, renderer) => {
      previousCompile(shader, renderer);
      shader.uniforms['ifcVisibilityTexture'] = { value: texture };
      shader.uniforms['ifcHighlightTexture'] = { value: highlightTexture };
      shader.vertexShader = `
        attribute float _feature_id_0;
        varying float vIfcComponentId;
      ${shader.vertexShader}`.replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\nvIfcComponentId = _feature_id_0;',
      );
      shader.fragmentShader = `
        uniform sampler2D ifcVisibilityTexture;
        uniform sampler2D ifcHighlightTexture;
        varying float vIfcComponentId;
      ${shader.fragmentShader}`.replace(
        '#include <clipping_planes_fragment>',
        `#include <clipping_planes_fragment>
        float ifcId = floor(vIfcComponentId + 0.5);
        float ifcX = mod(ifcId, ${width.toFixed(1)});
        float ifcY = floor(ifcId / ${width.toFixed(1)});
        vec2 ifcUv = vec2(
          (ifcX + 0.5) / ${width.toFixed(1)},
          (ifcY + 0.5) / ${height.toFixed(1)}
        );
        if (texture2D(ifcVisibilityTexture, ifcUv).r < 0.5) discard;
        if (texture2D(ifcHighlightTexture, ifcUv).r > 0.5) {
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(1.0, 0.72, 0.12), 0.8);
        }`,
      );
    };
    material.customProgramCacheKey = () => `${previousCacheKey()}-ifc-product-visibility-highlight`;
    material.needsUpdate = true;
  }
}
