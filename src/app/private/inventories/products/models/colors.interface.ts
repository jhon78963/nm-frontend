import type { ProductVariantInventory } from './products.model';

export interface ProductSizeColorSave {
  /** Cantidad por color en el payload del formulario. */
  stock: number;
  inventory?: ProductVariantInventory;
}
