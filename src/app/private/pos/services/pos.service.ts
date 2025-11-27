import { Injectable, computed, signal } from '@angular/core';
import { CartItem, Customer, Product, ModalState } from '../models/pos.models';

// MOCK DB (Bórralo cuando conectes tu API)
const MOCK_DB: Product[] = [
  {
    id: '1',
    sku: '1001',
    name: 'Polo Slim Fit Algodón',
    basePrice: 35.0,
    variants: {
      S: [
        { colorName: 'Negro', hex: '#000000', stock: 10 },
        { colorName: 'Blanco', hex: '#ffffff', stock: 5 },
      ],
      M: [
        { colorName: 'Rojo', hex: '#ef4444', stock: 3 },
        { colorName: 'Negro', hex: '#000000', stock: 8 },
      ],
    },
  },
  {
    id: '2',
    sku: '2002',
    name: 'Jeans Denim Clásico',
    basePrice: 80.0,
    variants: {
      '30': [{ colorName: 'Azul', hex: '#1e3a8a', stock: 15 }],
      '32': [{ colorName: 'Negro', hex: '#000000', stock: 4 }],
    },
  },
];

@Injectable({ providedIn: 'root' })
export class PosService {
  // --- STATE SIGNALS ---
  cart = signal<CartItem[]>([]);
  currentCustomer = signal<Customer | null>(null);

  // Estado del Modal (Selector)
  modalState = signal<ModalState>({
    isOpen: false,
    product: null,
    isEditing: false,
  });

  // Toast Global
  toastMessage = signal<string | null>(null);

  // --- COMPUTEDS ---
  grandTotal = computed(() =>
    this.cart().reduce((acc, item) => acc + item.total, 0),
  );
  totalItems = computed(() =>
    this.cart().reduce((acc, item) => acc + item.quantity, 0),
  );

  // --- MÉTODOS (Aquí irían tus APIs) ---

  searchProductBySku(sku: string): Product | undefined {
    // TODO: Reemplazar con API -> return this.http.get<Product>(`/api/products/${sku}`)
    return MOCK_DB.find(p => p.sku === sku);
  }

  searchCustomerByDni(dni: string) {
    // TODO: Reemplazar con API -> this.http.get<Customer>(`/api/customers/${dni}`).subscribe(...)
    if (dni.length >= 8) {
      this.currentCustomer.set({
        id: 'c1',
        dni,
        name: 'Empresa Textil S.A.C.',
      });
      this.showToast('Cliente Encontrado');
      return true;
    }
    this.showToast('DNI Inválido');
    return false;
  }

  // --- GESTIÓN DEL CARRITO ---

  addItem(item: CartItem) {
    this.cart.update(prev => [...prev, item]);
    this.showToast('Producto Agregado');
  }

  updateItem(updatedItem: CartItem) {
    this.cart.update(items =>
      items.map(i => (i.cartId === updatedItem.cartId ? updatedItem : i)),
    );
    this.showToast('Ítem Actualizado');
  }

  removeItem(cartId: number) {
    this.cart.update(items => items.filter(i => i.cartId !== cartId));
  }

  clearCart() {
    this.cart.set([]);
    this.currentCustomer.set(null);
  }

  updateQuantity(cartId: number, delta: number) {
    this.cart.update(items =>
      items.map(item => {
        if (item.cartId === cartId) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return item;
          if (newQty > item.color.stock) {
            this.showToast(`Max Stock: ${item.color.stock}`);
            return item;
          }
          return { ...item, quantity: newQty, total: newQty * item.unitPrice };
        }
        return item;
      }),
    );
  }

  // --- GESTIÓN DEL MODAL ---

  openAddModal(product: Product) {
    this.modalState.set({ isOpen: true, product, isEditing: false });
  }

  openEditModal(item: CartItem) {
    const product = MOCK_DB.find(p => p.sku === item.sku); // O buscar en tu lista de productos cargados
    if (product) {
      this.modalState.set({
        isOpen: true,
        product,
        isEditing: true,
        editingCartItem: item,
      });
    }
  }

  closeModal() {
    this.modalState.set({ isOpen: false, product: null, isEditing: false });
  }

  // --- UTILIDADES ---
  showToast(msg: string) {
    this.toastMessage.set(msg);
    setTimeout(() => this.toastMessage.set(null), 2500);
  }

  processCheckout() {
    // TODO: Enviar venta al backend
    console.log('Venta:', {
      customer: this.currentCustomer(),
      items: this.cart(),
      total: this.grandTotal(),
    });
    alert('✅ Venta Procesada');
    this.clearCart();
  }
}
