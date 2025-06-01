export interface Color {
  id: number;
  description: string;
  value?: string;
  stock?: number;
  price?: number;
}

export interface Size {
  id: number;
  description: string;
  stock?: number;
  price?: number;
  colors?: Color[];
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
  stock: number;
  purchasePrice: number;
  salePrice: number;
  minSalePrice: number;
  status: string;
  genderId: number;
  gender: string;
  sizes: Size[];
  filter: boolean;
  sizeTypeId?: number;
  percentageDiscount: number;
  cashDiscount: number;
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
  purchasePrice: number;
  salePrice: number;
  minSalePrice: number;
  status: string;
  genderId: number;
  percentageDiscount: number;
  cashDiscount: number;
  constructor(product: Product) {
    this.id = product.id;
    this.name = product.name;
    this.barcode = product.barcode;
    this.description = product.description;
    this.purchasePrice = product.purchasePrice;
    this.salePrice = product.salePrice;
    this.minSalePrice = product.minSalePrice;
    this.status = product.status;
    this.genderId = product.genderId;
    this.percentageDiscount = product.percentageDiscount;
    this.cashDiscount = product.cashDiscount;
  }
}
