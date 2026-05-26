import { HttpErrorResponse, HttpParams } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../../../../services/api.service'; // Asegúrate que la ruta sea correcta
import { DocumentType } from '../../list/models/sales.model';
import { PrintReceiptComponent } from '../components/print-receipt/print-receipt.component';
import { CartItem, Customer, ModalState, Product } from '../models/pos.models';

/** Series por defecto por tipo de documento. Configurable por almacén en el futuro. */
const DEFAULT_SERIE: Record<Exclude<DocumentType, 'TICKET_INTERNO'>, string> = {
  BOLETA: 'B001',
  FACTURA: 'F001',
};

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
  /** Tipo de comprobante electrónico seleccionado por el cajero. */
  documentType = signal<DocumentType>('TICKET_INTERNO');
  /** Serie derivada automáticamente del tipo de comprobante. */
  serie = computed<string>(() => {
    const type = this.documentType();
    return type === 'TICKET_INTERNO' ? '' : (DEFAULT_SERIE[type] ?? '');
  });
  /** Última venta exitosa; botón manual si el diálogo de impresión no aparece (tablets). */
  lastSaleIdForReprint = signal<number | null>(null);

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
            this.showToast('Error interno del servidor al buscar el producto');
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
      document_type: this.documentType(),
      serie: this.serie() || undefined,
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

      if (response?.success) {
        this.clearCart();
        this.lastSaleIdForReprint.set(response.sale_id);
        this.showToast(`Venta ${response.sale_id} Exitosa!`, 4_000);
        await this.printTicket(response.sale_id);
      } else {
        const rawMessage = response?.message ?? response?.error;
        const businessMessage = Array.isArray(rawMessage)
          ? rawMessage[0]
          : rawMessage;
        this.showToast(
          typeof businessMessage === 'string' && businessMessage.trim()
            ? businessMessage.trim()
            : 'La venta no pudo ser procesada',
        );
      }
    } catch (error: unknown) {
      const fallback = 'Error al procesar venta';
      if (error instanceof HttpErrorResponse) {
        const raw = error.error?.message || error.error?.error;
        const backendMessage = Array.isArray(raw) ? raw[0] : raw;
        if (typeof backendMessage === 'string' && backendMessage.trim()) {
          this.showToast(backendMessage.trim());
          return;
        }
      }
      this.showToast(fallback);
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

  /** Reinicia la venta activa (carrito, cliente, modal, pagos, tipo comprobante). Llamar al salir del POS. */
  clearCart(): void {
    this.cart.set([]);
    this.currentCustomer.set(null);
    this.paymentMethod.set('EFECTIVO');
    this.documentType.set('TICKET_INTERNO');
    this.modalState.set({ isOpen: false, product: null, isEditing: false });
    this.toastMessage.set(null);
    this.isLoading.set(false);
    this.lastSaleIdForReprint.set(null);
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

  showToast(msg: string, durationMs = 2_500) {
    this.toastMessage.set(msg);
    setTimeout(() => this.toastMessage.set(null), durationMs);
  }

  setPaymentMethod(method: 'EFECTIVO' | 'YAPE/PLIN' | 'TRANSFERENCIA') {
    this.paymentMethod.set(method);
  }

  /**
   * Ticket aislado en iframe oculto → print() solo del contenido formateado (Android/ESC-POS).
   */
  async printTicket(saleId: number): Promise<void> {
    try {
      const html = await firstValueFrom(
        this.apiService.getHtml(`pos/sales/${saleId}/ticket`),
      );
      const htmlFormateado = PrintReceiptComponent.prepareForPrint(html);
      await this.printHtmlInHiddenIframe(htmlFormateado);
    } catch (error) {
      console.warn('No se pudo imprimir el ticket de venta', error);
      this.showToast(
        'Venta registrada. Toca «Imprimir ticket» para reintentar.',
      );
    }
  }

  /** Reimpresión manual con gesto de usuario (útil en tablets si el print auto falla). */
  async reprintLastTicket(): Promise<void> {
    const saleId = this.lastSaleIdForReprint();
    if (saleId == null) {
      return;
    }
    await this.printTicket(saleId);
  }

  private createHiddenIframeWithContent(
    htmlContent: string,
  ): HTMLIFrameElement {
    this.removePrintFrame();

    const iframe = document.createElement('iframe');
    iframe.id = 'pos-ticket-print-frame';
    iframe.setAttribute('title', 'Ticket de venta');
    iframe.setAttribute(
      'style',
      'display:none;position:absolute;width:0;height:0;border:0;visibility:hidden;',
    );
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument ?? iframe.contentWindow?.document;
    if (!doc) {
      throw new Error(
        'No se pudo acceder al documento del iframe de impresión',
      );
    }

    doc.open();
    doc.write(htmlContent);
    doc.close();

    return iframe;
  }

  private printHtmlInHiddenIframe(htmlContent: string): Promise<void> {
    return new Promise(resolve => {
      let iframe: HTMLIFrameElement;

      try {
        iframe = this.createHiddenIframeWithContent(htmlContent);
      } catch {
        this.showToast('Toca «Imprimir ticket» para reintentar.');
        resolve();
        return;
      }

      const runPrint = () => {
        const printWindow = iframe.contentWindow;
        if (!printWindow) {
          this.showToast('Toca «Imprimir ticket» para reintentar.');
          this.removePrintFrame();
          resolve();
          return;
        }

        const cleanup = () => {
          this.removePrintFrame();
          resolve();
        };

        printWindow.addEventListener('afterprint', cleanup, { once: true });

        requestAnimationFrame(() => {
          setTimeout(() => {
            try {
              printWindow.focus();
              printWindow.print();
            } catch {
              this.showToast('Toca «Imprimir ticket» para reintentar.');
              cleanup();
              return;
            }
            // Safari/Android a veces no dispara afterprint
            setTimeout(cleanup, 15_000);
          }, 300);
        });
      };

      if (iframe.contentDocument?.readyState === 'complete') {
        runPrint();
      } else {
        iframe.onload = runPrint;
      }
    });
  }

  private removePrintFrame(): void {
    document.getElementById('pos-ticket-print-frame')?.remove();
  }
}
