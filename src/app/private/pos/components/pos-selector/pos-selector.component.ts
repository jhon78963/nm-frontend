import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
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

  constructor() {
    effect(
      () => {
        const state = this.posService.modalState();
        if (state.isOpen) {
          // REINICIAR ESTADO
          this.tempSize.set(null);
          this.tempColor.set(null);
          this.tempQty = 1;

          // CASO 1: EDICIÓN (Ya existe en carrito)
          if (state.isEditing && state.editingCartItem) {
            const item = state.editingCartItem;
            this.tempSize.set(item.size);
            this.tempQty = item.quantity;
            this.tempPrice = item.unitPrice;
            setTimeout(() => {
              const colors = this.availableColors();
              const match =
                colors.find(
                  c =>
                    c.hex === item.color.hex &&
                    c.colorName === item.color.colorName,
                ) || null;
              this.tempColor.set(match);
            }, 0);

            // CASO 2: NUEVO PRODUCTO
          } else if (state.product) {
            // LÓGICA DE AUTO-SELECCIÓN POR SKU 🚀
            const scannedSku = state.product.sku;
            let foundSize = null;
            let foundVariant = null;

            // Buscamos si alguna variante coincide con el SKU escaneado
            // IMPORTANTE: Tu backend debe enviar 'sku' dentro del objeto variante para que esto funcione 100%
            for (const sizeKey in state.product.variants) {
              const variantsList = state.product.variants[sizeKey];
              const match = variantsList.find(v => v.sku === scannedSku);
              if (match) {
                foundSize = sizeKey;
                foundVariant = match;
                break;
              }
            }

            // Si encontramos el match, seleccionamos automáticamente
            if (foundSize) {
              this.selectSize(foundSize);
              if (foundVariant) {
                this.tempPrice = foundVariant.price;
                // Si tiene color específico, lo seleccionamos también
                if (foundVariant.color_id > 0) {
                  this.selectColor(foundVariant);
                } else {
                  // Si es color "Único", lo seleccionamos por defecto
                  const unique = state.product.variants[foundSize].find(
                    v => v.color_id === 0,
                  );
                  if (unique) this.selectColor(unique);
                }
              }
            } else {
              // Si no hubo match exacto (se escaneó el producto general), usamos el precio base
              this.tempPrice = state.product.basePrice;
            }
          }
        }
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
    console.log('gola');
    this.tempSize.set(size);
    this.tempColor.set(null);
    // Al cambiar talla, actualizamos precio al de la primera variante de esa talla
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
