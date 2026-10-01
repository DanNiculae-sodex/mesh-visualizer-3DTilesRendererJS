import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
  inject,
} from '@angular/core';
import {
  IfcProduct,
  SdxMeshTilesService,
  SdxMeshTilesStats,
  LineworkLayer,
} from './sdx-mesh-tiles.service';

@Component({
  selector: 'sdx-mesh-viewer',
  standalone: true,
  providers: [SdxMeshTilesService],
  template: `<div #host class="sdx-mesh-viewer-host"></div>`,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        height: 100%;
      }
      .sdx-mesh-viewer-host {
        width: 100%;
        height: 100%;
        overflow: hidden;
      }
    `,
  ],
})
export class SdxMeshViewerComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('host', { static: true }) hostRef!: ElementRef<HTMLDivElement>;

  /** Full mesh tileset.json URL, or leave empty and set projectId + meshId + apiBaseUrl. */
  @Input() tilesetUrl = '';
  /** Temporary until Nest resolves the project from the document, matching CS25D. */
  @Input() projectId = '';
  @Input() meshId = '';
  /** Full IFC tileset.json URL, or leave empty and set projectId + ifcId + apiBaseUrl. */
  @Input() ifcTilesetUrl = '';
  @Input() ifcId = '';
  @Input() lineworkTilesetUrl = '';
  @Input() lineworkId = '';
  /** Full CS25D metadata.json URL, or leave empty and set cs25dId + apiBaseUrl. */
  @Input() cs25dMetadataUrl = '';
  @Input() cs25dId = '';
  /** Full CS3D metadata.json URL, or leave empty and set cs3dId + apiBaseUrl. */
  @Input() cs3dMetadataUrl = '';
  @Input() cs3dId = '';
  @Input() apiBaseUrl = 'http://localhost:2546/service3d/v1';
  @Input() accessToken = '';

  /** Screen-space error target (higher = fewer tiles). */
  @Input() errorTarget = 6;
  /** Max refinement depth. Use a large number for unlimited. */
  @Input() maxDepth = 64;
  /** LRU cache tile count budget. */
  @Input() cacheMaxTiles = 800;
  /** LRU soft floor (count). */
  @Input() cacheMinTiles = 600;
  /** LRU memory budget in MB. */
  @Input() cacheMaxMb = 512;
  /** Parallel downloads. */
  @Input() maxDownloadJobs = 10;
  /** Parallel parses. */
  @Input() maxParseJobs = 1;

  /** Draw OBB helpers for currently loaded/visible tiles. */
  @Input() displayBoxBounds = false;
  /** Also draw ancestor tile bounds. */
  @Input() displayParentBounds = false;

  @Output() productsLoaded = new EventEmitter<IfcProduct[]>();
  @Output() lineworkLayersLoaded = new EventEmitter<LineworkLayer[]>();
  @Output() loadError = new EventEmitter<string>();

  private readonly tilesService = inject(SdxMeshTilesService);
  private viewReady = false;
  private reloadGeneration = 0;

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.startReload();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.viewReady) {
      return;
    }
    if (
      changes['tilesetUrl'] ||
      changes['projectId'] ||
      changes['meshId'] ||
      changes['ifcTilesetUrl'] ||
      changes['ifcId'] ||
      changes['lineworkTilesetUrl'] ||
      changes['lineworkId'] ||
      changes['cs25dMetadataUrl'] ||
      changes['cs25dId'] ||
      changes['cs3dMetadataUrl'] ||
      changes['cs3dId'] ||
      changes['apiBaseUrl'] ||
      changes['accessToken']
    ) {
      this.startReload();
      return;
    }
    if (
      changes['errorTarget'] ||
      changes['maxDepth'] ||
      changes['cacheMaxTiles'] ||
      changes['cacheMinTiles'] ||
      changes['cacheMaxMb'] ||
      changes['maxDownloadJobs'] ||
      changes['maxParseJobs']
    ) {
      this.tilesService.applyTileBudget(this.budgetFromInputs());
    }
    if (changes['displayBoxBounds']) {
      this.tilesService.setDisplayBoxBounds(this.displayBoxBounds);
    }
    if (changes['displayParentBounds']) {
      this.tilesService.setDisplayParentBounds(this.displayParentBounds);
    }
  }

  ngOnDestroy(): void {
    this.reloadGeneration += 1;
    this.tilesService.dispose();
  }

  /** Live load / cache stats for the dev shell. */
  getStats(): SdxMeshTilesStats | null {
    return this.tilesService.getStats();
  }

  setProductVisible(componentId: number, visible: boolean): void {
    this.tilesService.setProductVisible(componentId, visible);
  }

  setTypeVisible(ifcClass: string, visible: boolean): void {
    this.tilesService.setTypeVisible(ifcClass, visible);
  }

  setProductHighlighted(componentId: number | null): void {
    this.tilesService.setProductHighlighted(componentId);
  }

  showAllProducts(): void {
    this.tilesService.showAllProducts();
  }

  async reload(): Promise<void> {
    const generation = ++this.reloadGeneration;
    this.tilesService.ensureScene(this.hostRef.nativeElement);
    this.tilesService.setLayerOptions({
      accessToken: this.accessToken || undefined,
      displayBoxBounds: this.displayBoxBounds,
      displayParentBounds: this.displayParentBounds,
      ...this.budgetFromInputs(),
    });

    const meshUrl = this.resolveMeshTilesetUrl();
    this.tilesService.setMeshTileset(meshUrl || null);

    const cs25dPromise = this.tilesService.setPotreeLayer('cs25d', this.resolveCs25dMetadataUrl() || null);
    const cs3dPromise = this.tilesService.setPotreeLayer('cs3d', this.resolveCs3dMetadataUrl() || null);

    const ifcUrl = this.resolveIfcTilesetUrl();
    const products = ifcUrl ? await this.loadProducts() : [];
    if (generation !== this.reloadGeneration) {
      return;
    }
    this.tilesService.setIfcTileset(ifcUrl || null, products);
    this.productsLoaded.emit(products);

    const lineworkUrl = this.resolveLineworkTilesetUrl();
    const lineworkLayers = lineworkUrl ? await this.loadLineworkLayers() : [];
    if (generation !== this.reloadGeneration) {
      return;
    }
    this.tilesService.setLineworkTileset(lineworkUrl || null);
    this.lineworkLayersLoaded.emit(lineworkLayers);

    const pointErrors = (await Promise.all([cs25dPromise, cs3dPromise])).filter(
      (message): message is string => !!message,
    );
    if (generation !== this.reloadGeneration) {
      return;
    }
    if (pointErrors.length > 0) {
      throw new Error(pointErrors.join('; '));
    }
  }

  private budgetFromInputs() {
    return {
      errorTarget: Number(this.errorTarget),
      maxDepth: Number(this.maxDepth),
      cacheMaxTiles: Number(this.cacheMaxTiles),
      cacheMinTiles: Number(this.cacheMinTiles),
      cacheMaxBytes: Number(this.cacheMaxMb) * 1024 * 1024,
      maxDownloadJobs: Number(this.maxDownloadJobs),
      maxParseJobs: Number(this.maxParseJobs),
    };
  }

  private resolveCs25dMetadataUrl(): string {
    if (this.cs25dMetadataUrl.trim()) {
      return this.cs25dMetadataUrl.trim();
    }
    if (!this.cs25dId.trim()) {
      return '';
    }
    const base = this.apiBaseUrl.replace(/\/$/, '');
    const id = encodeURIComponent(this.cs25dId.trim());
    return `${base}/cube/simple/${id}/metadata.json`;
  }

  private resolveCs3dMetadataUrl(): string {
    if (this.cs3dMetadataUrl.trim()) {
      return this.cs3dMetadataUrl.trim();
    }
    if (!this.cs3dId.trim()) {
      return '';
    }
    const base = this.apiBaseUrl.replace(/\/$/, '');
    const id = encodeURIComponent(this.cs3dId.trim());
    return `${base}/cube-3d/simple/${id}/metadata.json`;
  }

  private resolveMeshTilesetUrl(): string {
    if (this.tilesetUrl.trim()) {
      return this.tilesetUrl.trim();
    }
    if (!this.projectId.trim() || !this.meshId.trim()) {
      return '';
    }
    const base = this.apiBaseUrl.replace(/\/$/, '');
    const projectId = encodeURIComponent(this.projectId.trim());
    const meshId = encodeURIComponent(this.meshId.trim());
    return `${base}/mesh/simple/${projectId}/${meshId}/tileset.json`;
  }

  private resolveIfcTilesetUrl(): string {
    if (this.ifcTilesetUrl.trim()) {
      return this.ifcTilesetUrl.trim();
    }
    if (!this.projectId.trim() || !this.ifcId.trim()) {
      return '';
    }
    const base = this.apiBaseUrl.replace(/\/$/, '');
    const projectId = encodeURIComponent(this.projectId.trim());
    const ifcId = encodeURIComponent(this.ifcId.trim());
    return `${base}/ifc/simple/${projectId}/${ifcId}/tileset.json`;
  }

  private resolveLineworkTilesetUrl(layerNames?: string[]): string {
    if (this.lineworkTilesetUrl.trim()) {
      return this.lineworkTilesetUrl.trim();
    }
    if (!this.projectId.trim() || !this.lineworkId.trim()) {
      return '';
    }
    const base = this.apiBaseUrl.replace(/\/$/, '');
    const projectId = encodeURIComponent(this.projectId.trim());
    const id = encodeURIComponent(this.lineworkId.trim());
    const url = `${base}/linework/simple/${projectId}/${id}/tileset.json`;
    if (layerNames === undefined) {
      return url;
    }
    if (layerNames.length === 0) {
      return `${url}?layers=__none__`;
    }
    return `${url}?layers=${encodeURIComponent(layerNames.join(','))}`;
  }

  applyLineworkLayerFilter(layerNames: string[] | null): void {
    if (!this.lineworkId.trim() && !this.lineworkTilesetUrl.trim()) {
      this.tilesService.setLineworkTileset(null);
      return;
    }
    if (layerNames === null) {
      this.tilesService.setLineworkTileset(this.resolveLineworkTilesetUrl());
      return;
    }
    this.tilesService.setLineworkTileset(this.resolveLineworkTilesetUrl(layerNames));
  }

  private async loadLineworkLayers(): Promise<LineworkLayer[]> {
    if (!this.projectId.trim() || !this.lineworkId.trim()) {
      return [];
    }
    const base = this.apiBaseUrl.replace(/\/$/, '');
    const projectId = encodeURIComponent(this.projectId.trim());
    const id = encodeURIComponent(this.lineworkId.trim());
    const headers: Record<string, string> = {};
    if (this.accessToken.trim()) {
      headers['Authorization'] = `Bearer ${this.accessToken.trim()}`;
    }
    const response = await fetch(`${base}/linework/simple/${projectId}/${id}/manifest`, { headers });
    if (!response.ok) {
      throw new Error(`Linework manifest HTTP ${response.status}`);
    }
    const manifest = (await response.json()) as { layers?: LineworkLayer[] };
    return manifest.layers ?? [];
  }

  private async loadProducts(): Promise<IfcProduct[]> {
    if (!this.ifcId.trim() && !this.ifcTilesetUrl.trim()) {
      return [];
    }
    if (!this.projectId.trim() || !this.ifcId.trim()) {
      return [];
    }
    const base = this.apiBaseUrl.replace(/\/$/, '');
    const projectId = encodeURIComponent(this.projectId.trim());
    const id = encodeURIComponent(this.ifcId.trim());
    const headers: Record<string, string> = {};
    if (this.accessToken.trim()) {
      headers['Authorization'] = `Bearer ${this.accessToken.trim()}`;
    }
    const response = await fetch(`${base}/ifc/simple/${projectId}/${id}/manifest`, { headers });
    if (!response.ok) {
      throw new Error(`IFC manifest HTTP ${response.status}`);
    }
    const manifest = (await response.json()) as { components?: IfcProduct[] };
    return manifest.components ?? [];
  }

  private startReload(): void {
    void this.reload().catch((error: unknown) => {
      this.loadError.emit(error instanceof Error ? error.message : String(error));
    });
  }
}
