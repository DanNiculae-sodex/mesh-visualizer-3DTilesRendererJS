import { GeoTIFF, GeoTIFFImage, TypedArray, fromArrayBuffer } from 'geotiff';
import {
  DataTexture,
  DoubleSide,
  Group,
  LinearFilter,
  LinearMipmapLinearFilter,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  RGBAFormat,
  SRGBColorSpace,
  Sphere,
  UnsignedByteType,
  WebGLRenderer,
} from 'three';

/** Longest texture edge. 4096 RGBA is 64 MB before mipmaps; larger rasters are downsampled. */
const MAX_TEXTURE_EDGE = 4096;

/** GDAL marks internal mask IFDs with this NewSubfileType bit. They carry no color. */
const SUBFILE_TYPE_MASK = 4;

/**
 * Loads one Service 3D orthophoto (cloud-optimized GeoTIFF) as a textured plane.
 * The plane is centered on its own bounds at Z = 0 and is not shifted by the
 * project origin, so it does not line up with the origin-relative layers.
 */
export class SdxOrthophotoLayer {
  readonly group = new Group();

  private mesh: Mesh<PlaneGeometry, MeshBasicMaterial> | null = null;
  private readonly abort = new AbortController();
  private disposed = false;

  constructor(
    private readonly tiffUrl: string,
    private readonly accessToken: string | undefined,
  ) {}

  async load(renderer: WebGLRenderer): Promise<void> {
    const tiff = await fromArrayBuffer(await this.fetchTiff(), this.abort.signal);
    const [minX, minY, maxX, maxY] = (await tiff.getImage(0)).getBoundingBox();
    const maxEdge = Math.min(MAX_TEXTURE_EDGE, renderer.capabilities.maxTextureSize);
    const image = await this.pickImage(tiff, maxEdge);
    const texture = await this.readTexture(image, maxEdge);
    if (this.disposed) {
      texture.dispose();
      return;
    }
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();

    const geometry = new PlaneGeometry(maxX - minX, maxY - minY);
    geometry.computeBoundingSphere();
    const material = new MeshBasicMaterial({ map: texture, side: DoubleSide, transparent: true });
    this.mesh = new Mesh(geometry, material);
    this.group.add(this.mesh);
  }

  getBoundingSphere(): Sphere | null {
    return this.mesh?.geometry.boundingSphere?.clone() ?? null;
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    this.abort.abort();
    if (this.mesh) {
      this.mesh.material.map?.dispose();
      this.mesh.material.dispose();
      this.mesh.geometry.dispose();
      this.mesh = null;
    }
    this.group.removeFromParent();
    this.group.clear();
  }

  private async fetchTiff(): Promise<ArrayBuffer> {
    const headers: Record<string, string> = {};
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }
    const response = await fetch(this.tiffUrl, { headers, signal: this.abort.signal });
    if (!response.ok) {
      throw new Error(`orthophoto HTTP ${response.status}`);
    }
    return response.arrayBuffer();
  }

  /** Largest COG level that fits the texture limit, otherwise the smallest level. */
  private async pickImage(tiff: GeoTIFF, maxEdge: number): Promise<GeoTIFFImage> {
    const count = await tiff.getImageCount();
    let fitting: GeoTIFFImage | null = null;
    let smallest: GeoTIFFImage | null = null;
    for (let index = 0; index < count; index += 1) {
      const image = await tiff.getImage(index);
      if ((image.fileDirectory.NewSubfileType ?? 0) & SUBFILE_TYPE_MASK) {
        continue;
      }
      const edge = Math.max(image.getWidth(), image.getHeight());
      if (edge <= maxEdge && (!fitting || edge > Math.max(fitting.getWidth(), fitting.getHeight()))) {
        fitting = image;
      }
      if (!smallest || edge < Math.max(smallest.getWidth(), smallest.getHeight())) {
        smallest = image;
      }
    }
    const image = fitting ?? smallest;
    if (!image) {
      throw new Error('orthophoto has no color image');
    }
    return image;
  }

  private async readTexture(image: GeoTIFFImage, maxEdge: number): Promise<DataTexture> {
    if (image.getBitsPerSample() !== 8) {
      throw new Error(`orthophoto has ${image.getBitsPerSample()}-bit samples; only 8-bit is supported`);
    }
    const scale = Math.min(1, maxEdge / Math.max(image.getWidth(), image.getHeight()));
    const width = Math.max(1, Math.round(image.getWidth() * scale));
    const height = Math.max(1, Math.round(image.getHeight() * scale));
    const raster = (await image.readRGB({
      interleave: true,
      enableAlpha: true,
      width,
      height,
      signal: this.abort.signal,
    })) as TypedArray;

    const texture = new DataTexture(toRgbaFlipped(raster, width, height), width, height, RGBAFormat, UnsignedByteType);
    texture.colorSpace = SRGBColorSpace;
    texture.minFilter = LinearMipmapLinearFilter;
    texture.magFilter = LinearFilter;
    texture.generateMipmaps = true;
    texture.needsUpdate = true;
    return texture;
  }
}

/** TIFF row 0 is north; texture row 0 maps to the plane's south edge (v = 0). */
function toRgbaFlipped(raster: TypedArray, width: number, height: number): Uint8Array {
  const channels = raster.length / (width * height);
  const rgba = new Uint8Array(width * height * 4);
  for (let row = 0; row < height; row += 1) {
    const srcRow = row * width * channels;
    const dstRow = (height - 1 - row) * width * 4;
    for (let col = 0; col < width; col += 1) {
      const src = srcRow + col * channels;
      const dst = dstRow + col * 4;
      rgba[dst] = raster[src];
      rgba[dst + 1] = raster[src + 1];
      rgba[dst + 2] = raster[src + 2];
      rgba[dst + 3] = channels === 4 ? raster[src + 3] : 255;
    }
  }
  return rgba;
}
