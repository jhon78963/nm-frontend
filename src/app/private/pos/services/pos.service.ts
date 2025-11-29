import { Injectable, computed, inject, signal } from '@angular/core';
import { CartItem, Customer, Product, ModalState } from '../models/pos.models';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../../services/api.service'; // Asegúrate que la ruta sea correcta
import { BASE_WEB_URL } from '../../../utils/constants';

@Injectable({ providedIn: 'root' })
export class PosService {
  // 1. Inyectamos solo tu ApiService centralizado
  BASE_URL = BASE_WEB_URL;
  private apiService = inject(ApiService);

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
      // Cambio: Usamos apiService.get y pasamos el query param en la URL
      // Asumiendo que tu BASE_URL termina antes de "api"
      const product = await firstValueFrom(
        this.apiService.get<Product>(`pos/products?sku=${sku}`),
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
      // Cambio: Query param directo en el string
      const customer = await firstValueFrom(
        this.apiService.get<Customer>(`pos/customers?dni=${dni}`),
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

    this.isLoading.set(true);

    const payload = {
      customer: { id: this.currentCustomer()?.id }, // Se maneja null en el backend con ??
      total: this.grandTotal(),
      payment_method: this.paymentMethod(),
      items: this.cart().map(item => ({
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total,
        size: item.size,
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
      // Cambio: Usamos apiService.post
      const response: any = await firstValueFrom(
        this.apiService.post('pos/checkout', payload),
      );

      if (response.success) {
        this.showToast(
          `Venta Registrada ID: ${response.sale_id}\nImprimiendo ticket...`,
        );
        const ticketUrl = `${this.BASE_URL}/pos/sales/${response.sale_id}/ticket`;
        window.open(ticketUrl, '_blank');
        this.clearCart();
      } else {
        this.showToast('Error al procesar venta');
      }
    } catch (error: any) {
      this.showToast('Error: Intente nuevamente!');
      console.error(error);
    } finally {
      this.isLoading.set(false);
    }
  }

  // --- GESTIÓN LOCAL (Igual que antes) ---

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
