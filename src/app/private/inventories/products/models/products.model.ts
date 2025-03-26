export interface Color {
  id: number;
  color: string;
  stock?: number;
  price?: number;
}

export interface Size {
  id: number;
  size: string;
  stock?: number;
  price?: number;
  colors?: Color[];
}

export interface Product {
  id: number;
  name: string;
  description: string;
  stock: number;
  purchasePrice: number;
  wholesalePrice: number;
  minWholesalePrice: number;
  ratailPrice: number;
  minRatailPrice: number;
  status: string;
  genderId: number;
  gender: string;
  sizes: Size[];
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
  description: string;
  purchasePrice: number;
  wholesalePrice: number;
  minWholesalePrice: number;
  ratailPrice: number;
  minRatailPrice: number;
  status: string;
  genderId: number;
  constructor(product: Product) {
    this.id = product.id;
    this.name = product.name;
    this.description = product.description;
    this.purchasePrice = product.purchasePrice;
    this.wholesalePrice = product.wholesalePrice;
    this.minWholesalePrice = product.minWholesalePrice;
    this.ratailPrice = product.ratailPrice;
    this.minRatailPrice = product.minRatailPrice;
    this.status = product.status;
    this.genderId = product.genderId;
  }
}
