import {
  Box3,
  BufferGeometry,
  Float32BufferAttribute,
  Frustum,
  Group,
  Matrix4,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Sphere,
  Vector3,
  WebGLRenderer,
} from 'three';

/** Tile-budget knobs the point cloud shares with the 3D Tiles layers. */
export interface PotreeBudget {
  errorTarget: number;
  maxDepth: number;
  cacheMaxTiles: number;
  cacheMaxBytes: number;
  maxDownloadJobs: number;
}

/** Drawn points per cloud. Coarser nodes stay up when a finer level would exceed this. */
const DRAW_POINT_BUDGET = 2_000_000;

const HIERARCHY_BYTES_PER_NODE = 22;
const NODE_TYPE_NORMAL = 0;
const NODE_TYPE_PROXY = 2;

interface PotreeAttributeJson {
  name: string;
  size: number;
  numElements: number;
  type: string;
  scale?: number[];
  offset?: number[];
}

interface PotreeMetadataJson {
  encoding?: string;
  spacing?: number;
  boundingBox: { min: number[]; max: number[] };
  hierarchy: { firstChunkSize: number };
  attributes: PotreeAttributeJson[];
}

interface OctreeNode {
  name: string;
  level: number;
  numPoints: number;
  byteOffset: number;
  byteSize: number;
  children: OctreeNode[];
  box: Box3;
  spacing: number;
  proxy: boolean;
}

interface LoadedNode {
  node: OctreeNode;
  points: Points | null;
  lastUsed: number;
  bytes: number;
}

interface DecodeLayout {
  stride: number;
  positionOffset: number;
  rgbOffset: number;
  scale: Vector3;
  offset: Vector3;
}

interface SelectContext {
  frustum: Frustum;
  camera: PerspectiveCamera;
  viewportHeight: number;
  errorTarget: number;
  maxDepth: number;
  pointBudget: { left: number };
  draw: Set<string>;
  toLoad: OctreeNode[];
}

export interface PotreeCloudStats {
  visiblePoints: number;
  loadedNodes: number;
  downloading: number;
}

/**
 * Streams one Service 3D Potree 2 cube (CS25D or CS3D) into the shared Z-up scene.
 * Positions are decoded with the metadata scale and offset, which are already
 * origin-relative ENH. The group stays at the scene origin.
 */
export class SdxPotreeCloud {
  readonly group = new Group();

  private root: OctreeNode | null = null;
  private hierarchyUrl = '';
  private octreeUrl = '';
  private decode: DecodeLayout | null = null;
  private readonly loaded = new Map<string, LoadedNode>();
  private readonly inflight = new Map<string, AbortController>();
  private readonly frustum = new Frustum();
  private readonly frustumMatrix = new Matrix4();
  private readonly abortAll = new AbortController();
  private cacheBytes = 0;
  private frame = 0;
  private disposed = false;
  private lastStats: PotreeCloudStats = { visiblePoints: 0, loadedNodes: 0, downloading: 0 };

  constructor(
    private readonly metadataUrl: string,
    private readonly accessToken: string | undefined,
  ) {}

  async load(): Promise<void> {
    const metadata = await this.fetchMetadata();
    if ((metadata.encoding ?? 'DEFAULT') !== 'DEFAULT') {
      throw new Error(`Unsupported Potree encoding ${metadata.encoding}`);
    }
    this.decode = this.readDecodeLayout(metadata);
    this.hierarchyUrl = siblingUrl(this.metadataUrl, 'hierarchy.bin');
    this.octreeUrl = siblingUrl(this.metadataUrl, 'octree.bin');

    const root = this.makeRoot(metadata);
    const firstChunkSize = metadata.hierarchy.firstChunkSize;
    if (firstChunkSize < HIERARCHY_BYTES_PER_NODE) {
      throw new Error('Potree hierarchy is empty');
    }
    const hierarchy = await this.fetchBytes(this.hierarchyUrl, 0, firstChunkSize, this.abortAll.signal);
    this.parseHierarchy(root, hierarchy);
    await this.resolveProxies(root);
    this.markEmpty(root);
    this.root = root;
  }

  update(
    camera: PerspectiveCamera,
    renderer: WebGLRenderer,
    budget: PotreeBudget,
  ): PotreeCloudStats {
    const stats: PotreeCloudStats = { visiblePoints: 0, loadedNodes: 0, downloading: this.inflight.size };
    if (!this.root || this.disposed) {
      return stats;
    }

    this.frame += 1;
    camera.updateMatrixWorld();
    this.frustumMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    this.frustum.setFromProjectionMatrix(this.frustumMatrix);

    const ctx: SelectContext = {
      frustum: this.frustum,
      camera,
      viewportHeight: Math.max(renderer.domElement.clientHeight, 1),
      errorTarget: budget.errorTarget,
      maxDepth: budget.maxDepth,
      pointBudget: { left: DRAW_POINT_BUDGET },
      draw: new Set<string>(),
      toLoad: [],
    };
    this.select(this.root, ctx);
    this.applyVisibility(ctx);
    this.evict(ctx.draw, budget);
    this.pumpDownloads(ctx.toLoad, budget.maxDownloadJobs);

    for (const name of ctx.draw) {
      stats.visiblePoints += this.loaded.get(name)?.node.numPoints ?? 0;
    }
    stats.loadedNodes = this.geometryCount();
    stats.downloading = this.inflight.size;
    this.lastStats = stats;
    return stats;
  }

  getLastStats(): PotreeCloudStats {
    return this.lastStats;
  }

  getBoundingSphere(): Sphere | null {
    if (!this.root) {
      return null;
    }
    return this.root.box.getBoundingSphere(new Sphere());
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    this.abortAll.abort();
    for (const controller of this.inflight.values()) {
      controller.abort();
    }
    this.inflight.clear();
    for (const entry of [...this.loaded.values()]) {
      this.evictEntry(entry);
    }
    this.group.removeFromParent();
    this.group.clear();
    this.root = null;
  }

  private async fetchMetadata(): Promise<PotreeMetadataJson> {
    const response = await fetch(this.metadataUrl, {
      headers: this.authHeaders(),
      signal: this.abortAll.signal,
    });
    if (!response.ok) {
      throw new Error(`metadata HTTP ${response.status}`);
    }
    return (await response.json()) as PotreeMetadataJson;
  }

  private readDecodeLayout(metadata: PotreeMetadataJson): DecodeLayout {
    let cursor = 0;
    let positionOffset = -1;
    let rgbOffset = -1;
    let scale = new Vector3(1, 1, 1);
    let offset = new Vector3(0, 0, 0);
    for (const attribute of metadata.attributes) {
      if (attribute.name === 'position') {
        if (attribute.type !== 'int32') {
          throw new Error(`Unsupported position type ${attribute.type}`);
        }
        positionOffset = cursor;
        scale = new Vector3(...(attribute.scale ?? [1, 1, 1]));
        offset = new Vector3(...(attribute.offset ?? [0, 0, 0]));
      }
      if (attribute.name === 'rgb') {
        rgbOffset = cursor;
      }
      cursor += attribute.size;
    }
    if (positionOffset < 0 || cursor <= 0) {
      throw new Error('Potree metadata is missing a position attribute');
    }
    return { stride: cursor, positionOffset, rgbOffset, scale, offset };
  }

  private makeRoot(metadata: PotreeMetadataJson): OctreeNode {
    const min = metadata.boundingBox.min;
    const max = metadata.boundingBox.max;
    const box = new Box3(new Vector3(min[0], min[1], min[2]), new Vector3(max[0], max[1], max[2]));
    const side = Math.max(box.max.x - box.min.x, 1);
    return {
      name: 'r',
      level: 0,
      numPoints: 0,
      byteOffset: 0,
      byteSize: 0,
      children: [],
      box,
      spacing: metadata.spacing && metadata.spacing > 0 ? metadata.spacing : side / 128,
      proxy: false,
    };
  }

  private parseHierarchy(root: OctreeNode, buffer: ArrayBuffer): void {
    const view = new DataView(buffer);
    const numNodes = Math.floor(buffer.byteLength / HIERARCHY_BYTES_PER_NODE);
    const order: OctreeNode[] = [root];
    let nodePos = 0;
    for (let i = 0; i < numNodes; i += 1) {
      const current = order[nodePos];
      if (!current) {
        break;
      }
      nodePos += 1;
      const offset = i * HIERARCHY_BYTES_PER_NODE;
      const type = view.getUint8(offset);
      const childMask = view.getUint8(offset + 1);
      current.numPoints = view.getUint32(offset + 2, true);
      current.byteOffset = Number(view.getBigUint64(offset + 6, true));
      current.byteSize = Number(view.getBigUint64(offset + 14, true));
      current.children = [];
      current.proxy = type === NODE_TYPE_PROXY;
      if (type !== NODE_TYPE_NORMAL) {
        continue;
      }
      for (let childIndex = 0; childIndex < 8; childIndex += 1) {
        if ((childMask & (1 << childIndex)) === 0) {
          continue;
        }
        const child = this.makeChild(current, childIndex);
        current.children.push(child);
        order.push(child);
      }
    }
  }

  private makeChild(parent: OctreeNode, childIndex: number): OctreeNode {
    const min = parent.box.min.clone();
    const max = parent.box.max.clone();
    const hx = (max.x - min.x) / 2;
    const hy = (max.y - min.y) / 2;
    const hz = (max.z - min.z) / 2;
    if ((childIndex & 4) !== 0) {
      min.x += hx;
    } else {
      max.x -= hx;
    }
    if ((childIndex & 2) !== 0) {
      min.y += hy;
    } else {
      max.y -= hy;
    }
    if ((childIndex & 1) !== 0) {
      min.z += hz;
    } else {
      max.z -= hz;
    }
    return {
      name: `${parent.name}${childIndex}`,
      level: parent.level + 1,
      numPoints: 0,
      byteOffset: 0,
      byteSize: 0,
      children: [],
      box: new Box3(min, max),
      spacing: parent.spacing / 2,
      proxy: false,
    };
  }

  private async resolveProxies(node: OctreeNode): Promise<void> {
    if (node.proxy) {
      if (node.byteSize < HIERARCHY_BYTES_PER_NODE) {
        throw new Error(`Potree proxy ${node.name} has an empty hierarchy chunk`);
      }
      const chunk = await this.fetchBytes(
        this.hierarchyUrl,
        node.byteOffset,
        node.byteSize,
        this.abortAll.signal,
      );
      node.proxy = false;
      this.parseHierarchy(node, chunk);
    }
    for (const child of node.children) {
      await this.resolveProxies(child);
    }
  }

  private markEmpty(node: OctreeNode): void {
    if (!node.proxy && (node.numPoints <= 0 || node.byteSize <= 0) && !this.loaded.has(node.name)) {
      this.loaded.set(node.name, { node, points: null, lastUsed: 0, bytes: 0 });
    }
    for (const child of node.children) {
      this.markEmpty(child);
    }
  }

  private select(node: OctreeNode, ctx: SelectContext): boolean {
    if (node.proxy || !ctx.frustum.intersectsBox(node.box)) {
      return false;
    }
    // Synthetic ancestors (n_points = 0) exist only to give the cube one root.
    // Always descend through them; screen-space error applies once a node has points.
    const hasPayload = node.numPoints > 0 && node.byteSize > 0;
    const refine =
      node.children.length > 0 &&
      node.level < ctx.maxDepth &&
      (!hasPayload ||
        (ctx.pointBudget.left > 0 && this.spacingPixels(node, ctx) > ctx.errorTarget));
    if (!refine) {
      return this.includeNode(node, ctx);
    }

    let drew = false;
    let pending = false;
    for (const child of node.children) {
      if (!ctx.frustum.intersectsBox(child.box)) {
        continue;
      }
      if (child.numPoints > 0 && child.byteSize > 0 && !this.loaded.has(child.name)) {
        pending = true;
      }
      if (this.select(child, ctx)) {
        drew = true;
      }
    }
    if (pending || !drew) {
      drew = this.includeNode(node, ctx) || drew;
    }
    return drew;
  }

  private includeNode(node: OctreeNode, ctx: SelectContext): boolean {
    if (node.numPoints <= 0 || node.byteSize <= 0 || node.proxy) {
      return false;
    }
    const loaded = this.loaded.get(node.name);
    if (!loaded) {
      ctx.toLoad.push(node);
      return false;
    }
    if (!loaded.points) {
      return false;
    }
    if (node.numPoints > ctx.pointBudget.left && ctx.draw.size > 0) {
      return false;
    }
    ctx.pointBudget.left = Math.max(0, ctx.pointBudget.left - node.numPoints);
    ctx.draw.add(node.name);
    return true;
  }

  private spacingPixels(node: OctreeNode, ctx: SelectContext): number {
    const distance = Math.max(node.box.distanceToPoint(ctx.camera.position), node.spacing);
    const vFov = (ctx.camera.fov * Math.PI) / 180;
    return (node.spacing / distance) * (ctx.viewportHeight / (2 * Math.tan(vFov / 2)));
  }

  private applyVisibility(ctx: SelectContext): void {
    for (const entry of this.loaded.values()) {
      if (!entry.points) {
        continue;
      }
      const visible = ctx.draw.has(entry.node.name);
      entry.points.visible = visible;
      if (!visible) {
        continue;
      }
      entry.lastUsed = this.frame;
      const material = entry.points.material as PointsMaterial;
      const pixels = this.spacingPixels(entry.node, ctx);
      material.size = Math.min(16, Math.max(1, pixels));
    }
  }

  private evict(draw: Set<string>, budget: PotreeBudget): void {
    const overCount = this.geometryCount() > budget.cacheMaxTiles;
    const overBytes = budget.cacheMaxBytes > 0 && this.cacheBytes > budget.cacheMaxBytes;
    if (!overCount && !overBytes) {
      return;
    }
    const victims = [...this.loaded.values()]
      .filter((entry) => entry.points && !draw.has(entry.node.name))
      .sort((left, right) => left.lastUsed - right.lastUsed);
    for (const victim of victims) {
      if (this.geometryCount() <= budget.cacheMaxTiles && (budget.cacheMaxBytes <= 0 || this.cacheBytes <= budget.cacheMaxBytes)) {
        break;
      }
      this.evictEntry(victim);
    }
  }

  private pumpDownloads(toLoad: OctreeNode[], maxDownloadJobs: number): void {
    const slots = Math.max(1, maxDownloadJobs) - this.inflight.size;
    if (slots <= 0) {
      return;
    }
    toLoad.sort((left, right) => left.level - right.level);
    const seen = new Set<string>();
    let started = 0;
    for (const node of toLoad) {
      if (started >= slots) {
        break;
      }
      if (seen.has(node.name) || this.loaded.has(node.name) || this.inflight.has(node.name)) {
        continue;
      }
      seen.add(node.name);
      this.startDownload(node);
      started += 1;
    }
  }

  private startDownload(node: OctreeNode): void {
    const controller = new AbortController();
    this.inflight.set(node.name, controller);
    void this.fetchBytes(this.octreeUrl, node.byteOffset, node.byteSize, controller.signal)
      .then((buffer) => {
        if (this.disposed || controller.signal.aborted) {
          return;
        }
        this.attachGeometry(node, buffer);
      })
      .catch((error: unknown) => {
        if (this.disposed || controller.signal.aborted) {
          return;
        }
        console.error('[sdx-potree] node load failed', node.name, error);
      })
      .finally(() => {
        this.inflight.delete(node.name);
      });
  }

  private attachGeometry(node: OctreeNode, buffer: ArrayBuffer): void {
    if (!this.decode || this.loaded.has(node.name)) {
      return;
    }
    const decoded = decodePoints(buffer, this.decode);
    if (!decoded) {
      this.loaded.set(node.name, { node, points: null, lastUsed: this.frame, bytes: 0 });
      return;
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(decoded.positions, 3));
    geometry.setAttribute('color', new Float32BufferAttribute(decoded.colors, 3));
    geometry.boundingBox = node.box.clone();
    geometry.boundingSphere = node.box.getBoundingSphere(new Sphere());
    const material = new PointsMaterial({
      size: 2,
      sizeAttenuation: false,
      vertexColors: true,
    });
    const points = new Points(geometry, material);
    points.name = node.name;
    points.frustumCulled = true;
    points.visible = false;
    this.group.add(points);
    this.cacheBytes += node.byteSize;
    this.loaded.set(node.name, { node, points, lastUsed: this.frame, bytes: node.byteSize });
  }

  private evictEntry(entry: LoadedNode): void {
    this.loaded.delete(entry.node.name);
    if (!entry.points) {
      return;
    }
    this.group.remove(entry.points);
    entry.points.geometry.dispose();
    const material = entry.points.material;
    if (Array.isArray(material)) {
      for (const item of material) {
        item.dispose();
      }
    } else {
      material.dispose();
    }
    this.cacheBytes = Math.max(0, this.cacheBytes - entry.bytes);
  }

  private geometryCount(): number {
    let count = 0;
    for (const entry of this.loaded.values()) {
      if (entry.points) {
        count += 1;
      }
    }
    return count;
  }

  private authHeaders(range?: string): Record<string, string> {
    const headers: Record<string, string> = {};
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }
    if (range) {
      headers['Range'] = range;
    }
    return headers;
  }

  private async fetchBytes(
    url: string,
    byteOffset: number,
    byteSize: number,
    signal: AbortSignal,
  ): Promise<ArrayBuffer> {
    const end = byteOffset + byteSize - 1;
    const response = await fetch(url, {
      headers: this.authHeaders(`bytes=${byteOffset}-${end}`),
      signal,
    });
    if (!response.ok && response.status !== 206) {
      throw new Error(`HTTP ${response.status} ${url}`);
    }
    const buffer = await response.arrayBuffer();
    if (response.status === 200 && (buffer.byteLength !== byteSize || byteOffset > 0)) {
      return buffer.slice(byteOffset, byteOffset + byteSize);
    }
    return buffer;
  }
}

function siblingUrl(metadataUrl: string, fileName: string): string {
  const hashIndex = metadataUrl.indexOf('#');
  const hash = hashIndex >= 0 ? metadataUrl.slice(hashIndex) : '';
  const withoutHash = hashIndex >= 0 ? metadataUrl.slice(0, hashIndex) : metadataUrl;
  const queryIndex = withoutHash.indexOf('?');
  const path = queryIndex >= 0 ? withoutHash.slice(0, queryIndex) : withoutHash;
  const slash = path.lastIndexOf('/');
  const directory = slash >= 0 ? path.slice(0, slash + 1) : '';
  return `${directory}${fileName}${hash}`;
}

function decodePoints(
  buffer: ArrayBuffer,
  layout: DecodeLayout,
): { positions: Float32Array; colors: Float32Array } | null {
  const view = new DataView(buffer);
  const count = Math.floor(view.byteLength / layout.stride);
  if (count <= 0) {
    return null;
  }
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const hasRgb = layout.rgbOffset >= 0;
  for (let i = 0; i < count; i += 1) {
    const base = i * layout.stride;
    const position = base + layout.positionOffset;
    positions[i * 3] = view.getInt32(position, true) * layout.scale.x + layout.offset.x;
    positions[i * 3 + 1] = view.getInt32(position + 4, true) * layout.scale.y + layout.offset.y;
    positions[i * 3 + 2] = view.getInt32(position + 8, true) * layout.scale.z + layout.offset.z;
    if (!hasRgb) {
      colors[i * 3] = 0.6;
      colors[i * 3 + 1] = 0.6;
      colors[i * 3 + 2] = 0.6;
      continue;
    }
    const color = base + layout.rgbOffset;
    colors[i * 3] = view.getUint16(color, true) / 65535;
    colors[i * 3 + 1] = view.getUint16(color + 2, true) / 65535;
    colors[i * 3 + 2] = view.getUint16(color + 4, true) / 65535;
  }
  return { positions, colors };
}
