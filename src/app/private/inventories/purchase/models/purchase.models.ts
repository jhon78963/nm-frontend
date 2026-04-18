/** Opción de talla devuelta por `GET colors/sizes` (producto + talla + productSizeId). */
export interface ProductSizeOption {
  id: number;
  description?: string;
  /** Presente solo si la talla ya está ligada al producto (`colors/sizes`). */
  productSizeId?: number;
  stock?: number;
  /** Si el backend los expone en el futuro, se auto-rellenan en el formulario. */
  barcode?: string | null;
  purchasePrice?: number | null;
  salePrice?: number | null;
  minSalePrice?: number | null;
}

/** Fila de `GET colors/selected` (todo el catálogo; `isExists` = ya hay fila en `product_size_color` para esa talla). */
export interface ProductColorOption {
  id: number;
  description: string;
  hash?: string | null;
  isExists: boolean;
  stock: number | null;
  productSizeId: number | null;
}

export interface SizeTypeOption {
  id: number;
  description: string;
}

export type ProductRefPayload =
  | { mode: 'id'; productId: number }
  | { mode: 'temp'; tempId: string };

export type SizeRefPayload =
  | { mode: 'id'; sizeId: number }
  | { mode: 'temp'; tempId: string };

export interface PurchaseCatalogProductCreate {
  tempId: string;
  mode: 'create';
  name: string;
  genderId: number;
  description?: string | null;
  barcode?: string | null;
}

export interface PurchaseCatalogSizeCreate {
  tempId: string;
  mode: 'create';
  description: string;
  sizeTypeId: number;
}

export interface PurchaseCatalogColorCreate {
  tempId: string;
  mode: 'create';
  description: string;
  hash?: string | null;
}

/**
 * Entrada de color dentro de una línea (talla).
 * - `colorId` o `tempId` (nuevo en catálogo), o ninguno si solo stock a nivel talla.
 */
export interface PurchaseLineColorJson {
  quantity: number;
  colorId?: number;
  tempId?: string;
  description?: string;
  hash?: string | null;
}

/** Línea = 1 producto + 1 talla (precios/barcode) + N colores con cantidades. */
export interface PurchaseLinePayload {
  lineId: string;
  productRef: ProductRefPayload;
  sizeRef: SizeRefPayload;
  barcode: string | null;
  purchasePrice: number;
  salePrice: number;
  minSalePrice: number;
  colors: PurchaseLineColorJson[];
  subtotal: number;
  productSizeId?: number | null;
}

export interface PurchaseBulkPayload {
  purchase: {
    supplierName: string;
    /** Proveedor del directorio (creado o elegido en la vista de compras). */
    vendorId?: number | null;
    documentNote: string | null;
    registeredAt: string;
    warehouseId: number;
    currency: string;
  };
  catalogUpserts: {
    products: PurchaseCatalogProductCreate[];
    sizes: PurchaseCatalogSizeCreate[];
    colors: PurchaseCatalogColorCreate[];
  };
  lines: PurchaseLinePayload[];
  totals: { grandSubtotal: number };
}

/** Una variante de color en el borrador (Sección 2) antes de “Agregar a la tabla”. */
export interface PurchaseDraftColorVariant {
  id: string;
  displayLabel: string;
  colorMode: 'existing' | 'new';
  colorId: number | null;
  colorTempId: string | null;
  colorHash: string | null;
  quantity: number;
}

/** Valores de una fila de detalle (Sección 3) para armar el payload. */
export interface PurchaseLineFormValue {
  lineId: string;
  productName: string;
  sizeLabel: string;
  productMode: 'existing' | 'new';
  productId: number | null;
  productTempId: string | null;
  productGenderId: number | null;
  sizeMode: 'existing' | 'new';
  sizeId: number | null;
  sizeTempId: string | null;
  sizeTypeId: number | null;
  productSizeId: number | null;
  barcode: string | null;
  purchasePrice: number;
  salePrice: number;
  minSalePrice: number;
  subtotal: number;
  /** Variantes de color con cantidad (o una sola fila “solo talla” sin colorId/tempId). */
  colors: PurchaseLineColorRowValue[];
}

export interface PurchaseLineColorRowValue {
  displayLabel: string;
  colorId: number | null;
  colorTempId: string | null;
  colorHash: string | null;
  quantity: number;
}

export function genTempId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
