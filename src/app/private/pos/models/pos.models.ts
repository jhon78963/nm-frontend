export interface Variant {
  colorName: string;
  hex: string;
  stock: number;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  basePrice: number;
  variants: { [size: string]: Variant[] };
}

export interface CartItem {
  cartId: number;
  productId: string;
  sku: string;
  name: string;
  size: string;
  color: Variant;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Customer {
  id: string;
  dni: string;
  name: string;
}

// Estado del Modal para manejarlo desde el servicio
export interface ModalState {
  isOpen: boolean;
  product: Product | null;
  isEditing: boolean;
  editingCartItem?: CartItem | null;
}
