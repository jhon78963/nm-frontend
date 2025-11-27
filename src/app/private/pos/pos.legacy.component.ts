import {
  Component,
  computed,
  ElementRef,
  signal,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// --- INTERFACES ---
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

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Contenedor Principal -->
    <div
      class="flex flex-column h-screen bg-ground font-family overflow-hidden relative bg-white rounded-xl">
      <!-- TOAST (Notificación Flotante) -->
      @if (toastMessage()) {
        <div
          class="fixed top-0 left-50 border-round-2xl mt-4 px-4 py-3 shadow-6 z-5 bg-gray-900 text-white flex align-items-center gap-2 fadein-animation"
          style="transform: translateX(-50%);">
          <i class="pi pi-info-circle text-lg"></i>
          <span class="font-bold text-sm">{{ toastMessage() }}</span>
        </div>
      }

      <!-- 1. HEADER (Fijo arriba) -->
      <header
        class="bg-white px-3 py-3 shadow-1 z-2 relative border-bottom-1 border-gray-100 flex-shrink-0">
        <div class="flex justify-content-between align-items-center mb-2">
          <i class="pi pi-bars text-xl text-gray-500"></i>
          <div class="font-bold text-gray-700">POS</div>
          <div
            class="w-2rem h-2rem border-circle bg-gray-200 flex align-items-center justify-content-center">
            <i class="pi pi-user text-gray-500"></i>
          </div>
        </div>

        <!-- Buscador Cliente -->
        <div class="relative w-full">
          <i
            class="pi pi-user absolute text-gray-400 z-1"
            style="top: 50%; left: 1rem; transform: translateY(-50%)"></i>
          <input
            type="tel"
            [(ngModel)]="dniQuery"
            (keydown.enter)="searchCustomer()"
            class="w-full border-round-xl py-3 pl-6 pr-6 border-none bg-gray-100 font-medium text-gray-800 focus:bg-white focus:shadow-input transition-all "
            placeholder="DNI / RUC Cliente"
            inputmode="numeric" />
          <button
            (click)="searchCustomer()"
            class="absolute right-0 top-0 h-full w-3rem border-none bg-indigo-600 border-round-right-xl text-white cursor-pointer hover:bg-indigo-700">
            <i class="pi pi-search"></i>
          </button>
        </div>

        <!-- Tarjeta Cliente Seleccionado -->
        @if (currentCustomer()) {
          <div
            class="mt-2 bg-indigo-50 border-1 border-indigo-100 border-round-xl p-2 flex justify-content-between align-items-center slide-down">
            <div class="flex align-items-center gap-2 overflow-hidden">
              <div
                class="bg-indigo-600 text-white border-circle w-2rem h-2rem flex align-items-center justify-content-center flex-shrink-0">
                <i class="pi pi-check text-xs"></i>
              </div>
              <div class="overflow-hidden">
                <div
                  class="font-bold text-indigo-900 text-sm white-space-nowrap overflow-hidden text-overflow-ellipsis">
                  {{ currentCustomer()?.name }}
                </div>
                <div class="text-xs text-indigo-500 font-medium">
                  {{ currentCustomer()?.dni }}
                </div>
              </div>
            </div>
            <button
              class="bg-transparent border-none text-gray-400 hover:text-gray-600 cursor-pointer p-2"
              (click)="resetCustomer()">
              <i class="pi pi-times"></i>
            </button>
          </div>
        }
      </header>

      <!-- 2. MAIN CONTENT (Scrollable con padding extra abajo para el footer flotante) -->
      <main
        class="flex-1 overflow-y-auto p-3 pb-8"
        #mainScroll
        style="padding-bottom: 140px !important;">
        <!-- Scanner Input Estilizado -->
        <div
          class="mb-4 bg-white border-round-xl shadow-1 overflow-hidden flex align-items-center border-1 border-gray-100">
          <input
            #barcodeInput
            type="text"
            [(ngModel)]="barcodeQuery"
            (keydown.enter)="onBarcodeEnter()"
            class="flex-1 py-3 px-3 text-lg font-mono border-none outline-none text-gray-800 placeholder-gray-400"
            placeholder="Escanear código..."
            autofocus />
          <button
            class="bg-gray-100 text-gray-600 border-none px-4 py-3 cursor-pointer hover:bg-gray-200 border-left-1 border-gray-200"
            (click)="onBarcodeEnter()">
            <i class="pi pi-barcode text-xl"></i>
          </button>
        </div>

        <!-- Header Sección Carrito -->
        <div
          class="flex justify-content-between align-items-end mb-3 px-1 border-bottom-1 border-gray-200 pb-2">
          <span
            class="text-xs font-bold text-gray-500 uppercase tracking-widest"
            >Carrito ({{ totalItems() }})</span
          >
          <span
            class="text-xs font-bold text-red-500 cursor-pointer hover:text-red-700 uppercase"
            *ngIf="cart().length > 0"
            (click)="clearCart()"
            >Vaciar</span
          >
        </div>

        <!-- Lista Items -->
        @if (cart().length === 0) {
          <div
            class="flex flex-column align-items-center justify-content-center py-8 opacity-40 text-gray-400">
            <i class="pi pi-shopping-bag text-6xl mb-3 text-gray-300"></i>
            <span class="text-sm font-medium">Empieza a escanear</span>
          </div>
        } @else {
          <div class="flex flex-column gap-3">
            @for (item of cart(); track item.cartId) {
              <div
                class="bg-white p-3 border-round-2xl shadow-1 flex gap-3 relative overflow-hidden fadein-animation item-card border-1 border-gray-50">
                <!-- Indicador de Color (Circular ahora, más elegante) -->
                <div
                  class="w-3rem h-3rem border-circle shadow-1 flex-shrink-0 mt-1"
                  [style.background-color]="item.color.hex"
                  [class.border-1]="item.color.hex === '#ffffff'"
                  [class.border-gray-200]="item.color.hex === '#ffffff'"></div>

                <!-- Info -->
                <div class="flex-1 min-w-0">
                  <div
                    class="flex justify-content-between align-items-start mb-1">
                    <span
                      class="font-bold text-gray-900 text-sm line-height-2 block pr-2">
                      {{ item.name }}
                    </span>
                    <i
                      class="pi pi-trash text-red-300 hover:text-red-500 cursor-pointer p-1"
                      (click)="removeItem(item.cartId)"></i>
                  </div>

                  <!-- Chips de Talla y Precio -->
                  <div class="flex align-items-center flex-wrap gap-2">
                    <div
                      class="bg-gray-50 border-1 border-gray-200 border-round-lg px-2 py-1 flex align-items-center gap-1 cursor-pointer hover:bg-gray-100 transition-colors"
                      (click)="openEditModal(item)">
                      <span class="text-xs font-bold text-gray-600 uppercase"
                        >{{ item.size }} • {{ item.color.colorName }}</span
                      >
                      <i class="pi pi-pencil text-xs text-indigo-400 ml-1"></i>
                    </div>

                    <span
                      class="ml-auto font-bold text-indigo-600 text-sm cursor-pointer border-bottom-1 border-indigo-300"
                      (click)="openEditModal(item)">
                      S/ {{ item.unitPrice | number: '1.2-2' }}
                    </span>
                  </div>

                  <!-- Control Cantidad Inferior -->
                  <div
                    class="flex justify-content-between align-items-center mt-3 pt-2 border-top-1 border-gray-100">
                    <div
                      class="flex align-items-center bg-gray-50 border-round-lg border-1 border-gray-200 h-2rem shadow-none">
                      <button
                        class="border-none bg-transparent px-3 h-full text-gray-500 font-bold hover:bg-gray-200 border-round-left-lg cursor-pointer"
                        (click)="updateQuantity(item.cartId, -1)">
                        -
                      </button>
                      <span class="font-bold text-sm w-2rem text-center">{{
                        item.quantity
                      }}</span>
                      <button
                        class="border-none bg-transparent px-3 h-full text-indigo-600 font-bold hover:bg-indigo-50 border-round-right-lg cursor-pointer"
                        (click)="updateQuantity(item.cartId, 1)">
                        +
                      </button>
                    </div>
                    <span class="font-bold text-sm text-gray-800"
                      >Total: S/ {{ item.total | number: '1.2-2' }}</span
                    >
                  </div>
                </div>
              </div>
            }
          </div>
        }
      </main>

      <!-- 3. FOOTER FLOTANTE (Siempre visible) -->
      <div
        class="fixed bottom-0 left-0 w-full bg-white z-4 shadow-top border-top-1 border-gray-100 px-4 py-3 fadein-animation">
        <div class="flex justify-content-between align-items-center mb-3">
          <span
            class="text-xs font-bold text-gray-500 uppercase letter-spacing-1"
            >Total a Pagar</span
          >
          <span class="text-3xl font-black text-gray-900"
            >S/ {{ grandTotal() | number: '1.2-2' }}</span
          >
        </div>
        <button
          class="w-full bg-indigo-700 text-white py-3 border-round-xl font-bold text-lg shadow-3 border-none cursor-pointer hover:bg-indigo-800 active:scale-95 transition-all flex justify-content-center align-items-center gap-2"
          (click)="checkout()">
          <i class="pi pi-check-circle text-xl"></i>
          <span>COBRAR</span>
        </button>
      </div>

      <!-- MODAL SELECTOR -->
      @if (showSelector) {
        <div
          class="fixed top-0 left-0 w-full h-full z-6 flex align-items-end sm:align-items-center justify-content-center glass-overlay fadein-animation">
          <div
            class="bg-white w-full sm:w-30rem border-round-top-2xl sm:border-round-2xl p-4 shadow-6 slide-up max-h-screen overflow-y-auto relative">
            <button
              class="absolute top-0 right-0 m-3 bg-transparent border-none text-gray-400 hover:text-gray-600 cursor-pointer p-2"
              (click)="closeSelector()">
              <i class="pi pi-times text-xl"></i>
            </button>

            <div class="mb-4 pr-5">
              <h2 class="text-xl font-bold text-gray-900 m-0 line-height-2">
                {{ selectedProduct()?.name }}
              </h2>
              <p class="text-gray-500 text-sm font-mono m-0 mt-1">
                SKU: {{ selectedProduct()?.sku }}
              </p>
            </div>

            <div
              class="mb-4 bg-yellow-50 border-1 border-yellow-200 border-round-xl p-3 flex justify-content-between align-items-center">
              <label class="text-xs font-bold text-yellow-800 uppercase"
                >Precio Unitario:</label
              >
              <div class="relative">
                <span
                  class="absolute text-gray-500 text-lg font-bold"
                  style="left: 0; top: 50%; transform: translateY(-50%)"
                  >S/</span
                >
                <input
                  type="number"
                  [(ngModel)]="tempPrice"
                  class="w-8rem text-right font-black text-2xl bg-transparent border-none outline-none text-gray-900 p-0"
                  (focus)="$any($event.target).select()" />
              </div>
            </div>

            <div class="mb-4">
              <label
                class="text-xs font-bold text-gray-400 uppercase block mb-2"
                >1. Selecciona Talla</label
              >
              <div class="flex gap-2 flex-wrap">
                @for (size of availableSizes(); track size) {
                  <div
                    class="px-4 py-3 border-1 border-round-xl cursor-pointer transition-all font-bold text-sm min-w-3rem text-center select-none shadow-1"
                    [class.border-indigo-600]="tempSize() === size"
                    [class.bg-indigo-600]="tempSize() === size"
                    [class.text-white]="tempSize() === size"
                    [class.border-gray-100]="tempSize() !== size"
                    [class.bg-white]="tempSize() !== size"
                    [class.text-gray-600]="tempSize() !== size"
                    (click)="selectSize(size)">
                    {{ size }}
                  </div>
                }
              </div>
            </div>

            <div
              class="mb-4"
              [class.opacity-50]="!tempSize()"
              [class.pointer-events-none]="!tempSize()">
              <div class="flex justify-content-between mb-2">
                <label class="text-xs font-bold text-gray-400 uppercase"
                  >2. Selecciona Color</label
                >
                @if (tempColor(); as color) {
                  <span
                    class="text-xs font-bold"
                    [class.text-green-600]="color.stock > 5"
                    [class.text-red-500]="color.stock <= 5">
                    Stock: {{ color.stock }}
                  </span>
                }
              </div>
              <div class="flex gap-3 flex-wrap">
                @for (v of availableColors(); track v.colorName) {
                  <div
                    class="w-3rem h-3rem border-circle border-2 cursor-pointer relative shadow-1 transition-transform active:scale-90 flex align-items-center justify-content-center"
                    [class.border-indigo-500]="tempColor() === v"
                    [class.border-transparent]="
                      tempColor() !== v && v.hex !== '#ffffff'
                    "
                    [class.border-gray-200]="v.hex === '#ffffff'"
                    [style.background-color]="v.hex"
                    (click)="v.stock > 0 ? selectColor(v) : null"
                    [class.opacity-40]="v.stock === 0">
                    @if (tempColor() === v) {
                      <i
                        class="pi pi-check text-white text-xl shadow-2 border-circle p-1 bg-black-alpha-10"></i>
                    }
                  </div>
                }
              </div>
            </div>

            <div class="flex gap-3 pt-3 border-top-1 border-gray-300">
              <div
                class="flex align-items-center border-1 border-gray-200 border-round-xl w-10rem justify-content-between px-1 bg-white shadow-1">
                <button
                  class="p-3 border-none bg-transparent text-gray-500 font-bold hover:text-black cursor-pointer text-xl"
                  (click)="adjustTempQty(-1)">
                  -
                </button>
                <span class="font-bold text-xl text-gray-800">{{
                  tempQty
                }}</span>
                <button
                  class="p-3 border-none bg-transparent text-indigo-600 font-bold hover:text-indigo-800 cursor-pointer text-xl"
                  (click)="adjustTempQty(1)">
                  +
                </button>
              </div>

              <button
                class="flex-1 font-bold py-3 bg-gray-900 text-white border-round-xl shadow-3 border-none cursor-pointer hover:bg-black transition-all disabled:opacity-50 text-lg"
                [disabled]="!tempSize() || !tempColor()"
                (click)="confirmSelection()">
                {{ isEditing ? 'GUARDAR' : 'AGREGAR' }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .bg-ground {
        background-color: #f4f6f9;
      } /* Un gris azulado muy suave */
      .shadow-input {
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
      }
      .shadow-top {
        box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.08);
      } /* Sombra para el footer flotante */
      .glass-overlay {
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(4px);
      }
      .item-card {
        transition: transform 0.1s;
      }
      .item-card:active {
        transform: scale(0.99);
      }

      .fadein-animation {
        animation: fadein 0.2s ease-out;
      }
      .slide-up {
        animation: slideup 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      }
      .slide-down {
        animation: slidedown 0.3s ease-out;
      }

      @keyframes fadein {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
      @keyframes slideup {
        from {
          transform: translateY(100%);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }
      @keyframes slidedown {
        from {
          transform: translateY(-10px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }
    `,
  ],
})
export class PosComponent {
  cart = signal<CartItem[]>([]);
  products = signal<Product[]>(MOCK_DB);

  dniQuery = '';
  currentCustomer = signal<Customer | null>(null);

  barcodeQuery = '';
  @ViewChild('barcodeInput') barcodeInput!: ElementRef;

  showSelector = false;
  isEditing = false;
  editingCartId: number | null = null;
  selectedProduct = signal<Product | null>(null);

  toastMessage = signal<string | null>(null);

  tempSize = signal<string | null>(null);
  tempColor = signal<Variant | null>(null);

  tempQty: number = 1;
  tempPrice: number = 0;

  availableSizes = computed(() => {
    const prod = this.selectedProduct();
    return prod ? Object.keys(prod.variants) : [];
  });

  availableColors = computed(() => {
    const prod = this.selectedProduct();
    const size = this.tempSize();
    if (!prod || !size) return [];
    return prod.variants[size] || [];
  });

  grandTotal = computed(() =>
    this.cart().reduce((acc, item) => acc + item.total, 0),
  );
  totalItems = computed(() =>
    this.cart().reduce((acc, item) => acc + item.quantity, 0),
  );

  showToast(msg: string) {
    this.toastMessage.set(msg);
    setTimeout(() => this.toastMessage.set(null), 2500);
  }

  // Lógica idéntica al anterior
  searchCustomer() {
    if (this.dniQuery.length >= 8) {
      this.currentCustomer.set({
        id: 'c1',
        dni: this.dniQuery,
        name: 'Empresa Textil S.A.C.',
      });
      this.showToast('Cliente Encontrado');
      setTimeout(() => this.barcodeInput?.nativeElement.focus(), 100);
    } else {
      this.showToast('DNI Inválido (min 8 dígitos)');
    }
  }

  resetCustomer() {
    this.currentCustomer.set(null);
    this.dniQuery = '';
  }

  onBarcodeEnter() {
    const code = this.barcodeQuery.trim();
    if (!code) return;
    const prod = this.products().find(p => p.sku === code);
    if (prod) {
      this.openAddModal(prod);
      this.barcodeQuery = '';
    } else {
      this.showToast(`Código ${code} no existe`);
      this.barcodeQuery = '';
    }
  }

  openAddModal(prod: Product) {
    this.isEditing = false;
    this.editingCartId = null;
    this.selectedProduct.set(prod);
    this.tempSize.set(null);
    this.tempColor.set(null);
    this.tempQty = 1;
    this.tempPrice = prod.basePrice;
    this.showSelector = true;
  }

  openEditModal(item: CartItem) {
    const prod = this.products().find(p => p.sku === item.sku);
    if (!prod) return;
    this.isEditing = true;
    this.editingCartId = item.cartId;
    this.selectedProduct.set(prod);
    this.tempSize.set(item.size);
    this.tempQty = item.quantity;
    this.tempPrice = item.unitPrice;

    const colors = this.availableColors();
    const matchedColor =
      colors.find(
        c => c.hex === item.color.hex && c.colorName === item.color.colorName,
      ) || null;
    this.tempColor.set(matchedColor);
    this.showSelector = true;
  }

  closeSelector() {
    this.showSelector = false;
    setTimeout(() => this.barcodeInput?.nativeElement.focus(), 300);
  }

  selectSize(size: string) {
    this.tempSize.set(size);
    this.tempColor.set(null);
  }

  selectColor(variant: Variant) {
    this.tempColor.set(variant);
  }

  adjustTempQty(delta: number) {
    const newVal = this.tempQty + delta;
    if (newVal < 1) return;
    const currentColor = this.tempColor();
    if (currentColor && newVal > currentColor.stock) {
      this.showToast(`Stock máximo: ${currentColor.stock}`);
      return;
    }
    this.tempQty = newVal;
  }

  confirmSelection() {
    const currentSize = this.tempSize();
    const currentColor = this.tempColor();
    if (!this.selectedProduct() || !currentSize || !currentColor) return;
    const totalLine = this.tempPrice * this.tempQty;

    if (this.isEditing && this.editingCartId) {
      this.cart.update(items =>
        items.map(item => {
          if (item.cartId === this.editingCartId) {
            return {
              ...item,
              size: currentSize,
              color: currentColor,
              quantity: this.tempQty,
              unitPrice: this.tempPrice,
              total: totalLine,
            };
          }
          return item;
        }),
      );
      this.showToast('Ítem Actualizado');
    } else {
      const newItem: CartItem = {
        cartId: Date.now(),
        productId: this.selectedProduct()!.id,
        sku: this.selectedProduct()!.sku,
        name: this.selectedProduct()!.name,
        size: currentSize,
        color: currentColor,
        quantity: this.tempQty,
        unitPrice: this.tempPrice,
        total: totalLine,
      };
      this.cart.update(prev => [...prev, newItem]);
      this.showToast('Producto Agregado');
    }
    this.closeSelector();
  }

  removeItem(cartId: number) {
    this.cart.update(items => items.filter(i => i.cartId !== cartId));
  }

  clearCart() {
    if (confirm('¿Vaciar carrito?')) {
      this.cart.set([]);
      this.resetCustomer();
    }
  }

  updateQuantity(cartId: number, delta: number) {
    this.cart.update(items =>
      items.map(item => {
        if (item.cartId === cartId) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return item;
          if (newQty > item.color.stock) {
            this.showToast(`Max: ${item.color.stock}`);
            return item;
          }
          return { ...item, quantity: newQty, total: newQty * item.unitPrice };
        }
        return item;
      }),
    );
  }

  checkout() {
    if (this.cart().length === 0) {
      this.showToast('Carrito Vacío');
      return;
    }
    alert('✅ Venta registrada\nImprimiendo...');
    this.cart.set([]);
    this.resetCustomer();
  }
}
