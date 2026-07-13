import type { ProductVariantInventory } from '../../products/models/products.model';

/** Respuesta de GET search (InventoryReconciliationProductResource). */
export interface ReconciliationProductApi {
  id: number;
  name: string;
  barcode: string | null;
  genderId?: number;
  /** Nombre de categoría/género (Damas, Caballeros, Niños, …). */
  gender?: string | null;
  warehouseId?: number;
  status?: string;
  sizes: ReconciliationSizeApi[];
}

export interface ReconciliationSizeApi {
  id: number;
  sizeId: number;
  barcode: string | null;
  inventory?: ProductVariantInventory;
  purchasePrice?: number | null;
  salePrice?: number | null;
  minSalePrice?: number | null;
  size: { id: number; description: string } | null;
  colors: ReconciliationColorApi[];
}

export interface ReconciliationColorApi {
  id: number;
  colorId: number;
  description: string;
  hash?: string | null;
  inventory?: ProductVariantInventory;
}

export interface ReconciliationSearchResponse {
  products: ReconciliationProductApi[];
}

export interface ReconciliationUpdateResponse {
  message: string;
  product: ReconciliationProductApi | null;
}

/** Estado editable local (copia profunda). */
export interface ReconciliationColorDraft {
  colorId: number;
  description: string;
  /** Cantidad editada (mapeada desde inventory.available_quantity al cargar). */
  stock: number;
  /** Stock al cargar; solo UI para detectar cambios. */
  baselineStock: number;
  /** Marcado local: el usuario revisó/confirmó este stock (no se envía al API). */
  stockReviewed: boolean;
}

export interface ReconciliationSizeDraft {
  id: number;
  sizeId: number;
  sizeLabel: string;
  barcode: string | null;
  /** Stock maestro cuando no hay desglose por color. */
  masterStock: number;
  /** Maestro reportado por el servidor al cargar (auditoría). */
  serverMasterStock: number;
  /**
   * Si al cargar había sum(colores) ≠ maestro en BD; guardar inventario suele corregirlo
   * aplicando los stocks por color.
   */
  shelfInconsistentOnLoad: boolean;
  /** Precios a nivel talla (product_size); no aplican por color. */
  purchasePrice: number | null;
  salePrice: number | null;
  minSalePrice: number | null;
  colors: ReconciliationColorDraft[];
}

export interface ReconciliationDraft {
  productId: number;
  name: string;
  sku: string | null;
  sizes: ReconciliationSizeDraft[];
}
