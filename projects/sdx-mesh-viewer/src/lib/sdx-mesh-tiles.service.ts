import { Injectable, OnDestroy } from '@angular/core';
import {
  AmbientLight,
  Color,
  DataTexture,
  DirectionalLight,
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

/** Origin-relative ENH: X east, Y north, Z height. Same frame as cube/Potree. */
const WORLD_UP = new Vector3(0, 0, 1);

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
  tilesetUrl?: string;
  ifcTilesetUrl?: string;
  accessToken?: string;
  products?: IfcProduct[];
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
    controls.screenSpacePanning = false;

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
    });
    this.resizeObserver.observe(host);

    const tick = () => {
      this.animationId = requestAnimationFrame(tick);
      if (!this.camera || !this.renderer || !this.scene || !this.controls) {
        return;
      }
      this.controls.update();
      this.camera.updateMatrixWorld();
      this.meshLayer?.tiles.update();
      this.ifcLayer?.tiles.update();
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
    this.meshLayer = this.createLayer(tilesetUrl, false);
    this.scene.add(this.meshLayer.tiles.group);
  }

  setIfcTileset(tilesetUrl: string | null, products: IfcProduct[]): void {
    this.disposeLayer(this.ifcLayer);
    this.ifcLayer = null;
    this.configureProducts(products);
    if (!tilesetUrl || !this.scene || !this.camera || !this.renderer) {
      return;
    }
    this.ifcLayer = this.createLayer(tilesetUrl, true);
    this.scene.add(this.ifcLayer.tiles.group);
  }

  applyTileBudget(budget: SdxTileBudget): void {
    this.setLayerOptions(budget);
    if (this.meshLayer) {
      this.applyBudgetToTiles(this.meshLayer.tiles, this.budget);
    }
    if (this.ifcLayer) {
      this.applyBudgetToTiles(this.ifcLayer.tiles, this.budget);
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
    for (const layer of [this.meshLayer, this.ifcLayer]) {
      if (!layer) {
        continue;
      }
      layer.debugPlugin.displayBoxBounds = enabled;
      layer.debugPlugin.update();
    }
  }

  setDisplayParentBounds(enabled: boolean): void {
    this.displayParentBounds = enabled;
    for (const layer of [this.meshLayer, this.ifcLayer]) {
      if (!layer) {
        continue;
      }
      layer.debugPlugin.displayParentBounds = enabled;
      layer.debugPlugin.update();
    }
  }

  getTilesRenderer(): TilesRenderer | null {
    return this.meshLayer?.tiles ?? this.ifcLayer?.tiles ?? null;
  }

  getStats(): SdxMeshTilesStats | null {
    if (!this.meshLayer && !this.ifcLayer) {
      return null;
    }
    const layers = [this.meshLayer, this.ifcLayer].filter(
      (layer): layer is LayerRuntime => layer !== null,
    );
    const runtimes = layers.map((layer) => this.runtimeStats(layer.tiles));
    const primary = layers[0].tiles;
    return {
      errorTarget: primary.errorTarget,
      maxDepth: primary.maxDepth,
      downloading: runtimes.reduce((sum, stats) => sum + stats.downloading, 0),
      parsing: runtimes.reduce((sum, stats) => sum + stats.parsing, 0),
      visible: runtimes.reduce((sum, stats) => sum + stats.visible, 0),
      cached: runtimes.reduce((sum, stats) => sum + stats.cached, 0),
      cacheMaxTiles: primary.lruCache.maxSize,
      productsVisible: this.products.reduce(
        (count, product) =>
          count + (this.visibilityData[product.component_id] > 0 ? 1 : 0),
        0,
      ),
      productsTotal: this.products.length,
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
    this.clearProducts();
    this.disposeScene();
  }

  private createLayer(tilesetUrl: string, isIfc: boolean): LayerRuntime {
    const tiles = new TilesRenderer(tilesetUrl);
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

    if (isIfc) {
      tiles.registerPlugin(new GLTFExtensionsPlugin({ metadata: true, autoDispose: false }));
      tiles.addEventListener('load-model', (event) => {
        this.patchLoadedModel(event.scene);
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
      console.error(isIfc ? '[sdx-ifc] tile load failed' : '[sdx-mesh] tile load failed', detail.url, detail.error);
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
    for (const layer of [this.meshLayer, this.ifcLayer]) {
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
