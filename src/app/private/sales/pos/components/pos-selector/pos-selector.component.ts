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

@Component({
  selector: 'app-pos-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pos-selector.component.html',
  styleUrl: './pos-selector.component.scss',
})
export class PosSelectorComponent {
  posService = inject(PosService);
  tempSize = signal<string | null>(null);
  tempColor = signal<Variant | null>(null);
  tempQty = 1;
  tempPrice = 0;
  displaySku = computed(() => {
    const state = this.posService.modalState();
    const currentVariant = this.tempColor();
    if (!state.product) return '';

    if (currentVariant && currentVariant.sku) {
      return currentVariant.sku;
    }

    return state.product.sku;
  });

  constructor() {
    effect(
      () => {
        const state = this.posService.modalState();
        untracked(() => {
          if (state.isOpen) {
            // 1. LIMPIEZA INICIAL
            this.tempSize.set(null);
            this.tempColor.set(null);
            this.tempQty = 1;
            this.tempPrice = 0;

            // ---------------------------------------------------------
            // CASO A: EDICIÓN (Aquí estaba tu problema, estaba vacío)
            // ---------------------------------------------------------
            if (state.isEditing && state.editingCartItem) {
              const item = state.editingCartItem;

              // A.1 Restaurar Talla
              this.tempSize.set(item.size);

              // A.2 Restaurar Cantidad y Precio guardado
              this.tempQty = item.quantity;
              this.tempPrice = item.unitPrice;

              // A.3 Restaurar Color (TRUCO: Buscar la referencia exacta)
              // Necesitamos encontrar el objeto "color" dentro de las variantes del producto actual
              // para que la comparación (===) del HTML funcione y se pinte seleccionado.
              if (state.product && state.product.variants[item.size]) {
                const variantesDeTalla = state.product.variants[item.size];

                // Buscamos por ID o por Nombre para encontrar el objeto "fresco"
                const matchColor = variantesDeTalla.find(
                  (v: any) =>
                    v.color_id === item.color.color_id &&
                    v.colorName === item.color.colorName,
                );

                if (matchColor) {
                  this.tempColor.set(matchColor);
                }
              }
            }

            // ---------------------------------------------------------
            // CASO B: NUEVO PRODUCTO
            // ---------------------------------------------------------
            else if (state.product) {
              const scannedSku = state.product.sku;
              let foundSizeKey: string | null = null;
              let foundVariant: any = null;

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

              if (foundSizeKey) {
                this.selectSize(foundSizeKey);

                if (foundVariant) {
                  this.tempPrice = foundVariant.price;
                  if (foundVariant.color_id > 0) {
                    this.selectColor(foundVariant);
                  } else {
                    const unique = state.product.variants[foundSizeKey].find(
                      (v: any) => v.color_id === 0,
                    );
                    if (unique) this.selectColor(unique);
                  }
                }
              } else {
                this.tempPrice = state.product.basePrice;
              }
            }
          }
        });
      },
      { allowSignalWrites: true },
    );
  }

  availableSizes = computed(() => {
    const prod = this.posService.modalState().product;
    return prod ? Object.keys(prod.variants) : [];
  });
  availableColors = computed(() => {
    const prod = this.posService.modalState().product;
    const size = this.tempSize();
    if (!prod || !size) return [];
    return prod.variants[size] || [];
  });

  selectSize(size: string) {
    // 1. Establecemos la talla
    this.tempSize.set(size);

    // 2. Buscamos las variantes que pertenecen a esta talla
    // Accedemos directo al estado para no depender de computeds asíncronos
    const product = this.posService.modalState().product;
    const variants =
      product && product.variants[size] ? product.variants[size] : [];

    // 3. Lógica de Auto-selección
    if (variants.length > 0) {
      // ¡AQUÍ ESTÁ EL TRUCO!
      // En lugar de limpiar el color, seleccionamos el primero de la lista.
      // Esto actualiza tempColor inmediatamente y displaySku mostrará el SKU del hijo.
      this.selectColor(variants[0]);
    } else {
      // Solo si la talla no tiene variantes (caso raro), limpiamos
      this.tempColor.set(null);
    }

    // Nota: Ya no necesitas setear tempPrice aquí manualmente,
    // porque selectColor(variants[0]) ya se encarga de actualizar el precio.
  }

  selectColor(variant: Variant) {
    this.tempColor.set(variant);
    this.tempPrice = variant.price; // Actualizar precio al del color específico
  }

  adjustTempQty(delta: number) {
    const newVal = this.tempQty + delta;
    if (newVal < 1) return;
    const current = this.tempColor();
    if (current && newVal > current.stock) return;
    this.tempQty = newVal;
  }

  confirm() {
    const state = this.posService.modalState();
    const size = this.tempSize();
    const color = this.tempColor();
    if (!state.product || !size || !color) return;
    const total = this.tempPrice * this.tempQty;

    if (state.isEditing && state.editingCartItem) {
      const updatedItem: CartItem = {
        ...state.editingCartItem,
        size,
        color,
        quantity: this.tempQty,
        unitPrice: this.tempPrice,
        total,
      };
      this.posService.updateItem(updatedItem);
    } else {
      const newItem: CartItem = {
        cartId: Date.now(),
        productId: state.product.id,
        sku: state.product.sku,
        name: state.product.name,
        size,
        color,
        quantity: this.tempQty,
        unitPrice: this.tempPrice,
        total,
      };
      this.posService.addItem(newItem);
    }
    this.posService.closeModal();
  }
}
