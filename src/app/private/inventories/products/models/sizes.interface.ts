export interface SizeForm {
  sizeId: number;
  stock: number;
  colors: {
    id: number;
    value: string;
  };
}

export interface ProductSizeSave {
  stock: number;
  price: number;
}
