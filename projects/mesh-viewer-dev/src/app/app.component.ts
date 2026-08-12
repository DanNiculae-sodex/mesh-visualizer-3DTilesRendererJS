import { Component, OnDestroy, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SdxMeshTilesStats, SdxMeshViewerComponent } from 'sdx-mesh-viewer';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule, SdxMeshViewerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnDestroy {
  @ViewChild(SdxMeshViewerComponent) viewer?: SdxMeshViewerComponent;

  apiBaseUrl = environment.apiBaseUrl;
  meshId = environment.defaultMeshId;
  accessToken = '';

  errorTarget = 6;
  maxDepth = 64;
  cacheMaxTiles = 800;
  cacheMinTiles = 600;
  cacheMaxMb = 512;
  maxDownloadJobs = 10;
  maxParseJobs = 1;

  displayBoxBounds = true;
  displayParentBounds = false;
  loadKey = 0;

  stats: SdxMeshTilesStats | null = null;
  private statsTimer = 0;

  constructor() {
    this.statsTimer = window.setInterval(() => {
      this.stats = this.viewer?.getStats() ?? null;
    }, 250);
  }

  ngOnDestroy(): void {
    window.clearInterval(this.statsTimer);
  }

  apply(): void {
    this.loadKey += 1;
  }
}
