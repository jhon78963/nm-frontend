export interface SizeForm {
  sizeId: number;
  stock: number;
  colors: {
    id: number;
    value: string;
  };
}

export interface ProductSizeSave {
  barcode: number;
  stock: number;
  purchasePrice: number;
  salePrice: number;
  minSalePrice: number;
}
