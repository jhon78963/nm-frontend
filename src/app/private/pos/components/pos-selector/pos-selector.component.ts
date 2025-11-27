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

  // Variables locales del formulario
  tempSize = signal<string | null>(null);
  tempColor = signal<Variant | null>(null);
  tempQty = 1;
  tempPrice = 0;

  // Reactividad para cargar datos cuando se abre el modal
  constructor() {
    effect(
      () => {
        const state = this.posService.modalState();
        if (state.isOpen) {
          if (state.isEditing && state.editingCartItem) {
            // Modo Edición: Cargar datos del item
            const item = state.editingCartItem;
            this.tempSize.set(item.size);
            this.tempQty = item.quantity;
            this.tempPrice = item.unitPrice;
            // Buscar color exacto para setear referencia
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
          } else if (state.product) {
            // Modo Agregar: Reset
            this.tempSize.set(null);
            this.tempColor.set(null);
            this.tempQty = 1;
            this.tempPrice = state.product.basePrice;
          }
        }
      },
      { allowSignalWrites: true },
    );
  }

  // Computeds para Opciones
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

  // Acciones
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
      // Actualizar
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
      // Agregar Nuevo
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
