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
    if (!state.product) return '';
    // Si hay variante completa seleccionada, muestra su SKU, si no el del padre
    return this.tempColor() && this.tempColor()?.sku
      ? this.tempColor()?.sku
      : state.product.sku;
  });

  constructor() {
    effect(
      () => {
        // 1. Leemos la señal (esto dispara el efecto)
        const state = this.posService.modalState();

        // 2. Usamos untracked para que la lógica interna NO dispare el efecto en bucle
        untracked(() => {
          if (state.isOpen) {
            // --- LIMPIEZA TOTAL AL ABRIR ---
            this.tempSize.set(null);
            this.tempColor.set(null);
            this.tempQty = 1;
            this.tempPrice = 0;
            // Si tienes variables de arrays visibles, límpialas aquí también si es necesario,
            // aunque selectSize debería encargarse.

            // CASO A: EDICIÓN
            if (state.isEditing && state.editingCartItem) {
              // ... (tu código de edición, está ok) ...
            }
            // CASO B: NUEVO PRODUCTO (Tu problema actual)
            else if (state.product) {
              const scannedSku = state.product.sku; // Ojo: asegúrate que este sea el SKU que quieres buscar
              let foundSizeKey: string | null = null;
              let foundVariant: any = null;

              // Búsqueda del SKU dentro de las variantes
              // Iteramos las llaves del mapa (ej: "S", "M", "L" o "28", "30", etc.)
              for (const sizeKey in state.product.variants) {
                const variantsList = state.product.variants[sizeKey];

                // Buscamos si alguna variante en esta talla tiene el SKU escaneado
                const match = variantsList.find(
                  (v: any) => v.sku === scannedSku,
                );

                if (match) {
                  foundSizeKey = sizeKey;
                  foundVariant = match;
                  break; // ¡Encontrado! Salimos del loop
                }
              }

              console.log('SKU Encontrado en talla:', foundSizeKey); // Debería salir solo una vez

              if (foundSizeKey) {
                // 1. Seleccionamos la talla (ESTO DEBE LIMPIAR EL ARRAY INTERNAMENTE)
                this.selectSize(foundSizeKey);

                // 2. Seleccionamos el color/variante específica
                if (foundVariant) {
                  this.tempPrice = foundVariant.price;

                  if (foundVariant.color_id > 0) {
                    this.selectColor(foundVariant);
                  } else {
                    // Caso color único
                    const unique = state.product.variants[foundSizeKey].find(
                      (v: any) => v.color_id === 0,
                    );
                    if (unique) this.selectColor(unique);
                  }
                }
              } else {
                // Fallback: Si no se encuentra variante específica, precio base
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
    this.tempSize.set(size);
    this.tempColor.set(null);
    const variants = this.availableColors();
    if (variants.length > 0) {
      this.tempPrice = variants[0].price;
    }
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
