import { HttpErrorResponse, HttpParams } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../../../../services/api.service'; // Asegúrate que la ruta sea correcta
import {
  BASE_FILE_URL,
  BASE_STORAGE_URL,
  BASE_UPLOAD_URL,
  BASE_URL,
  BASE_WEB_URL,
} from '../../../../../utils/constants';
import { CartItem, Customer, ModalState, Product } from '../models/pos.models';

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
        this.apiService.get<Product>('pos/products', {
          params: new HttpParams().set('sku', sku),
        }),
      );
      return product;
    } catch (error) {
      if (error instanceof HttpErrorResponse) {
        switch (error.status) {
          case 404:
            this.showToast('Producto no encontrado o código incorrecto');
            break;
          case 403: {
            const raw = error.error?.message ?? error.error?.error;
            const message = Array.isArray(raw) ? raw[0] : raw;
            this.showToast(
              (typeof message === 'string' && message.trim()
                ? message
                : null) ??
                'No tienes permisos o un almacén asignado para este producto',
            );
            break;
          }
          case 500:
            this.showToast(
              'Error interno del servidor al buscar el producto',
            );
            break;
          default:
            this.showToast('Error de red o conexión');
        }
      } else {
        this.showToast('Error de red o conexión');
      }
      return undefined;
    } finally {
      this.isLoading.set(false);
    }
  }

  async searchCustomerByDni(dni: string): Promise<boolean> {
    this.isLoading.set(true);
    try {
      const customer = await firstValueFrom(
        this.apiService.get<Customer>('pos/customers', {
          params: new HttpParams().set('dni', dni),
        }),
      );

      if (customer) {
        this.currentCustomer.set(customer);
        this.showToast('Cliente encontrado');
        return true;
      }
      return false;
    } catch (error) {
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

    if (!Array.isArray(payments) || payments.length < 1) {
      return this.showToast('Debe registrar al menos un método de pago');
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
          inventory: item.color.inventory,
        },
      })),
    };

    try {
      const response: any = await firstValueFrom(
        this.apiService.post('pos/checkout', payload),
      );

      if (response.success) {
        this.showToast(`Venta ${response.sale_id} Exitosa!`);
        this.printTicket(response.sale_id, response.ticket_url);
        this.clearCart();
      }
    } catch (error: any) {
      this.showToast('Error al procesar venta');
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
          const maxQty = item.color.inventory?.available_quantity ?? 0;
          if (newQty > maxQty) {
            this.showToast(`Stock máx: ${maxQty}`);
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

  async printTicket(saleId: number, ticketUrl?: string) {
    let url = ticketUrl;
    if (!url) {
      try {
        const response = await firstValueFrom(
          this.apiService.get<{ ticket_url: string }>(
            `pos/sales/${saleId}/ticket-url`,
          ),
        );
        url = response.ticket_url;
      } catch (error) {
        this.showToast('No se pudo generar el ticket de venta');
        return;
      }
    }

    if (!this.isValidTicketUrl(url)) {
      this.showToast('No se pudo imprimir: URL de ticket no válida');
      return;
    }

    try {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = url;
      document.body.appendChild(iframe);
      iframe.onload = () => {
        try {
          iframe.contentWindow?.print();
        } catch {
          // Fallo silencioso del diálogo de impresión del navegador
        }
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 5000);
      };
    } catch (error) {
      this.showToast('No se pudo imprimir el ticket de venta');
    }
  }

  private isValidTicketUrl(url: string): boolean {
    const normalized = (url ?? '').trim();
    if (!normalized) {
      return false;
    }

    const lower = normalized.toLowerCase();
    if (
      lower.startsWith('javascript:') ||
      lower.startsWith('data:') ||
      lower.startsWith('vbscript:') ||
      lower.startsWith('blob:')
    ) {
      return false;
    }

    try {
      const parsed = new URL(normalized);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return false;
      }

      return this.getAllowedTicketOrigins().has(parsed.origin);
    } catch {
      return false;
    }
  }

  private getAllowedTicketOrigins(): Set<string> {
    const origins = new Set<string>();
    for (const base of [
      BASE_URL,
      BASE_WEB_URL,
      BASE_FILE_URL,
      BASE_STORAGE_URL,
      BASE_UPLOAD_URL,
    ]) {
      try {
        origins.add(new URL(base).origin);
      } catch {
        // Ignorar entradas de entorno mal formadas
      }
    }
    return origins;
  }
}
