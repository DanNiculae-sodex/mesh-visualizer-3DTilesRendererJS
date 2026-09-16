import { Component, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SdxMeshViewerComponent, } from 'sdx-mesh-viewer';
import { environment } from '../environments/environment';
import * as i0 from "@angular/core";
import * as i1 from "@angular/forms";
const _forTrack0 = ($index, $item) => $item.name;
const _forTrack1 = ($index, $item) => $item.ifc_class;
const _forTrack2 = ($index, $item) => $item.component_id;
function AppComponent_Conditional_20_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "p", 2);
    i0.ɵɵtext(1);
    i0.ɵɵelementEnd();
} if (rf & 2) {
    const ctx_r0 = i0.ɵɵnextContext();
    i0.ɵɵadvance();
    i0.ɵɵtextInterpolate(ctx_r0.catalogError);
} }
function AppComponent_Conditional_21_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "p", 2);
    i0.ɵɵtext(1, "Load an IFC id to browse its elements.");
    i0.ɵɵelementEnd();
} }
function AppComponent_For_30_Conditional_7_For_2_Conditional_0_Conditional_7_For_2_Conditional_0_Template(rf, ctx) { if (rf & 1) {
    const _r6 = i0.ɵɵgetCurrentView();
    i0.ɵɵelementStart(0, "label", 33);
    i0.ɵɵlistener("mouseenter", function AppComponent_For_30_Conditional_7_For_2_Conditional_0_Conditional_7_For_2_Conditional_0_Template_label_mouseenter_0_listener() { i0.ɵɵrestoreView(_r6); const product_r7 = i0.ɵɵnextContext().$implicit; const ctx_r0 = i0.ɵɵnextContext(6); return i0.ɵɵresetView(ctx_r0.onProductHover(product_r7)); })("mouseleave", function AppComponent_For_30_Conditional_7_For_2_Conditional_0_Conditional_7_For_2_Conditional_0_Template_label_mouseleave_0_listener() { i0.ɵɵrestoreView(_r6); const ctx_r0 = i0.ɵɵnextContext(7); return i0.ɵɵresetView(ctx_r0.onProductHover(null)); });
    i0.ɵɵelementStart(1, "input", 34);
    i0.ɵɵtwoWayListener("ngModelChange", function AppComponent_For_30_Conditional_7_For_2_Conditional_0_Conditional_7_For_2_Conditional_0_Template_input_ngModelChange_1_listener($event) { i0.ɵɵrestoreView(_r6); const product_r7 = i0.ɵɵnextContext().$implicit; i0.ɵɵtwoWayBindingSet(product_r7.enabled, $event) || (product_r7.enabled = $event); return i0.ɵɵresetView($event); });
    i0.ɵɵlistener("ngModelChange", function AppComponent_For_30_Conditional_7_For_2_Conditional_0_Conditional_7_For_2_Conditional_0_Template_input_ngModelChange_1_listener() { i0.ɵɵrestoreView(_r6); const product_r7 = i0.ɵɵnextContext().$implicit; const type_r5 = i0.ɵɵnextContext(3).$implicit; const category_r3 = i0.ɵɵnextContext(2).$implicit; const ctx_r0 = i0.ɵɵnextContext(); return i0.ɵɵresetView(ctx_r0.onProductToggle(category_r3, type_r5, product_r7)); });
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(2, "span");
    i0.ɵɵtext(3);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(4, "small");
    i0.ɵɵtext(5);
    i0.ɵɵelementEnd()();
} if (rf & 2) {
    const product_r7 = i0.ɵɵnextContext().$implicit;
    const ctx_r0 = i0.ɵɵnextContext(6);
    i0.ɵɵadvance();
    i0.ɵɵtwoWayProperty("ngModel", product_r7.enabled);
    i0.ɵɵproperty("name", "product-" + product_r7.component_id);
    i0.ɵɵadvance(2);
    i0.ɵɵtextInterpolate(ctx_r0.productLabel(product_r7));
    i0.ɵɵadvance(2);
    i0.ɵɵtextInterpolate1("#", product_r7.express_id, "");
} }
function AppComponent_For_30_Conditional_7_For_2_Conditional_0_Conditional_7_For_2_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵtemplate(0, AppComponent_For_30_Conditional_7_For_2_Conditional_0_Conditional_7_For_2_Conditional_0_Template, 6, 4, "label", 32);
} if (rf & 2) {
    const product_r7 = ctx.$implicit;
    const type_r5 = i0.ɵɵnextContext(3).$implicit;
    const category_r3 = i0.ɵɵnextContext(2).$implicit;
    const ctx_r0 = i0.ɵɵnextContext();
    i0.ɵɵconditional(ctx_r0.matchesProduct(category_r3, type_r5, product_r7) ? 0 : -1);
} }
function AppComponent_For_30_Conditional_7_For_2_Conditional_0_Conditional_7_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "div", 31);
    i0.ɵɵrepeaterCreate(1, AppComponent_For_30_Conditional_7_For_2_Conditional_0_Conditional_7_For_2_Template, 1, 1, null, null, _forTrack2);
    i0.ɵɵelementEnd();
} if (rf & 2) {
    const type_r5 = i0.ɵɵnextContext(2).$implicit;
    i0.ɵɵadvance();
    i0.ɵɵrepeater(type_r5.products);
} }
function AppComponent_For_30_Conditional_7_For_2_Conditional_0_Template(rf, ctx) { if (rf & 1) {
    const _r4 = i0.ɵɵgetCurrentView();
    i0.ɵɵelementStart(0, "details", 30);
    i0.ɵɵlistener("toggle", function AppComponent_For_30_Conditional_7_For_2_Conditional_0_Template_details_toggle_0_listener($event) { i0.ɵɵrestoreView(_r4); const type_r5 = i0.ɵɵnextContext().$implicit; return i0.ɵɵresetView(type_r5.expanded = $event.target.open); });
    i0.ɵɵelementStart(1, "summary")(2, "input", 27);
    i0.ɵɵtwoWayListener("ngModelChange", function AppComponent_For_30_Conditional_7_For_2_Conditional_0_Template_input_ngModelChange_2_listener($event) { i0.ɵɵrestoreView(_r4); const type_r5 = i0.ɵɵnextContext().$implicit; i0.ɵɵtwoWayBindingSet(type_r5.enabled, $event) || (type_r5.enabled = $event); return i0.ɵɵresetView($event); });
    i0.ɵɵlistener("click", function AppComponent_For_30_Conditional_7_For_2_Conditional_0_Template_input_click_2_listener($event) { i0.ɵɵrestoreView(_r4); return i0.ɵɵresetView($event.stopPropagation()); })("ngModelChange", function AppComponent_For_30_Conditional_7_For_2_Conditional_0_Template_input_ngModelChange_2_listener() { i0.ɵɵrestoreView(_r4); const type_r5 = i0.ɵɵnextContext().$implicit; const category_r3 = i0.ɵɵnextContext(2).$implicit; const ctx_r0 = i0.ɵɵnextContext(); return i0.ɵɵresetView(ctx_r0.onTypeToggle(category_r3, type_r5)); });
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(3, "span");
    i0.ɵɵtext(4);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(5, "small");
    i0.ɵɵtext(6);
    i0.ɵɵelementEnd()();
    i0.ɵɵtemplate(7, AppComponent_For_30_Conditional_7_For_2_Conditional_0_Conditional_7_Template, 3, 0, "div", 31);
    i0.ɵɵelementEnd();
} if (rf & 2) {
    const type_r5 = i0.ɵɵnextContext().$implicit;
    const ctx_r0 = i0.ɵɵnextContext(3);
    i0.ɵɵproperty("open", type_r5.expanded);
    i0.ɵɵadvance(2);
    i0.ɵɵtwoWayProperty("ngModel", type_r5.enabled);
    i0.ɵɵproperty("indeterminate", ctx_r0.isTypePartial(type_r5))("name", "type-" + type_r5.ifc_class);
    i0.ɵɵadvance(2);
    i0.ɵɵtextInterpolate(type_r5.ifc_class);
    i0.ɵɵadvance(2);
    i0.ɵɵtextInterpolate(type_r5.products.length);
    i0.ɵɵadvance();
    i0.ɵɵconditional(type_r5.expanded ? 7 : -1);
} }
function AppComponent_For_30_Conditional_7_For_2_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵtemplate(0, AppComponent_For_30_Conditional_7_For_2_Conditional_0_Template, 8, 7, "details", 29);
} if (rf & 2) {
    const type_r5 = ctx.$implicit;
    const category_r3 = i0.ɵɵnextContext(2).$implicit;
    const ctx_r0 = i0.ɵɵnextContext();
    i0.ɵɵconditional(ctx_r0.matchesType(category_r3, type_r5) ? 0 : -1);
} }
function AppComponent_For_30_Conditional_7_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "div", 28);
    i0.ɵɵrepeaterCreate(1, AppComponent_For_30_Conditional_7_For_2_Template, 1, 1, null, null, _forTrack1);
    i0.ɵɵelementEnd();
} if (rf & 2) {
    const category_r3 = i0.ɵɵnextContext().$implicit;
    i0.ɵɵadvance();
    i0.ɵɵrepeater(category_r3.types);
} }
function AppComponent_For_30_Template(rf, ctx) { if (rf & 1) {
    const _r2 = i0.ɵɵgetCurrentView();
    i0.ɵɵelementStart(0, "details", 26);
    i0.ɵɵlistener("toggle", function AppComponent_For_30_Template_details_toggle_0_listener($event) { const category_r3 = i0.ɵɵrestoreView(_r2).$implicit; return i0.ɵɵresetView(category_r3.expanded = $event.target.open); });
    i0.ɵɵelementStart(1, "summary")(2, "input", 27);
    i0.ɵɵtwoWayListener("ngModelChange", function AppComponent_For_30_Template_input_ngModelChange_2_listener($event) { const category_r3 = i0.ɵɵrestoreView(_r2).$implicit; i0.ɵɵtwoWayBindingSet(category_r3.enabled, $event) || (category_r3.enabled = $event); return i0.ɵɵresetView($event); });
    i0.ɵɵlistener("click", function AppComponent_For_30_Template_input_click_2_listener($event) { i0.ɵɵrestoreView(_r2); return i0.ɵɵresetView($event.stopPropagation()); })("ngModelChange", function AppComponent_For_30_Template_input_ngModelChange_2_listener() { const category_r3 = i0.ɵɵrestoreView(_r2).$implicit; const ctx_r0 = i0.ɵɵnextContext(); return i0.ɵɵresetView(ctx_r0.onCategoryToggle(category_r3)); });
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(3, "span");
    i0.ɵɵtext(4);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(5, "small");
    i0.ɵɵtext(6);
    i0.ɵɵelementEnd()();
    i0.ɵɵtemplate(7, AppComponent_For_30_Conditional_7_Template, 3, 0, "div", 28);
    i0.ɵɵelementEnd();
} if (rf & 2) {
    const category_r3 = ctx.$implicit;
    const ctx_r0 = i0.ɵɵnextContext();
    i0.ɵɵproperty("open", category_r3.expanded);
    i0.ɵɵadvance(2);
    i0.ɵɵtwoWayProperty("ngModel", category_r3.enabled);
    i0.ɵɵproperty("indeterminate", ctx_r0.isCategoryPartial(category_r3))("name", "category-" + category_r3.name);
    i0.ɵɵadvance(2);
    i0.ɵɵtextInterpolate(category_r3.name);
    i0.ɵɵadvance(2);
    i0.ɵɵtextInterpolate(category_r3.types.length);
    i0.ɵɵadvance();
    i0.ɵɵconditional(category_r3.expanded ? 7 : -1);
} }
function AppComponent_Conditional_66_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "div", 22)(1, "div");
    i0.ɵɵtext(2);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(3, "div");
    i0.ɵɵtext(4);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(5, "div");
    i0.ɵɵtext(6);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(7, "div");
    i0.ɵɵtext(8);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(9, "div");
    i0.ɵɵtext(10);
    i0.ɵɵelementEnd()();
} if (rf & 2) {
    const ctx_r0 = i0.ɵɵnextContext();
    i0.ɵɵadvance(2);
    i0.ɵɵtextInterpolate1("Visible: ", ctx_r0.stats.visible, "");
    i0.ɵɵadvance(2);
    i0.ɵɵtextInterpolate2("Cached: ", ctx_r0.stats.cached, " / ", ctx_r0.stats.cacheMaxTiles, "");
    i0.ɵɵadvance(2);
    i0.ɵɵtextInterpolate1("Downloading: ", ctx_r0.stats.downloading, "");
    i0.ɵɵadvance(2);
    i0.ɵɵtextInterpolate1("Parsing: ", ctx_r0.stats.parsing, "");
    i0.ɵɵadvance(2);
    i0.ɵɵtextInterpolate2("Products: ", ctx_r0.stats.productsVisible, " / ", ctx_r0.stats.productsTotal, "");
} }
const SPATIAL_CLASSES = new Set([
    'IFCBUILDING',
    'IFCBUILDINGSTOREY',
    'IFCPROJECT',
    'IFCSITE',
    'IFCSPACE',
]);
const STRUCTURAL_CLASS_PARTS = [
    'BEAM',
    'COLUMN',
    'FOOTING',
    'MEMBER',
    'PILE',
    'PLATE',
    'REINFORC',
    'ROOF',
    'SLAB',
    'STAIR',
    'WALL',
];
const MEP_CLASS_PARTS = [
    'CABLE',
    'CHILLER',
    'COIL',
    'CONTROLLER',
    'DAMPER',
    'DISTRIBUTION',
    'DUCT',
    'ENGINE',
    'FAN',
    'FILTER',
    'FLOW',
    'PIP',
    'PUMP',
    'SENSOR',
    'TANK',
    'TRANSFORMER',
    'VALVE',
];
export class AppComponent {
    viewer;
    apiBaseUrl = environment.apiBaseUrl;
    meshId = environment.defaultMeshId;
    ifcId = environment.defaultIfcId;
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
    catalog = [];
    products = [];
    productSearch = '';
    catalogError = '';
    stats = null;
    statsTimer = 0;
    constructor() {
        this.statsTimer = window.setInterval(() => {
            this.stats = this.viewer?.getStats() ?? null;
        }, 250);
    }
    ngOnDestroy() {
        window.clearInterval(this.statsTimer);
    }
    get filteredCatalog() {
        const query = this.productSearch.trim().toLowerCase();
        if (!query) {
            return this.catalog;
        }
        return this.catalog.filter((category) => category.name.toLowerCase().includes(query) ||
            category.types.some((type) => type.ifc_class.toLowerCase().includes(query) ||
                type.products.some((product) => this.productMatches(product, query))));
    }
    matchesType(category, type) {
        const query = this.productSearch.trim().toLowerCase();
        return (!query ||
            category.name.toLowerCase().includes(query) ||
            type.ifc_class.toLowerCase().includes(query) ||
            type.products.some((product) => this.productMatches(product, query)));
    }
    matchesProduct(category, type, product) {
        const query = this.productSearch.trim().toLowerCase();
        return (!query ||
            category.name.toLowerCase().includes(query) ||
            type.ifc_class.toLowerCase().includes(query) ||
            this.productMatches(product, query));
    }
    async apply() {
        this.catalogError = '';
        try {
            await this.viewer?.reload();
        }
        catch (error) {
            this.catalogError = error instanceof Error ? error.message : String(error);
        }
    }
    onProductsLoaded(products) {
        this.products = products.map((product) => ({ ...product, enabled: true }));
        const categoryTypes = new Map();
        for (const product of this.products) {
            const categoryName = this.categoryForClass(product.ifc_class);
            const types = categoryTypes.get(categoryName) ?? new Map();
            const typeProducts = types.get(product.ifc_class) ?? [];
            typeProducts.push(product);
            types.set(product.ifc_class, typeProducts);
            categoryTypes.set(categoryName, types);
        }
        this.catalog = [...categoryTypes.entries()]
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([name, types]) => ({
            name,
            enabled: true,
            expanded: false,
            types: [...types.entries()]
                .sort(([left], [right]) => left.localeCompare(right))
                .map(([ifcClass, typeProducts]) => ({
                ifc_class: ifcClass,
                enabled: true,
                expanded: false,
                products: typeProducts.sort((left, right) => this.productLabel(left).localeCompare(this.productLabel(right))),
            })),
        }));
    }
    onCategoryToggle(category) {
        for (const type of category.types) {
            type.enabled = category.enabled;
            for (const product of type.products) {
                product.enabled = category.enabled;
            }
            this.viewer?.setTypeVisible(type.ifc_class, category.enabled);
        }
    }
    onTypeToggle(category, type) {
        this.viewer?.setTypeVisible(type.ifc_class, type.enabled);
        for (const product of type.products) {
            product.enabled = type.enabled;
        }
        category.enabled = category.types.every((entry) => entry.enabled);
    }
    onProductToggle(category, type, product) {
        this.viewer?.setProductVisible(product.component_id, product.enabled);
        type.enabled = type.products.every((entry) => entry.enabled);
        category.enabled = category.types.every((entry) => entry.enabled);
    }
    onProductHover(product) {
        this.viewer?.setProductHighlighted(product?.component_id ?? null);
    }
    onSearchChange(queryValue) {
        const query = queryValue.trim().toLowerCase();
        if (!query) {
            return;
        }
        for (const category of this.catalog) {
            category.expanded =
                category.name.toLowerCase().includes(query) ||
                    category.types.some((type) => type.ifc_class.toLowerCase().includes(query) ||
                        type.products.some((product) => this.productMatches(product, query)));
            for (const type of category.types) {
                type.expanded =
                    category.name.toLowerCase().includes(query) ||
                        type.ifc_class.toLowerCase().includes(query) ||
                        type.products.some((product) => this.productMatches(product, query));
            }
        }
    }
    isCategoryPartial(category) {
        const enabledCount = category.types.filter((type) => type.products.some((product) => product.enabled)).length;
        return enabledCount > 0 && !category.enabled;
    }
    isTypePartial(type) {
        return type.products.some((product) => product.enabled) && !type.enabled;
    }
    productLabel(product) {
        return product.name?.trim() || `${product.ifc_class} #${product.express_id}`;
    }
    showAll() {
        this.viewer?.showAllProducts();
        for (const product of this.products) {
            product.enabled = true;
        }
        for (const category of this.catalog) {
            category.enabled = true;
            for (const type of category.types) {
                type.enabled = true;
            }
        }
    }
    categoryForClass(ifcClass) {
        const normalized = ifcClass.toUpperCase();
        if (SPATIAL_CLASSES.has(normalized)) {
            return 'Spatial structure';
        }
        if (normalized.includes('DOOR') || normalized.includes('WINDOW')) {
            return 'Doors and windows';
        }
        if (normalized.includes('OPENING')) {
            return 'Openings';
        }
        if (STRUCTURAL_CLASS_PARTS.some((part) => normalized.includes(part))) {
            return 'Building and structural elements';
        }
        if (MEP_CLASS_PARTS.some((part) => normalized.includes(part))) {
            return 'Building services';
        }
        if (normalized.includes('FURNISH') ||
            normalized.includes('FURNITURE') ||
            normalized.includes('APPLIANCE')) {
            return 'Furnishings';
        }
        return 'Other elements';
    }
    productMatches(product, query) {
        return [
            product.name ?? '',
            product.global_id ?? '',
            String(product.express_id),
            product.ifc_class,
        ].some((value) => value.toLowerCase().includes(query));
    }
    static ɵfac = function AppComponent_Factory(__ngFactoryType__) { return new (__ngFactoryType__ || AppComponent)(); };
    static ɵcmp = /*@__PURE__*/ i0.ɵɵdefineComponent({ type: AppComponent, selectors: [["app-root"]], viewQuery: function AppComponent_Query(rf, ctx) { if (rf & 1) {
            i0.ɵɵviewQuery(SdxMeshViewerComponent, 5);
        } if (rf & 2) {
            let _t;
            i0.ɵɵqueryRefresh(_t = i0.ɵɵloadQuery()) && (ctx.viewer = _t.first);
        } }, decls: 76, vars: 35, consts: [[1, "shell"], [1, "panel"], [1, "hint"], ["name", "apiBaseUrl", 3, "ngModelChange", "ngModel"], ["name", "meshId", 3, "ngModelChange", "ngModel"], ["name", "ifcId", 3, "ngModelChange", "ngModel"], ["name", "accessToken", "type", "password", "autocomplete", "off", 3, "ngModelChange", "ngModel"], [1, "navigation-actions"], ["type", "button", 3, "click"], ["name", "productSearch", "placeholder", "Search model", "aria-label", "Search model", 3, "ngModelChange", "ngModel"], ["aria-label", "IFC model elements", 1, "model-tree"], [1, "tree-category", 3, "open"], ["name", "errorTarget", "type", "number", "min", "1", "step", "1", 3, "ngModelChange", "ngModel"], ["name", "maxDepth", "type", "number", "min", "1", "step", "1", 3, "ngModelChange", "ngModel"], ["name", "cacheMaxTiles", "type", "number", "min", "10", "step", "10", 3, "ngModelChange", "ngModel"], ["name", "cacheMinTiles", "type", "number", "min", "0", "step", "10", 3, "ngModelChange", "ngModel"], ["name", "cacheMaxMb", "type", "number", "min", "32", "step", "32", 3, "ngModelChange", "ngModel"], ["name", "maxDownloadJobs", "type", "number", "min", "1", "step", "1", 3, "ngModelChange", "ngModel"], ["name", "maxParseJobs", "type", "number", "min", "1", "step", "1", 3, "ngModelChange", "ngModel"], [1, "checkbox"], ["name", "displayBoxBounds", "type", "checkbox", 3, "ngModelChange", "ngModel"], ["name", "displayParentBounds", "type", "checkbox", 3, "ngModelChange", "ngModel"], [1, "stats"], [1, "footer"], [1, "viewport"], [3, "productsLoaded", "loadError", "meshId", "ifcId", "apiBaseUrl", "accessToken", "errorTarget", "maxDepth", "cacheMaxTiles", "cacheMinTiles", "cacheMaxMb", "maxDownloadJobs", "maxParseJobs", "displayBoxBounds", "displayParentBounds"], [1, "tree-category", 3, "toggle", "open"], ["type", "checkbox", 3, "ngModelChange", "click", "ngModel", "indeterminate", "name"], [1, "tree-children"], [1, "tree-type", 3, "open"], [1, "tree-type", 3, "toggle", "open"], [1, "tree-children", "product-list"], [1, "tree-product"], [1, "tree-product", 3, "mouseenter", "mouseleave"], ["type", "checkbox", 3, "ngModelChange", "ngModel", "name"]], template: function AppComponent_Template(rf, ctx) { if (rf & 1) {
            i0.ɵɵelementStart(0, "div", 0)(1, "aside", 1)(2, "h1");
            i0.ɵɵtext(3, "SDX Mesh Viewer");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(4, "p", 2);
            i0.ɵɵtext(5, " Dev-only shell for LOD mesh and typed IFC streaming against Service 3D. Both layers share one Z-up ENH viewport (X east, Y north, Z height). ");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(6, "label");
            i0.ɵɵtext(7, " API base ");
            i0.ɵɵelementStart(8, "input", 3);
            i0.ɵɵtwoWayListener("ngModelChange", function AppComponent_Template_input_ngModelChange_8_listener($event) { i0.ɵɵtwoWayBindingSet(ctx.apiBaseUrl, $event) || (ctx.apiBaseUrl = $event); return $event; });
            i0.ɵɵelementEnd()();
            i0.ɵɵelementStart(9, "label");
            i0.ɵɵtext(10, " Mesh id ");
            i0.ɵɵelementStart(11, "input", 4);
            i0.ɵɵtwoWayListener("ngModelChange", function AppComponent_Template_input_ngModelChange_11_listener($event) { i0.ɵɵtwoWayBindingSet(ctx.meshId, $event) || (ctx.meshId = $event); return $event; });
            i0.ɵɵelementEnd()();
            i0.ɵɵelementStart(12, "label");
            i0.ɵɵtext(13, " IFC id ");
            i0.ɵɵelementStart(14, "input", 5);
            i0.ɵɵtwoWayListener("ngModelChange", function AppComponent_Template_input_ngModelChange_14_listener($event) { i0.ɵɵtwoWayBindingSet(ctx.ifcId, $event) || (ctx.ifcId = $event); return $event; });
            i0.ɵɵelementEnd()();
            i0.ɵɵelementStart(15, "label");
            i0.ɵɵtext(16, " Access token ");
            i0.ɵɵelementStart(17, "input", 6);
            i0.ɵɵtwoWayListener("ngModelChange", function AppComponent_Template_input_ngModelChange_17_listener($event) { i0.ɵɵtwoWayBindingSet(ctx.accessToken, $event) || (ctx.accessToken = $event); return $event; });
            i0.ɵɵelementEnd()();
            i0.ɵɵelementStart(18, "h2");
            i0.ɵɵtext(19, "IFC navigation");
            i0.ɵɵelementEnd();
            i0.ɵɵtemplate(20, AppComponent_Conditional_20_Template, 2, 1, "p", 2)(21, AppComponent_Conditional_21_Template, 2, 0, "p", 2);
            i0.ɵɵelementStart(22, "div", 7)(23, "button", 8);
            i0.ɵɵlistener("click", function AppComponent_Template_button_click_23_listener() { return ctx.showAll(); });
            i0.ɵɵtext(24, "Show all");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(25, "input", 9);
            i0.ɵɵtwoWayListener("ngModelChange", function AppComponent_Template_input_ngModelChange_25_listener($event) { i0.ɵɵtwoWayBindingSet(ctx.productSearch, $event) || (ctx.productSearch = $event); return $event; });
            i0.ɵɵlistener("ngModelChange", function AppComponent_Template_input_ngModelChange_25_listener($event) { return ctx.onSearchChange($event); });
            i0.ɵɵelementEnd()();
            i0.ɵɵelementStart(26, "p", 2);
            i0.ɵɵtext(27);
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(28, "nav", 10);
            i0.ɵɵrepeaterCreate(29, AppComponent_For_30_Template, 8, 7, "details", 11, _forTrack0);
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(31, "h2");
            i0.ɵɵtext(32, "Tile budget");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(33, "p", 2);
            i0.ɵɵtext(34, " Higher error target and lower cache limits load fewer tiles (better for weak devices). ");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(35, "label");
            i0.ɵɵtext(36, " Error target ");
            i0.ɵɵelementStart(37, "input", 12);
            i0.ɵɵtwoWayListener("ngModelChange", function AppComponent_Template_input_ngModelChange_37_listener($event) { i0.ɵɵtwoWayBindingSet(ctx.errorTarget, $event) || (ctx.errorTarget = $event); return $event; });
            i0.ɵɵelementEnd()();
            i0.ɵɵelementStart(38, "label");
            i0.ɵɵtext(39, " Max depth ");
            i0.ɵɵelementStart(40, "input", 13);
            i0.ɵɵtwoWayListener("ngModelChange", function AppComponent_Template_input_ngModelChange_40_listener($event) { i0.ɵɵtwoWayBindingSet(ctx.maxDepth, $event) || (ctx.maxDepth = $event); return $event; });
            i0.ɵɵelementEnd()();
            i0.ɵɵelementStart(41, "label");
            i0.ɵɵtext(42, " Cache max tiles ");
            i0.ɵɵelementStart(43, "input", 14);
            i0.ɵɵtwoWayListener("ngModelChange", function AppComponent_Template_input_ngModelChange_43_listener($event) { i0.ɵɵtwoWayBindingSet(ctx.cacheMaxTiles, $event) || (ctx.cacheMaxTiles = $event); return $event; });
            i0.ɵɵelementEnd()();
            i0.ɵɵelementStart(44, "label");
            i0.ɵɵtext(45, " Cache min tiles ");
            i0.ɵɵelementStart(46, "input", 15);
            i0.ɵɵtwoWayListener("ngModelChange", function AppComponent_Template_input_ngModelChange_46_listener($event) { i0.ɵɵtwoWayBindingSet(ctx.cacheMinTiles, $event) || (ctx.cacheMinTiles = $event); return $event; });
            i0.ɵɵelementEnd()();
            i0.ɵɵelementStart(47, "label");
            i0.ɵɵtext(48, " Cache max MB ");
            i0.ɵɵelementStart(49, "input", 16);
            i0.ɵɵtwoWayListener("ngModelChange", function AppComponent_Template_input_ngModelChange_49_listener($event) { i0.ɵɵtwoWayBindingSet(ctx.cacheMaxMb, $event) || (ctx.cacheMaxMb = $event); return $event; });
            i0.ɵɵelementEnd()();
            i0.ɵɵelementStart(50, "label");
            i0.ɵɵtext(51, " Max download jobs ");
            i0.ɵɵelementStart(52, "input", 17);
            i0.ɵɵtwoWayListener("ngModelChange", function AppComponent_Template_input_ngModelChange_52_listener($event) { i0.ɵɵtwoWayBindingSet(ctx.maxDownloadJobs, $event) || (ctx.maxDownloadJobs = $event); return $event; });
            i0.ɵɵelementEnd()();
            i0.ɵɵelementStart(53, "label");
            i0.ɵɵtext(54, " Max parse jobs ");
            i0.ɵɵelementStart(55, "input", 18);
            i0.ɵɵtwoWayListener("ngModelChange", function AppComponent_Template_input_ngModelChange_55_listener($event) { i0.ɵɵtwoWayBindingSet(ctx.maxParseJobs, $event) || (ctx.maxParseJobs = $event); return $event; });
            i0.ɵɵelementEnd()();
            i0.ɵɵelementStart(56, "h2");
            i0.ɵɵtext(57, "Debug");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(58, "label", 19)(59, "input", 20);
            i0.ɵɵtwoWayListener("ngModelChange", function AppComponent_Template_input_ngModelChange_59_listener($event) { i0.ɵɵtwoWayBindingSet(ctx.displayBoxBounds, $event) || (ctx.displayBoxBounds = $event); return $event; });
            i0.ɵɵelementEnd();
            i0.ɵɵtext(60, " Show tile bounding boxes ");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(61, "label", 19)(62, "input", 21);
            i0.ɵɵtwoWayListener("ngModelChange", function AppComponent_Template_input_ngModelChange_62_listener($event) { i0.ɵɵtwoWayBindingSet(ctx.displayParentBounds, $event) || (ctx.displayParentBounds = $event); return $event; });
            i0.ɵɵelementEnd();
            i0.ɵɵtext(63, " Show parent bounds ");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(64, "button", 8);
            i0.ɵɵlistener("click", function AppComponent_Template_button_click_64_listener() { return ctx.apply(); });
            i0.ɵɵtext(65, "Load / reload");
            i0.ɵɵelementEnd();
            i0.ɵɵtemplate(66, AppComponent_Conditional_66_Template, 11, 7, "div", 22);
            i0.ɵɵelementStart(67, "p", 23);
            i0.ɵɵtext(68, " Expects ");
            i0.ɵɵelementStart(69, "code");
            i0.ɵɵtext(70);
            i0.ɵɵelementEnd();
            i0.ɵɵtext(71, " and ");
            i0.ɵɵelementStart(72, "code");
            i0.ɵɵtext(73);
            i0.ɵɵelementEnd()()();
            i0.ɵɵelementStart(74, "main", 24)(75, "sdx-mesh-viewer", 25);
            i0.ɵɵlistener("productsLoaded", function AppComponent_Template_sdx_mesh_viewer_productsLoaded_75_listener($event) { return ctx.onProductsLoaded($event); })("loadError", function AppComponent_Template_sdx_mesh_viewer_loadError_75_listener($event) { return ctx.catalogError = $event; });
            i0.ɵɵelementEnd()()();
        } if (rf & 2) {
            i0.ɵɵadvance(8);
            i0.ɵɵtwoWayProperty("ngModel", ctx.apiBaseUrl);
            i0.ɵɵadvance(3);
            i0.ɵɵtwoWayProperty("ngModel", ctx.meshId);
            i0.ɵɵadvance(3);
            i0.ɵɵtwoWayProperty("ngModel", ctx.ifcId);
            i0.ɵɵadvance(3);
            i0.ɵɵtwoWayProperty("ngModel", ctx.accessToken);
            i0.ɵɵadvance(3);
            i0.ɵɵconditional(ctx.catalogError ? 20 : -1);
            i0.ɵɵadvance();
            i0.ɵɵconditional(ctx.catalog.length === 0 && !ctx.catalogError ? 21 : -1);
            i0.ɵɵadvance(4);
            i0.ɵɵtwoWayProperty("ngModel", ctx.productSearch);
            i0.ɵɵadvance(2);
            i0.ɵɵtextInterpolate1("", ctx.products.length, " objects");
            i0.ɵɵadvance(2);
            i0.ɵɵrepeater(ctx.filteredCatalog);
            i0.ɵɵadvance(8);
            i0.ɵɵtwoWayProperty("ngModel", ctx.errorTarget);
            i0.ɵɵadvance(3);
            i0.ɵɵtwoWayProperty("ngModel", ctx.maxDepth);
            i0.ɵɵadvance(3);
            i0.ɵɵtwoWayProperty("ngModel", ctx.cacheMaxTiles);
            i0.ɵɵadvance(3);
            i0.ɵɵtwoWayProperty("ngModel", ctx.cacheMinTiles);
            i0.ɵɵadvance(3);
            i0.ɵɵtwoWayProperty("ngModel", ctx.cacheMaxMb);
            i0.ɵɵadvance(3);
            i0.ɵɵtwoWayProperty("ngModel", ctx.maxDownloadJobs);
            i0.ɵɵadvance(3);
            i0.ɵɵtwoWayProperty("ngModel", ctx.maxParseJobs);
            i0.ɵɵadvance(4);
            i0.ɵɵtwoWayProperty("ngModel", ctx.displayBoxBounds);
            i0.ɵɵadvance(3);
            i0.ɵɵtwoWayProperty("ngModel", ctx.displayParentBounds);
            i0.ɵɵadvance(4);
            i0.ɵɵconditional(ctx.stats ? 66 : -1);
            i0.ɵɵadvance(4);
            i0.ɵɵtextInterpolate2("", ctx.apiBaseUrl, "/mesh/simple/", ctx.meshId, "/tileset.json");
            i0.ɵɵadvance(3);
            i0.ɵɵtextInterpolate2("", ctx.apiBaseUrl, "/ifc/simple/", ctx.ifcId, "/tileset.json");
            i0.ɵɵadvance(2);
            i0.ɵɵproperty("meshId", ctx.meshId)("ifcId", ctx.ifcId)("apiBaseUrl", ctx.apiBaseUrl)("accessToken", ctx.accessToken)("errorTarget", ctx.errorTarget)("maxDepth", ctx.maxDepth)("cacheMaxTiles", ctx.cacheMaxTiles)("cacheMinTiles", ctx.cacheMinTiles)("cacheMaxMb", ctx.cacheMaxMb)("maxDownloadJobs", ctx.maxDownloadJobs)("maxParseJobs", ctx.maxParseJobs)("displayBoxBounds", ctx.displayBoxBounds)("displayParentBounds", ctx.displayParentBounds);
        } }, dependencies: [FormsModule, i1.DefaultValueAccessor, i1.NumberValueAccessor, i1.CheckboxControlValueAccessor, i1.NgControlStatus, i1.MinValidator, i1.NgModel, SdxMeshViewerComponent], styles: [".shell[_ngcontent-%COMP%] {\n  display: grid;\n  grid-template-columns: 360px 1fr;\n  height: 100vh;\n}\n\n.panel[_ngcontent-%COMP%] {\n  padding: 1.25rem;\n  background: linear-gradient(180deg, #171a21 0%, #12141a 100%);\n  border-right: 1px solid #2a2f3a;\n  display: flex;\n  flex-direction: column;\n  gap: 0.85rem;\n  overflow: auto;\n}\n\nh1[_ngcontent-%COMP%] {\n  margin: 0;\n  font-size: 1.15rem;\n  font-weight: 600;\n  letter-spacing: 0.02em;\n}\n\nh2[_ngcontent-%COMP%] {\n  margin: 0.75rem 0 0;\n  font-size: 0.85rem;\n  font-weight: 600;\n  text-transform: uppercase;\n  letter-spacing: 0.06em;\n  color: #9aa3b2;\n}\n\n.hint[_ngcontent-%COMP%] {\n  margin: 0;\n  color: #9aa3b2;\n  font-size: 0.85rem;\n  line-height: 1.4;\n}\n\n.stats[_ngcontent-%COMP%] {\n  margin-top: 0.5rem;\n  padding: 0.65rem 0.75rem;\n  border: 1px solid #2a2f3a;\n  border-radius: 6px;\n  background: #0f1115;\n  font-size: 0.75rem;\n  color: #c5ccd8;\n  display: grid;\n  gap: 0.25rem;\n  font-variant-numeric: tabular-nums;\n}\n\nlabel[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  gap: 0.35rem;\n  font-size: 0.8rem;\n  color: #c5ccd8;\n}\n\nlabel.checkbox[_ngcontent-%COMP%] {\n  flex-direction: row;\n  align-items: center;\n  gap: 0.55rem;\n}\n\nlabel.checkbox[_ngcontent-%COMP%]   input[_ngcontent-%COMP%] {\n  width: auto;\n  margin: 0;\n}\n\ninput[_ngcontent-%COMP%] {\n  border: 1px solid #3a4150;\n  background: #0f1115;\n  color: #e8eaed;\n  border-radius: 6px;\n  padding: 0.55rem 0.65rem;\n  font: inherit;\n}\n\nbutton[_ngcontent-%COMP%] {\n  margin-top: 0.25rem;\n  border: 0;\n  border-radius: 6px;\n  padding: 0.7rem 0.9rem;\n  background: #3d7eff;\n  color: white;\n  font-weight: 600;\n  cursor: pointer;\n}\n\nbutton[_ngcontent-%COMP%]:hover {\n  background: #2f6ae0;\n}\n\n.navigation-actions[_ngcontent-%COMP%] {\n  display: grid;\n  grid-template-columns: auto 1fr;\n  gap: 0.6rem;\n}\n\n.navigation-actions[_ngcontent-%COMP%]   button[_ngcontent-%COMP%] {\n  margin: 0;\n  padding: 0.55rem 0.75rem;\n}\n\n.model-tree[_ngcontent-%COMP%] {\n  display: grid;\n  gap: 0.35rem;\n  font-size: 0.8rem;\n}\n\n.model-tree[_ngcontent-%COMP%]   details[_ngcontent-%COMP%] {\n  min-width: 0;\n}\n\n.model-tree[_ngcontent-%COMP%]   summary[_ngcontent-%COMP%] {\n  display: grid;\n  grid-template-columns: auto minmax(0, 1fr) auto;\n  align-items: center;\n  gap: 0.5rem;\n  padding: 0.45rem 0.5rem;\n  border-radius: 5px;\n  color: #d7dde8;\n  cursor: pointer;\n  list-style-position: outside;\n}\n\n.model-tree[_ngcontent-%COMP%]   summary[_ngcontent-%COMP%]:hover, \n.tree-product[_ngcontent-%COMP%]:hover {\n  background: #252b36;\n}\n\n.model-tree[_ngcontent-%COMP%]   summary[_ngcontent-%COMP%]   input[_ngcontent-%COMP%], \n.tree-product[_ngcontent-%COMP%]   input[_ngcontent-%COMP%] {\n  width: auto;\n  margin: 0;\n}\n\n.model-tree[_ngcontent-%COMP%]   summary[_ngcontent-%COMP%]   span[_ngcontent-%COMP%], \n.tree-product[_ngcontent-%COMP%]   span[_ngcontent-%COMP%] {\n  min-width: 0;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n.model-tree[_ngcontent-%COMP%]   small[_ngcontent-%COMP%] {\n  color: #8b93a3;\n  font-variant-numeric: tabular-nums;\n}\n\n.tree-category[_ngcontent-%COMP%] {\n  border: 1px solid #2a2f3a;\n  border-radius: 6px;\n  background: #0f1115;\n}\n\n.tree-category[_ngcontent-%COMP%]    > summary[_ngcontent-%COMP%] {\n  font-weight: 600;\n}\n\n.tree-children[_ngcontent-%COMP%] {\n  margin: 0 0.35rem 0.35rem 0.9rem;\n  padding-left: 0.45rem;\n  border-left: 1px solid #303642;\n}\n\n.tree-type[_ngcontent-%COMP%]    > summary[_ngcontent-%COMP%] {\n  color: #c5ccd8;\n}\n\n.product-list[_ngcontent-%COMP%] {\n  max-height: 300px;\n  overflow: auto;\n}\n\n.tree-product[_ngcontent-%COMP%] {\n  display: grid;\n  grid-template-columns: auto minmax(0, 1fr) auto;\n  align-items: center;\n  gap: 0.5rem;\n  padding: 0.4rem 0.5rem;\n  border-radius: 5px;\n  color: #b8c0cd;\n  cursor: pointer;\n}\n\n.footer[_ngcontent-%COMP%] {\n  margin-top: auto;\n  font-size: 0.72rem;\n  color: #8b93a3;\n  word-break: break-all;\n}\n\ncode[_ngcontent-%COMP%] {\n  color: #d7dde8;\n}\n\n.viewport[_ngcontent-%COMP%] {\n  min-height: 0;\n  background: #0b0d11;\n}\n\n@media (max-width: 900px) {\n  .shell[_ngcontent-%COMP%] {\n    grid-template-columns: 1fr;\n    grid-template-rows: auto 1fr;\n  }\n}"] });
}
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(AppComponent, [{
        type: Component,
        args: [{ selector: 'app-root', standalone: true, imports: [FormsModule, SdxMeshViewerComponent], template: "<div class=\"shell\">\n  <aside class=\"panel\">\n    <h1>SDX Mesh Viewer</h1>\n    <p class=\"hint\">\n      Dev-only shell for LOD mesh and typed IFC streaming against Service 3D.\n      Both layers share one Z-up ENH viewport (X east, Y north, Z height).\n    </p>\n\n    <label>\n      API base\n      <input [(ngModel)]=\"apiBaseUrl\" name=\"apiBaseUrl\" />\n    </label>\n\n    <label>\n      Mesh id\n      <input [(ngModel)]=\"meshId\" name=\"meshId\" />\n    </label>\n\n    <label>\n      IFC id\n      <input [(ngModel)]=\"ifcId\" name=\"ifcId\" />\n    </label>\n\n    <label>\n      Access token\n      <input [(ngModel)]=\"accessToken\" name=\"accessToken\" type=\"password\" autocomplete=\"off\" />\n    </label>\n\n    <h2>IFC navigation</h2>\n    @if (catalogError) {\n      <p class=\"hint\">{{ catalogError }}</p>\n    }\n    @if (catalog.length === 0 && !catalogError) {\n      <p class=\"hint\">Load an IFC id to browse its elements.</p>\n    }\n    <div class=\"navigation-actions\">\n      <button type=\"button\" (click)=\"showAll()\">Show all</button>\n      <input\n        [(ngModel)]=\"productSearch\"\n        name=\"productSearch\"\n        placeholder=\"Search model\"\n        aria-label=\"Search model\"\n        (ngModelChange)=\"onSearchChange($event)\"\n      />\n    </div>\n    <p class=\"hint\">{{ products.length }} objects</p>\n    <nav class=\"model-tree\" aria-label=\"IFC model elements\">\n      @for (category of filteredCatalog; track category.name) {\n        <details\n          class=\"tree-category\"\n          [open]=\"category.expanded\"\n          (toggle)=\"category.expanded = $any($event.target).open\"\n        >\n          <summary>\n            <input\n              [(ngModel)]=\"category.enabled\"\n              [indeterminate]=\"isCategoryPartial(category)\"\n              [name]=\"'category-' + category.name\"\n              type=\"checkbox\"\n              (click)=\"$event.stopPropagation()\"\n              (ngModelChange)=\"onCategoryToggle(category)\"\n            />\n            <span>{{ category.name }}</span>\n            <small>{{ category.types.length }}</small>\n          </summary>\n          @if (category.expanded) {\n            <div class=\"tree-children\">\n              @for (type of category.types; track type.ifc_class) {\n                @if (matchesType(category, type)) {\n                  <details\n                    class=\"tree-type\"\n                    [open]=\"type.expanded\"\n                    (toggle)=\"type.expanded = $any($event.target).open\"\n                  >\n                    <summary>\n                      <input\n                        [(ngModel)]=\"type.enabled\"\n                        [indeterminate]=\"isTypePartial(type)\"\n                        [name]=\"'type-' + type.ifc_class\"\n                        type=\"checkbox\"\n                        (click)=\"$event.stopPropagation()\"\n                        (ngModelChange)=\"onTypeToggle(category, type)\"\n                      />\n                      <span>{{ type.ifc_class }}</span>\n                      <small>{{ type.products.length }}</small>\n                    </summary>\n                    @if (type.expanded) {\n                      <div class=\"tree-children product-list\">\n                        @for (product of type.products; track product.component_id) {\n                          @if (matchesProduct(category, type, product)) {\n                            <label\n                              class=\"tree-product\"\n                              (mouseenter)=\"onProductHover(product)\"\n                              (mouseleave)=\"onProductHover(null)\"\n                            >\n                              <input\n                                [(ngModel)]=\"product.enabled\"\n                                [name]=\"'product-' + product.component_id\"\n                                type=\"checkbox\"\n                                (ngModelChange)=\"onProductToggle(category, type, product)\"\n                              />\n                              <span>{{ productLabel(product) }}</span>\n                              <small>#{{ product.express_id }}</small>\n                            </label>\n                          }\n                        }\n                      </div>\n                    }\n                  </details>\n                }\n              }\n            </div>\n          }\n        </details>\n      }\n    </nav>\n\n    <h2>Tile budget</h2>\n    <p class=\"hint\">\n      Higher error target and lower cache limits load fewer tiles (better for weak devices).\n    </p>\n\n    <label>\n      Error target\n      <input [(ngModel)]=\"errorTarget\" name=\"errorTarget\" type=\"number\" min=\"1\" step=\"1\" />\n    </label>\n\n    <label>\n      Max depth\n      <input [(ngModel)]=\"maxDepth\" name=\"maxDepth\" type=\"number\" min=\"1\" step=\"1\" />\n    </label>\n\n    <label>\n      Cache max tiles\n      <input [(ngModel)]=\"cacheMaxTiles\" name=\"cacheMaxTiles\" type=\"number\" min=\"10\" step=\"10\" />\n    </label>\n\n    <label>\n      Cache min tiles\n      <input [(ngModel)]=\"cacheMinTiles\" name=\"cacheMinTiles\" type=\"number\" min=\"0\" step=\"10\" />\n    </label>\n\n    <label>\n      Cache max MB\n      <input [(ngModel)]=\"cacheMaxMb\" name=\"cacheMaxMb\" type=\"number\" min=\"32\" step=\"32\" />\n    </label>\n\n    <label>\n      Max download jobs\n      <input [(ngModel)]=\"maxDownloadJobs\" name=\"maxDownloadJobs\" type=\"number\" min=\"1\" step=\"1\" />\n    </label>\n\n    <label>\n      Max parse jobs\n      <input [(ngModel)]=\"maxParseJobs\" name=\"maxParseJobs\" type=\"number\" min=\"1\" step=\"1\" />\n    </label>\n\n    <h2>Debug</h2>\n\n    <label class=\"checkbox\">\n      <input [(ngModel)]=\"displayBoxBounds\" name=\"displayBoxBounds\" type=\"checkbox\" />\n      Show tile bounding boxes\n    </label>\n\n    <label class=\"checkbox\">\n      <input [(ngModel)]=\"displayParentBounds\" name=\"displayParentBounds\" type=\"checkbox\" />\n      Show parent bounds\n    </label>\n\n    <button type=\"button\" (click)=\"apply()\">Load / reload</button>\n\n    @if (stats) {\n      <div class=\"stats\">\n        <div>Visible: {{ stats.visible }}</div>\n        <div>Cached: {{ stats.cached }} / {{ stats.cacheMaxTiles }}</div>\n        <div>Downloading: {{ stats.downloading }}</div>\n        <div>Parsing: {{ stats.parsing }}</div>\n        <div>Products: {{ stats.productsVisible }} / {{ stats.productsTotal }}</div>\n      </div>\n    }\n\n    <p class=\"footer\">\n      Expects\n      <code>{{ apiBaseUrl }}/mesh/simple/{{ meshId }}/tileset.json</code>\n      and\n      <code>{{ apiBaseUrl }}/ifc/simple/{{ ifcId }}/tileset.json</code>\n    </p>\n  </aside>\n\n  <main class=\"viewport\">\n    <sdx-mesh-viewer\n      [meshId]=\"meshId\"\n      [ifcId]=\"ifcId\"\n      [apiBaseUrl]=\"apiBaseUrl\"\n      [accessToken]=\"accessToken\"\n      [errorTarget]=\"errorTarget\"\n      [maxDepth]=\"maxDepth\"\n      [cacheMaxTiles]=\"cacheMaxTiles\"\n      [cacheMinTiles]=\"cacheMinTiles\"\n      [cacheMaxMb]=\"cacheMaxMb\"\n      [maxDownloadJobs]=\"maxDownloadJobs\"\n      [maxParseJobs]=\"maxParseJobs\"\n      [displayBoxBounds]=\"displayBoxBounds\"\n      [displayParentBounds]=\"displayParentBounds\"\n      (productsLoaded)=\"onProductsLoaded($event)\"\n      (loadError)=\"catalogError = $event\"\n    />\n  </main>\n</div>\n", styles: [".shell {\n  display: grid;\n  grid-template-columns: 360px 1fr;\n  height: 100vh;\n}\n\n.panel {\n  padding: 1.25rem;\n  background: linear-gradient(180deg, #171a21 0%, #12141a 100%);\n  border-right: 1px solid #2a2f3a;\n  display: flex;\n  flex-direction: column;\n  gap: 0.85rem;\n  overflow: auto;\n}\n\nh1 {\n  margin: 0;\n  font-size: 1.15rem;\n  font-weight: 600;\n  letter-spacing: 0.02em;\n}\n\nh2 {\n  margin: 0.75rem 0 0;\n  font-size: 0.85rem;\n  font-weight: 600;\n  text-transform: uppercase;\n  letter-spacing: 0.06em;\n  color: #9aa3b2;\n}\n\n.hint {\n  margin: 0;\n  color: #9aa3b2;\n  font-size: 0.85rem;\n  line-height: 1.4;\n}\n\n.stats {\n  margin-top: 0.5rem;\n  padding: 0.65rem 0.75rem;\n  border: 1px solid #2a2f3a;\n  border-radius: 6px;\n  background: #0f1115;\n  font-size: 0.75rem;\n  color: #c5ccd8;\n  display: grid;\n  gap: 0.25rem;\n  font-variant-numeric: tabular-nums;\n}\n\nlabel {\n  display: flex;\n  flex-direction: column;\n  gap: 0.35rem;\n  font-size: 0.8rem;\n  color: #c5ccd8;\n}\n\nlabel.checkbox {\n  flex-direction: row;\n  align-items: center;\n  gap: 0.55rem;\n}\n\nlabel.checkbox input {\n  width: auto;\n  margin: 0;\n}\n\ninput {\n  border: 1px solid #3a4150;\n  background: #0f1115;\n  color: #e8eaed;\n  border-radius: 6px;\n  padding: 0.55rem 0.65rem;\n  font: inherit;\n}\n\nbutton {\n  margin-top: 0.25rem;\n  border: 0;\n  border-radius: 6px;\n  padding: 0.7rem 0.9rem;\n  background: #3d7eff;\n  color: white;\n  font-weight: 600;\n  cursor: pointer;\n}\n\nbutton:hover {\n  background: #2f6ae0;\n}\n\n.navigation-actions {\n  display: grid;\n  grid-template-columns: auto 1fr;\n  gap: 0.6rem;\n}\n\n.navigation-actions button {\n  margin: 0;\n  padding: 0.55rem 0.75rem;\n}\n\n.model-tree {\n  display: grid;\n  gap: 0.35rem;\n  font-size: 0.8rem;\n}\n\n.model-tree details {\n  min-width: 0;\n}\n\n.model-tree summary {\n  display: grid;\n  grid-template-columns: auto minmax(0, 1fr) auto;\n  align-items: center;\n  gap: 0.5rem;\n  padding: 0.45rem 0.5rem;\n  border-radius: 5px;\n  color: #d7dde8;\n  cursor: pointer;\n  list-style-position: outside;\n}\n\n.model-tree summary:hover,\n.tree-product:hover {\n  background: #252b36;\n}\n\n.model-tree summary input,\n.tree-product input {\n  width: auto;\n  margin: 0;\n}\n\n.model-tree summary span,\n.tree-product span {\n  min-width: 0;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n.model-tree small {\n  color: #8b93a3;\n  font-variant-numeric: tabular-nums;\n}\n\n.tree-category {\n  border: 1px solid #2a2f3a;\n  border-radius: 6px;\n  background: #0f1115;\n}\n\n.tree-category > summary {\n  font-weight: 600;\n}\n\n.tree-children {\n  margin: 0 0.35rem 0.35rem 0.9rem;\n  padding-left: 0.45rem;\n  border-left: 1px solid #303642;\n}\n\n.tree-type > summary {\n  color: #c5ccd8;\n}\n\n.product-list {\n  max-height: 300px;\n  overflow: auto;\n}\n\n.tree-product {\n  display: grid;\n  grid-template-columns: auto minmax(0, 1fr) auto;\n  align-items: center;\n  gap: 0.5rem;\n  padding: 0.4rem 0.5rem;\n  border-radius: 5px;\n  color: #b8c0cd;\n  cursor: pointer;\n}\n\n.footer {\n  margin-top: auto;\n  font-size: 0.72rem;\n  color: #8b93a3;\n  word-break: break-all;\n}\n\ncode {\n  color: #d7dde8;\n}\n\n.viewport {\n  min-height: 0;\n  background: #0b0d11;\n}\n\n@media (max-width: 900px) {\n  .shell {\n    grid-template-columns: 1fr;\n    grid-template-rows: auto 1fr;\n  }\n}\n"] }]
    }], () => [], { viewer: [{
            type: ViewChild,
            args: [SdxMeshViewerComponent]
        }] }); })();
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassDebugInfo(AppComponent, { className: "AppComponent" }); })();
