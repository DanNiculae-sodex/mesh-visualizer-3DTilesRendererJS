import { Component, OnDestroy, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IfcProduct,
  SdxMeshTilesStats,
  SdxMeshViewerComponent,
} from 'sdx-mesh-viewer';
import { environment } from '../environments/environment';

interface CatalogProduct extends IfcProduct {
  enabled: boolean;
}

interface CatalogType {
  ifc_class: string;
  enabled: boolean;
  expanded: boolean;
  products: CatalogProduct[];
}

interface CatalogCategory {
  name: string;
  enabled: boolean;
  expanded: boolean;
  types: CatalogType[];
}

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
  catalog: CatalogCategory[] = [];
  products: CatalogProduct[] = [];
  productSearch = '';
  catalogError = '';

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

  get filteredCatalog(): CatalogCategory[] {
    const query = this.productSearch.trim().toLowerCase();
    if (!query) {
      return this.catalog;
    }
    return this.catalog.filter(
      (category) =>
        category.name.toLowerCase().includes(query) ||
        category.types.some(
          (type) =>
            type.ifc_class.toLowerCase().includes(query) ||
            type.products.some((product) => this.productMatches(product, query)),
        ),
    );
  }

  matchesType(category: CatalogCategory, type: CatalogType): boolean {
    const query = this.productSearch.trim().toLowerCase();
    return (
      !query ||
      category.name.toLowerCase().includes(query) ||
      type.ifc_class.toLowerCase().includes(query) ||
      type.products.some((product) => this.productMatches(product, query))
    );
  }

  matchesProduct(
    category: CatalogCategory,
    type: CatalogType,
    product: CatalogProduct,
  ): boolean {
    const query = this.productSearch.trim().toLowerCase();
    return (
      !query ||
      category.name.toLowerCase().includes(query) ||
      type.ifc_class.toLowerCase().includes(query) ||
      this.productMatches(product, query)
    );
  }

  async apply(): Promise<void> {
    this.catalogError = '';
    try {
      await this.viewer?.reload();
    } catch (error) {
      this.catalogError = error instanceof Error ? error.message : String(error);
    }
  }

  onProductsLoaded(products: IfcProduct[]): void {
    this.products = products.map((product) => ({ ...product, enabled: true }));
    const categoryTypes = new Map<string, Map<string, CatalogProduct[]>>();
    for (const product of this.products) {
      const categoryName = this.categoryForClass(product.ifc_class);
      const types = categoryTypes.get(categoryName) ?? new Map<string, CatalogProduct[]>();
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
            products: typeProducts.sort((left, right) =>
              this.productLabel(left).localeCompare(this.productLabel(right)),
            ),
          })),
      }));
  }

  onCategoryToggle(category: CatalogCategory): void {
    for (const type of category.types) {
      type.enabled = category.enabled;
      for (const product of type.products) {
        product.enabled = category.enabled;
      }
      this.viewer?.setTypeVisible(type.ifc_class, category.enabled);
    }
  }

  onTypeToggle(category: CatalogCategory, type: CatalogType): void {
    this.viewer?.setTypeVisible(type.ifc_class, type.enabled);
    for (const product of type.products) {
      product.enabled = type.enabled;
    }
    category.enabled = category.types.every((entry) => entry.enabled);
  }

  onProductToggle(category: CatalogCategory, type: CatalogType, product: CatalogProduct): void {
    this.viewer?.setProductVisible(product.component_id, product.enabled);
    type.enabled = type.products.every((entry) => entry.enabled);
    category.enabled = category.types.every((entry) => entry.enabled);
  }

  onProductHover(product: CatalogProduct | null): void {
    this.viewer?.setProductHighlighted(product?.component_id ?? null);
  }

  onSearchChange(queryValue: string): void {
    const query = queryValue.trim().toLowerCase();
    if (!query) {
      return;
    }
    for (const category of this.catalog) {
      category.expanded =
        category.name.toLowerCase().includes(query) ||
        category.types.some(
          (type) =>
            type.ifc_class.toLowerCase().includes(query) ||
            type.products.some((product) => this.productMatches(product, query)),
        );
      for (const type of category.types) {
        type.expanded =
          category.name.toLowerCase().includes(query) ||
          type.ifc_class.toLowerCase().includes(query) ||
          type.products.some((product) => this.productMatches(product, query));
      }
    }
  }

  isCategoryPartial(category: CatalogCategory): boolean {
    const enabledCount = category.types.filter((type) =>
      type.products.some((product) => product.enabled),
    ).length;
    return enabledCount > 0 && !category.enabled;
  }

  isTypePartial(type: CatalogType): boolean {
    return type.products.some((product) => product.enabled) && !type.enabled;
  }

  productLabel(product: IfcProduct): string {
    return product.name?.trim() || `${product.ifc_class} #${product.express_id}`;
  }

  showAll(): void {
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

  private categoryForClass(ifcClass: string): string {
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
    if (
      normalized.includes('FURNISH') ||
      normalized.includes('FURNITURE') ||
      normalized.includes('APPLIANCE')
    ) {
      return 'Furnishings';
    }
    return 'Other elements';
  }

  private productMatches(product: CatalogProduct, query: string): boolean {
    return [
      product.name ?? '',
      product.global_id ?? '',
      String(product.express_id),
      product.ifc_class,
    ].some((value) => value.toLowerCase().includes(query));
  }
}
