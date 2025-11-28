import { Injectable, computed, inject, signal } from '@angular/core';
import { CartItem, Customer, Product, ModalState } from '../models/pos.models';
import { firstValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class PosService {
  private http = inject(HttpClient);
  // Cambia esto por la URL real de tu API Laravel
  private readonly API_URL = 'http://localhost:8000/api/pos';

  // --- STATE ---
  cart = signal<CartItem[]>([]);
  currentCustomer = signal<Customer | null>(null);
  modalState = signal<ModalState>({
    isOpen: false,
    product: null,
    isEditing: false,
  });
  toastMessage = signal<string | null>(null);
  paymentMethod = signal<'CASH' | 'QR' | 'TRANSFER'>('CASH');
  isLoading = signal<boolean>(false);

  // --- COMPUTEDS ---
  grandTotal = computed(() =>
    this.cart().reduce((acc, item) => acc + item.total, 0),
  );
  totalItems = computed(() =>
    this.cart().reduce((acc, item) => acc + item.quantity, 0),
  );

  // --- API METHODS ---

  async searchProductBySku(sku: string): Promise<Product | undefined> {
    this.isLoading.set(true);
    try {
      // GET /api/pos/products?sku={sku}
      const product = await firstValueFrom(
        this.http.get<Product>(`${this.API_URL}/products`, { params: { sku } }),
      );
      return product;
    } catch (error) {
      console.error('Error buscando producto:', error);
      this.showToast('Producto no encontrado');
      return undefined;
    } finally {
      this.isLoading.set(false);
    }
  }

  async searchCustomerByDni(dni: string): Promise<boolean> {
    this.isLoading.set(true);
    try {
      // GET /api/pos/customers?dni={dni}
      const customer = await firstValueFrom(
        this.http.get<Customer>(`${this.API_URL}/customers`, {
          params: { dni },
        }),
      );

      if (customer) {
        this.currentCustomer.set(customer);
        this.showToast('Cliente encontrado');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error buscando cliente:', error);
      this.showToast('Cliente no encontrado / Error API');
      return false;
    } finally {
      this.isLoading.set(false);
    }
  }

  async processCheckout() {
    if (this.cart().length === 0) {
      return this.showToast('El carrito está vacío');
    }
    if (!this.currentCustomer()) {
      return this.showToast('Seleccione un cliente');
    }

    this.isLoading.set(true);

    // Payload exacto para tu Laravel SaleService
    const payload = {
      customer: { id: this.currentCustomer()!.id },
      total: this.grandTotal(),
      payment_method: this.paymentMethod(),
      items: this.cart().map(item => ({
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total,
        size: item.size, // Informativo
        // Aquí enviamos el objeto color que contiene los IDs críticos
        color: {
          product_size_id: item.color.product_size_id,
          color_id: item.color.color_id,
          colorName: item.color.colorName,
          hex: item.color.hex,
          stock: item.color.stock,
        },
      })),
    };

    try {
      // POST /api/pos/checkout
      const response: any = await firstValueFrom(
        this.http.post(`${this.API_URL}/checkout`, payload),
      );

      if (response.success) {
        alert(
          `✅ Venta Registrada ID: ${response.sale_id}\nImprimiendo ticket...`,
        );
        this.clearCart();
      } else {
        alert('❌ Error al procesar venta: ' + response.message);
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      const msg = error.error?.message || 'Error de conexión';
      alert('❌ Error: ' + msg);
    } finally {
      this.isLoading.set(false);
    }
  }

  // --- GESTIÓN LOCAL (Sin cambios mayores) ---

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
    this.paymentMethod.set('CASH');
  }

  updateQuantity(cartId: number, delta: number) {
    this.cart.update(items =>
      items.map(item => {
        if (item.cartId === cartId) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return item;

          // Validación local de stock
          if (newQty > item.color.stock) {
            this.showToast(`Stock máx: ${item.color.stock}`);
            return item;
          }
          return { ...item, quantity: newQty, total: newQty * item.unitPrice };
        }
        return item;
      }),
    );
  }

  openAddModal(product: Product) {
    this.modalState.set({ isOpen: true, product, isEditing: false });
  }

  openEditModal(item: CartItem) {
    // Nota: Como no tenemos toda la DB en memoria, idealmente aquí haríamos un fetch
    // del producto de nuevo para tener sus variantes frescas.
    // Por simplicidad en este ejemplo, buscaremos si acabamos de escanearlo o asumimos integridad.
    // Para producción: Llamar a searchProductBySku(item.sku) antes de abrir.

    this.searchProductBySku(item.sku).then(prod => {
      if (prod) {
        this.modalState.set({
          isOpen: true,
          product: prod,
          isEditing: true,
          editingCartItem: item,
        });
      }
    });
  }

  closeModal() {
    this.modalState.set({ isOpen: false, product: null, isEditing: false });
  }

  showToast(msg: string) {
    this.toastMessage.set(msg);
    setTimeout(() => this.toastMessage.set(null), 2500);
  }

  setPaymentMethod(method: 'CASH' | 'QR' | 'TRANSFER') {
    this.paymentMethod.set(method);
  }
}
