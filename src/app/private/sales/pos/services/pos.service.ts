import { Injectable, computed, inject, signal } from '@angular/core';
import { CartItem, Customer, Product, ModalState } from '../models/pos.models';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../../../services/api.service'; // Asegúrate que la ruta sea correcta

@Injectable({ providedIn: 'root' })
export class PosService {
  // 1. Inyectamos solo tu ApiService centralizado
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
  paymentMethod = signal<'EFECTIVO' | 'YAPE/PLIN' | 'TRANSFERENCIA'>(
    'EFECTIVO',
  );
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

  // --- NUEVO MÉTODO PARA PAGOS HÍBRIDOS (Integrado) ---
  async processCheckoutWithPayments(payments: any[]) {
    if (this.cart().length === 0) {
      return this.showToast('El carrito está vacío');
    }

    this.isLoading.set(true);

    // CORRECCIÓN: Estructura anidada para cumplir validación 'items.*.color.product_size_id'
    const payload = {
      // Usamos objeto customer para compatibilidad si el backend espera 'customer.id'
      customer: { id: this.currentCustomer()?.id },
      total: this.grandTotal(),
      payments: payments,
      items: this.cart().map(item => ({
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total,
        size: item.size,
        // Volvemos a anidar los IDs dentro de 'color' como antes
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
      const response: any = await firstValueFrom(
        this.apiService.post('pos/checkout', payload),
      );

      if (response.success) {
        this.showToast(`Venta ${response.sale_id} Exitosa!`);
        this.printTicket(response.sale_id);
        this.clearCart();
      }
    } catch (error: any) {
      this.showToast('Error al procesar venta');
      console.error(error);
    } finally {
      this.isLoading.set(false);
    }
  }

  // Mantenemos el método antiguo por compatibilidad (o para llamadas simples)
  async processCheckout() {
    if (this.cart().length === 0) {
      return this.showToast('El carrito está vacío');
    }

    // Si se llama a este método directamente (desde un botón antiguo),
    // asumimos que el pago es 100% con el método seleccionado en el signal 'paymentMethod'.
    const currentMethod = this.paymentMethod();
    let backendMethod = 'CASH';
    if (currentMethod === 'YAPE/PLIN') backendMethod = 'YAPE';
    if (currentMethod === 'TRANSFERENCIA') backendMethod = 'CARD';

    // Construimos el array de pagos único
    const payments = [
      {
        method: backendMethod,
        amount: this.grandTotal(),
      },
    ];

    // Reutilizamos la lógica corregida
    return this.processCheckoutWithPayments(payments);
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
    this.paymentMethod.set('EFECTIVO');
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

  setPaymentMethod(method: 'EFECTIVO' | 'YAPE/PLIN' | 'TRANSFERENCIA') {
    this.paymentMethod.set(method);
  }

  printTicket(saleId: number) {
    console.log('Imprimiendo ticket para venta ID:', saleId);
    const baseUrl = this.apiService.BASE_URL.replace(/\/api\/?$/, '');
    const ticketUrl = `${baseUrl}/pos/sales/${saleId}/ticket`;
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = ticketUrl;
    document.body.appendChild(iframe);
    iframe.onload = () => {
      try {
        iframe.contentWindow?.print();
      } catch (e) {
        console.error(e);
      }
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 5000);
    };
  }
}
