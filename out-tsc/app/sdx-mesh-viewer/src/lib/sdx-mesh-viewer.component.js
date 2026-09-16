import { Component, EventEmitter, Input, Output, ViewChild, inject, } from '@angular/core';
import { SdxMeshTilesService, } from './sdx-mesh-tiles.service';
import * as i0 from "@angular/core";
const _c0 = ["host"];
export class SdxMeshViewerComponent {
    hostRef;
    /** Full mesh tileset.json URL, or leave empty and set meshId + apiBaseUrl. */
    tilesetUrl = '';
    meshId = '';
    /** Full IFC tileset.json URL, or leave empty and set ifcId + apiBaseUrl. */
    ifcTilesetUrl = '';
    ifcId = '';
    apiBaseUrl = 'http://localhost:2546/service3d/v1';
    accessToken = '';
    /** Screen-space error target (higher = fewer tiles). */
    errorTarget = 6;
    /** Max refinement depth. Use a large number for unlimited. */
    maxDepth = 64;
    /** LRU cache tile count budget. */
    cacheMaxTiles = 800;
    /** LRU soft floor (count). */
    cacheMinTiles = 600;
    /** LRU memory budget in MB. */
    cacheMaxMb = 512;
    /** Parallel downloads. */
    maxDownloadJobs = 10;
    /** Parallel parses. */
    maxParseJobs = 1;
    /** Draw OBB helpers for currently loaded/visible tiles. */
    displayBoxBounds = false;
    /** Also draw ancestor tile bounds. */
    displayParentBounds = false;
    productsLoaded = new EventEmitter();
    loadError = new EventEmitter();
    tilesService = inject(SdxMeshTilesService);
    viewReady = false;
    reloadGeneration = 0;
    ngAfterViewInit() {
        this.viewReady = true;
        this.startReload();
    }
    ngOnChanges(changes) {
        if (!this.viewReady) {
            return;
        }
        if (changes['tilesetUrl'] ||
            changes['meshId'] ||
            changes['ifcTilesetUrl'] ||
            changes['ifcId'] ||
            changes['apiBaseUrl'] ||
            changes['accessToken']) {
            this.startReload();
            return;
        }
        if (changes['errorTarget'] ||
            changes['maxDepth'] ||
            changes['cacheMaxTiles'] ||
            changes['cacheMinTiles'] ||
            changes['cacheMaxMb'] ||
            changes['maxDownloadJobs'] ||
            changes['maxParseJobs']) {
            this.tilesService.applyTileBudget(this.budgetFromInputs());
        }
        if (changes['displayBoxBounds']) {
            this.tilesService.setDisplayBoxBounds(this.displayBoxBounds);
        }
        if (changes['displayParentBounds']) {
            this.tilesService.setDisplayParentBounds(this.displayParentBounds);
        }
    }
    ngOnDestroy() {
        this.reloadGeneration += 1;
        this.tilesService.dispose();
    }
    /** Live load / cache stats for the dev shell. */
    getStats() {
        return this.tilesService.getStats();
    }
    setProductVisible(componentId, visible) {
        this.tilesService.setProductVisible(componentId, visible);
    }
    setTypeVisible(ifcClass, visible) {
        this.tilesService.setTypeVisible(ifcClass, visible);
    }
    setProductHighlighted(componentId) {
        this.tilesService.setProductHighlighted(componentId);
    }
    showAllProducts() {
        this.tilesService.showAllProducts();
    }
    async reload() {
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
        const ifcUrl = this.resolveIfcTilesetUrl();
        const products = ifcUrl ? await this.loadProducts() : [];
        if (generation !== this.reloadGeneration) {
            return;
        }
        this.tilesService.setIfcTileset(ifcUrl || null, products);
        this.productsLoaded.emit(products);
    }
    budgetFromInputs() {
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
    resolveMeshTilesetUrl() {
        if (this.tilesetUrl.trim()) {
            return this.tilesetUrl.trim();
        }
        if (!this.meshId.trim()) {
            return '';
        }
        const base = this.apiBaseUrl.replace(/\/$/, '');
        return `${base}/mesh/simple/${encodeURIComponent(this.meshId.trim())}/tileset.json`;
    }
    resolveIfcTilesetUrl() {
        if (this.ifcTilesetUrl.trim()) {
            return this.ifcTilesetUrl.trim();
        }
        if (!this.ifcId.trim()) {
            return '';
        }
        const base = this.apiBaseUrl.replace(/\/$/, '');
        return `${base}/ifc/simple/${encodeURIComponent(this.ifcId.trim())}/tileset.json`;
    }
    async loadProducts() {
        if (!this.ifcId.trim() && !this.ifcTilesetUrl.trim()) {
            return [];
        }
        if (!this.ifcId.trim()) {
            return [];
        }
        const base = this.apiBaseUrl.replace(/\/$/, '');
        const id = encodeURIComponent(this.ifcId.trim());
        const headers = {};
        if (this.accessToken.trim()) {
            headers['Authorization'] = `Bearer ${this.accessToken.trim()}`;
        }
        const response = await fetch(`${base}/ifc/simple/${id}/manifest`, { headers });
        if (!response.ok) {
            throw new Error(`IFC manifest HTTP ${response.status}`);
        }
        const manifest = (await response.json());
        return manifest.components ?? [];
    }
    startReload() {
        void this.reload().catch((error) => {
            this.loadError.emit(error instanceof Error ? error.message : String(error));
        });
    }
    static ɵfac = function SdxMeshViewerComponent_Factory(__ngFactoryType__) { return new (__ngFactoryType__ || SdxMeshViewerComponent)(); };
    static ɵcmp = /*@__PURE__*/ i0.ɵɵdefineComponent({ type: SdxMeshViewerComponent, selectors: [["sdx-mesh-viewer"]], viewQuery: function SdxMeshViewerComponent_Query(rf, ctx) { if (rf & 1) {
            i0.ɵɵviewQuery(_c0, 7);
        } if (rf & 2) {
            let _t;
            i0.ɵɵqueryRefresh(_t = i0.ɵɵloadQuery()) && (ctx.hostRef = _t.first);
        } }, inputs: { tilesetUrl: "tilesetUrl", meshId: "meshId", ifcTilesetUrl: "ifcTilesetUrl", ifcId: "ifcId", apiBaseUrl: "apiBaseUrl", accessToken: "accessToken", errorTarget: "errorTarget", maxDepth: "maxDepth", cacheMaxTiles: "cacheMaxTiles", cacheMinTiles: "cacheMinTiles", cacheMaxMb: "cacheMaxMb", maxDownloadJobs: "maxDownloadJobs", maxParseJobs: "maxParseJobs", displayBoxBounds: "displayBoxBounds", displayParentBounds: "displayParentBounds" }, outputs: { productsLoaded: "productsLoaded", loadError: "loadError" }, features: [i0.ɵɵProvidersFeature([SdxMeshTilesService]), i0.ɵɵNgOnChangesFeature], decls: 2, vars: 0, consts: [["host", ""], [1, "sdx-mesh-viewer-host"]], template: function SdxMeshViewerComponent_Template(rf, ctx) { if (rf & 1) {
            i0.ɵɵelement(0, "div", 1, 0);
        } }, styles: ["[_nghost-%COMP%] {\n        display: block;\n        width: 100%;\n        height: 100%;\n      }\n      .sdx-mesh-viewer-host[_ngcontent-%COMP%] {\n        width: 100%;\n        height: 100%;\n        overflow: hidden;\n      }"] });
}
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(SdxMeshViewerComponent, [{
        type: Component,
        args: [{ selector: 'sdx-mesh-viewer', standalone: true, providers: [SdxMeshTilesService], template: `<div #host class="sdx-mesh-viewer-host"></div>`, styles: ["\n      :host {\n        display: block;\n        width: 100%;\n        height: 100%;\n      }\n      .sdx-mesh-viewer-host {\n        width: 100%;\n        height: 100%;\n        overflow: hidden;\n      }\n    "] }]
    }], null, { hostRef: [{
            type: ViewChild,
            args: ['host', { static: true }]
        }], tilesetUrl: [{
            type: Input
        }], meshId: [{
            type: Input
        }], ifcTilesetUrl: [{
            type: Input
        }], ifcId: [{
            type: Input
        }], apiBaseUrl: [{
            type: Input
        }], accessToken: [{
            type: Input
        }], errorTarget: [{
            type: Input
        }], maxDepth: [{
            type: Input
        }], cacheMaxTiles: [{
            type: Input
        }], cacheMinTiles: [{
            type: Input
        }], cacheMaxMb: [{
            type: Input
        }], maxDownloadJobs: [{
            type: Input
        }], maxParseJobs: [{
            type: Input
        }], displayBoxBounds: [{
            type: Input
        }], displayParentBounds: [{
            type: Input
        }], productsLoaded: [{
            type: Output
        }], loadError: [{
            type: Output
        }] }); })();
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassDebugInfo(SdxMeshViewerComponent, { className: "SdxMeshViewerComponent" }); })();
