export interface Variant {
  // IDs necesarios para la venta (backend)
  product_size_id: number;
  color_id: number;

  // Datos visuales
  colorName: string;
  hex: string;
  stock: number;
  price: number; // Precio específico de la variante
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  basePrice: number;
  variants: { [size: string]: Variant[] }; // Mapa: "S" -> [Rojo, Azul]
}

export interface CartItem {
  cartId: number;
  productId: string;
  sku: string;
  name: string;
  size: string;
  color: Variant; // Aquí viajan los IDs product_size_id y color_id
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Customer {
  id: string;
  dni: string; // O RUC
  name: string;
}

export interface ModalState {
  isOpen: boolean;
  product: Product | null;
  isEditing: boolean;
  editingCartItem?: CartItem | null;
}
