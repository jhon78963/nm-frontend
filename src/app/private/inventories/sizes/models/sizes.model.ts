export interface Size {
  id: number;
  description: string;
  sizeTypeId: number;
  /** Fila `product_size.id` cuando la talla ya está ligada al producto (API `sizes/selected`). */
  productSizeId?: number | null;
  isExists?: boolean;
}

export interface Paginate {
  total: number;
  pages: number;
}

export interface SizeListResponse {
  data: Size[];
  paginate: Paginate;
}

export class SizeSave {
  id: number;
  description?: string;
  sizeTypeId?: number;
  constructor(size: Size) {
    this.id = size.id;
    this.description = size.description;
    this.sizeTypeId = size.sizeTypeId;
  }
}
