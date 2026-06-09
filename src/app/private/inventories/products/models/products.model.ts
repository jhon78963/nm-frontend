/** Saldo desde `inventory_balances` (API ProductResource / tallas). */
import { ProductMediaItem } from './product-media.model';

export interface ProductVariantInventory {
  available_quantity: number;
  warehouse_id: number;
}

export interface Color {
  id: number;
  description: string;
  value?: string;
  price?: number;
  /** Respuesta API: stock por variante en almacén resuelto. */
  inventory?: ProductVariantInventory;
}

export interface Size {
  id: number;
  description: string;
  price?: number;
  colors?: Color[];
  inventory?: ProductVariantInventory;
}

export interface ProductSize {
  sizeId: number;
  productId: number;
  type: string;
}

export interface Product {
  id: number;
  name: string;
  barcode: string;
  description: string;
  purchasePrice: number;
  salePrice: number;
  minSalePrice: number;
  status: string;
  genderId: number;
  gender: string;
  sizes: Size[];
  filter: boolean;
  sizeTypeId: number[];
  percentageDiscount: number;
  cashDiscount: number;
  warehouseId: number;
  inventory?: ProductVariantInventory;
  thumbnail?: string | null;
  gallery?: string[];
  media?: ProductMediaItem[];
}

export interface Paginate {
  total: number;
  pages: number;
}

export interface ProductListResponse {
  data: Product[];
  paginate: Paginate;
}

export class ProductSave {
  id: number;
  name: string;
  barcode: string;
  description: string;
  /** Opcional para no pisar pivots al guardar otros formularios (p. ej. ecommerce). */
  purchasePrice?: number;
  salePrice?: number;
  minSalePrice?: number;
  status: string;
  genderId: number;
  percentageDiscount: number;
  cashDiscount: number;
  warehouseId: number;
  constructor(product: Partial<Product>) {
    const num = (v: unknown): number => {
      const x = Number(v);
      return Number.isFinite(x) ? x : 0;
    };
    const assignNumIfKeyed = (
      src: Partial<Product>,
      prop: 'purchasePrice' | 'salePrice' | 'minSalePrice',
    ): void => {
      if (!(prop in src)) {
        return;
      }
      const rawUnknown = src[prop] as unknown;
      if (
        rawUnknown === '' ||
        rawUnknown === null ||
        rawUnknown === undefined
      ) {
        return;
      }
      const x = Number(rawUnknown);
      if (!Number.isFinite(x)) {
        return;
      }
      (this as ProductSave)[prop] = x;
    };

    this.id = product.id ?? 0;
    this.name = product.name ?? '';
    this.barcode = product.barcode ?? '';
    this.description = product.description ?? '';
    assignNumIfKeyed(product, 'purchasePrice');
    assignNumIfKeyed(product, 'salePrice');
    assignNumIfKeyed(product, 'minSalePrice');
    this.status = product.status ?? '';
    this.genderId = product.genderId ?? 0;
    this.percentageDiscount = num(product.percentageDiscount);
    this.cashDiscount = num(product.cashDiscount);
    this.warehouseId = product.warehouseId ?? 0;
  }
}
