import type { ProductVariantInventory } from './products.model';

export interface SizeForm {
  sizeId: number;
  colors: {
    id: number;
    value: string;
  };
}

export interface ProductSizeSave {
  barcode: number;
  /** Cantidad enviada al API en formularios (hasta que el PATCH use solo movimientos). */
  stock: number;
  purchasePrice: number;
  salePrice: number;
  minSalePrice: number;
  /** Opcional: respuesta API cuando el backend envía saldo centralizado. */
  inventory?: ProductVariantInventory;
}
