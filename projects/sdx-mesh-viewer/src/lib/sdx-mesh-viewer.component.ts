import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
  inject,
} from '@angular/core';
import { SdxMeshTilesService, SdxMeshTilesStats } from './sdx-mesh-tiles.service';

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

  /** Full tileset.json URL, or leave empty and set meshId + apiBaseUrl. */
  @Input() tilesetUrl = '';
  @Input() meshId = '';
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

  private readonly tilesService = inject(SdxMeshTilesService);
  private viewReady = false;

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.reload();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.viewReady) {
      return;
    }
    if (
      changes['tilesetUrl'] ||
      changes['meshId'] ||
      changes['apiBaseUrl'] ||
      changes['accessToken']
    ) {
      this.reload();
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
    this.tilesService.dispose();
  }

  /** Live load / cache stats for the dev shell. */
  getStats(): SdxMeshTilesStats | null {
    return this.tilesService.getStats();
  }

  reload(): void {
    const url = this.resolveTilesetUrl();
    if (!url) {
      return;
    }
    this.tilesService.mount(this.hostRef.nativeElement, {
      tilesetUrl: url,
      accessToken: this.accessToken || undefined,
      displayBoxBounds: this.displayBoxBounds,
      displayParentBounds: this.displayParentBounds,
      ...this.budgetFromInputs(),
    });
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

  private resolveTilesetUrl(): string {
    if (this.tilesetUrl.trim()) {
      return this.tilesetUrl.trim();
    }
    if (!this.meshId.trim()) {
      return '';
    }
    const base = this.apiBaseUrl.replace(/\/$/, '');
    return `${base}/mesh/simple/${encodeURIComponent(this.meshId.trim())}/tileset.json`;
  }
}
