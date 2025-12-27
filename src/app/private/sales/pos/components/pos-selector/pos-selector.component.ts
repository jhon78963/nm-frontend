import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CartItem, Variant } from '../../models/pos.models';
import { PosService } from '../../services/pos.service';

interface SelectionItem {
  variant: Variant;
  size: string;
  qty: number;
  price: number;
}

@Component({
  selector: 'app-pos-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pos-selector.component.html',
  styleUrl: './pos-selector.component.scss',
})
export class PosSelectorComponent {
  posService = inject(PosService);

  activeSize = signal<string | null>(null);
  selections = signal<Map<string, SelectionItem>>(new Map());

  availableSizes = computed(() => {
    const prod = this.posService.modalState().product;
    return prod ? Object.keys(prod.variants) : [];
  });

  currentSizeVariants = computed(() => {
    const prod = this.posService.modalState().product;
    const size = this.activeSize();
    if (!prod || !size) return [];
    return prod.variants[size] || [];
  });

  totalModalItems = computed(() => {
    let count = 0;
    for (const item of this.selections().values()) {
      count += item.qty;
    }
    return count;
  });

  totalModalPrice = computed(() => {
    let total = 0;
    for (const item of this.selections().values()) {
      total += item.qty * item.price;
    }
    return total;
  });

  constructor() {
    effect(
      () => {
        const state = this.posService.modalState();
        untracked(() => {
          if (state.isOpen && state.product) {
            // 1. INICIO LIMPIO
            const initialMap = new Map<string, SelectionItem>();
            this.activeSize.set(null);

            // 2. SINCRONIZACIÓN INTELIGENTE (CARGAR DESDE CARRITO)
            // Buscamos TODOS los items en el carrito que sean de ESTE producto.
            // Así, si ya tenías un "Negro" y editas el "Verde", el "Negro" también aparecerá cargado.
            const currentCart = this.posService.cart();
            const productItemsInCart = currentCart.filter(
              i => i.productId === state.product!.id,
            );

            productItemsInCart.forEach(cartItem => {
              // Buscamos la variante fresca en el producto para tener datos actualizados (stock)
              const variantsInSize =
                state.product!.variants[cartItem.size] || [];
              const realVariant = variantsInSize.find(
                (v: any) =>
                  String(v.color_id) === String(cartItem.color.color_id),
              );

              if (realVariant) {
                const key = this.getItemKey(
                  cartItem.size,
                  realVariant.color_id,
                );
                initialMap.set(key, {
                  variant: realVariant,
                  size: cartItem.size,
                  qty: cartItem.quantity,
                  price: cartItem.unitPrice,
                });
              }
            });

            // Aplicamos lo cargado al estado
            this.selections.set(initialMap);

            // 3. DETERMINAR TALLA ACTIVA
            if (state.isEditing && state.editingCartItem) {
              // Si venimos de editar uno específico, mostramos esa talla
              this.activeSize.set(state.editingCartItem.size);
            } else {
              // Si es nuevo escaneo, lógica de auto-selección
              const scannedSku = state.product.sku;
              let foundSizeKey: string | null = null;
              let foundVariant: Variant | null = null;

              // Buscar SKU en variantes
              for (const sizeKey in state.product.variants) {
                const variantsList = state.product.variants[sizeKey];
                const match = variantsList.find(
                  (v: any) => v.sku === scannedSku,
                );
                if (match) {
                  foundSizeKey = sizeKey;
                  foundVariant = match;
                  break;
                }
              }

              // Si encontramos SKU específico
              if (foundSizeKey && foundVariant) {
                this.activeSize.set(foundSizeKey);

                // Lógica de "+1":
                // Si ya existía en el carrito (y por tanto ya está en initialMap), le sumamos 1.
                // Si no existía, lo creamos con 1.
                const key = this.getItemKey(
                  foundSizeKey,
                  foundVariant.color_id,
                );
                if (initialMap.has(key)) {
                  const existing = initialMap.get(key)!;
                  // Solo sumamos si hay stock
                  if (existing.qty < foundVariant.stock) {
                    existing.qty++;
                    initialMap.set(key, existing);
                    this.selections.set(new Map(initialMap)); // Refrescar señal
                  }
                } else {
                  // Nuevo
                  this.addSelection(
                    foundSizeKey,
                    foundVariant,
                    1,
                    foundVariant.price,
                  );
                }
              } else {
                // Si es producto genérico, mostramos primera talla disponible
                const sizes = Object.keys(state.product.variants);
                if (sizes.length > 0) this.activeSize.set(sizes[0]);
              }
            }
          }
        });
      },
      { allowSignalWrites: true },
    );
  }

  private getItemKey(size: string, colorId: number | string): string {
    return `${size}_${String(colorId)}`;
  }

  selectTabSize(size: string) {
    this.activeSize.set(size);
  }

  toggleVariant(variant: Variant) {
    const size = this.activeSize();
    if (!size) return;
    if (variant.stock <= 0) return;

    const key = this.getItemKey(size, variant.color_id);
    const currentMap = new Map(this.selections());

    if (currentMap.has(key)) {
      const current = currentMap.get(key)!;
      if (current.qty < variant.stock) {
        current.qty++;
        currentMap.set(key, current);
      }
    } else {
      currentMap.set(key, { variant, size, qty: 1, price: variant.price });
    }

    this.selections.set(currentMap);
  }

  addSelection(size: string, variant: Variant, qty: number, price: number) {
    const key = this.getItemKey(size, variant.color_id);
    const newMap = new Map(this.selections());
    newMap.set(key, { variant, size, qty, price });
    this.selections.set(newMap);
  }

  updateQty(size: string, variant: Variant, delta: number, event?: Event) {
    if (event) event.stopPropagation();

    const key = this.getItemKey(size, variant.color_id);
    const currentMap = new Map(this.selections());

    if (!currentMap.has(key)) {
      if (delta > 0) this.toggleVariant(variant);
      return;
    }

    const item = currentMap.get(key)!;
    const newQty = item.qty + delta;

    if (newQty <= 0) {
      currentMap.delete(key);
    } else if (newQty <= variant.stock) {
      item.qty = newQty;
      currentMap.set(key, item);
    }

    this.selections.set(currentMap);
  }

  updatePrice(variant: Variant, newPrice: number) {
    const size = this.activeSize();
    if (!size) return;
    const key = this.getItemKey(size, variant.color_id);
    const currentMap = new Map(this.selections());

    if (currentMap.has(key)) {
      const item = currentMap.get(key)!;
      item.price = newPrice;
      currentMap.set(key, item);
      this.selections.set(currentMap);
    }
  }

  getSelectionQty(variant: Variant): number {
    const size = this.activeSize();
    if (!size) return 0;
    const key = this.getItemKey(size, variant.color_id);
    return this.selections().get(key)?.qty || 0;
  }

  getSelectionPrice(variant: Variant): number {
    const size = this.activeSize();
    if (!size) return variant.price;
    const key = this.getItemKey(size, variant.color_id);
    return this.selections().get(key)?.price || variant.price;
  }

  // --- LÓGICA DE CONFIRMACIÓN MAESTRA (UPSERT) ---
  confirm() {
    const state = this.posService.modalState();
    if (!state.product) return;

    const selections = this.selections();

    // 1. Obtenemos TODOS los items que YA están en el carrito de este producto
    const currentCart = this.posService.cart();
    const existingItems = currentCart.filter(
      i => i.productId === state.product!.id,
    );

    const processedCartIds = new Set<number>();

    // 2. Procesamos las selecciones del modal (Actualizar o Crear)
    for (const selection of selections.values()) {
      // Buscamos si esta selección YA existe en el carrito
      const existingItem = existingItems.find(
        i =>
          i.size === selection.size &&
          String(i.color.color_id) === String(selection.variant.color_id),
      );

      if (existingItem) {
        // A. EXISTE -> ACTUALIZAR (Update)
        const updatedItem: CartItem = {
          ...existingItem,
          quantity: selection.qty,
          unitPrice: selection.price,
          total: selection.qty * selection.price,
          color: selection.variant,
        };
        this.posService.updateItem(updatedItem);
        processedCartIds.add(existingItem.cartId); // Lo marcamos como "tocado"
      } else {
        // B. NO EXISTE -> CREAR NUEVO (Add)
        const newItem: CartItem = {
          cartId: Date.now() + Math.random(),
          productId: state.product.id,
          sku: state.product.sku,
          name: state.product.name,
          size: selection.size,
          color: selection.variant,
          quantity: selection.qty,
          unitPrice: selection.price,
          total: selection.qty * selection.price,
        };
        this.posService.addItem(newItem);
      }
    }

    // 3. LIMPIEZA: Eliminar los que estaban en el carrito pero ya no están en la selección
    // (Ej: Tenía rojo y verde, en el modal bajé el rojo a 0, debe borrarse)
    for (const item of existingItems) {
      if (!processedCartIds.has(item.cartId)) {
        this.posService.removeItem(item.cartId);
      }
    }

    this.posService.closeModal();
  }
}
