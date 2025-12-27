import { CommonModule } from '@angular/common';
import { Component, computed, inject, effect, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PosService } from '../../services/pos.service';

interface PaymentMethodState {
  id: string; // 'CASH' | 'YAPE' | 'CARD'
  label: string;
  icon: string;
  active: boolean;
  amount: number | null; // null = automático/vacío
}

@Component({
  selector: 'app-pos-footer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pos-footer.component.html',
  styleUrl: './pos-footer.component.scss',
})
export class PosFooterComponent {
  posService = inject(PosService);

  // Estado local de los métodos de pago
  methods = signal<PaymentMethodState[]>([
    {
      id: 'CASH',
      label: 'Efectivo',
      icon: 'pi pi-money-bill',
      active: true,
      amount: null,
    },
    {
      id: 'YAPE',
      label: 'Yape/Plin',
      icon: 'pi pi-qrcode',
      active: false,
      amount: null,
    },
    {
      id: 'CARD',
      label: 'Tarjeta',
      icon: 'pi pi-credit-card',
      active: false,
      amount: null,
    },
  ]);

  // Total a pagar (desde el servicio)
  totalToPay = computed(() => this.posService.grandTotal());

  // Métodos activos
  activeMethods = computed(() => this.methods().filter(m => m.active));

  // Suma de los montos ingresados MANUALMENTE
  currentSum = computed(() => {
    return this.activeMethods().reduce((acc, m) => acc + (m.amount || 0), 0);
  });

  // Falta por cubrir (solo relevante si hay múltiples métodos)
  remaining = computed(() => {
    if (this.activeMethods().length <= 1) return 0; // Si es uno solo, cubre todo
    return Math.max(0, this.totalToPay() - this.currentSum());
  });

  constructor() {
    // Si el carrito se vacía, reseteamos a solo Efectivo
    effect(
      () => {
        if (this.posService.cart().length === 0) {
          this.resetMethods();
        }
      },
      { allowSignalWrites: true },
    );
  }

  resetMethods() {
    this.methods.update(list =>
      list.map(m => ({
        ...m,
        active: m.id === 'CASH',
        amount: null,
      })),
    );
  }

  toggleMethod(id: string) {
    this.methods.update(list =>
      list.map(m => {
        if (m.id === id) {
          // Si intentan desactivar el último que queda activo, no dejamos (siempre debe haber uno)
          const activeCount = list.filter(x => x.active).length;
          if (m.active && activeCount === 1) return m;

          return { ...m, active: !m.active, amount: null }; // Al togglear reseteamos su monto
        }
        return m;
      }),
    );
  }

  updateAmount(id: string, value: number) {
    this.methods.update(list =>
      list.map(m => (m.id === id ? { ...m, amount: value } : m)),
    );
  }

  handleCheckout() {
    const active = this.activeMethods();
    const total = this.totalToPay();

    // 1. Validación de Carrito
    if (total <= 0) {
      // Dejar que el servicio maneje el error de carrito vacío
      this.posService.processCheckoutWithPayments([]);
      return;
    }

    // 2. Preparar pagos
    let finalPayments = [];

    if (active.length === 1) {
      // CASO A: Un solo método -> Asume el 100%
      finalPayments = [
        {
          method: active[0].id,
          amount: total,
        },
      ];
    } else {
      // CASO B: Híbrido -> Validar que sume el total
      // Pequeño margen de error (0.1) por decimales
      if (Math.abs(this.currentSum() - total) > 0.1) {
        alert(
          `Los montos no cuadran. Faltan S/ ${this.remaining().toFixed(2)}`,
        );
        return;
      }

      finalPayments = active.map(m => ({
        method: m.id,
        amount: m.amount || 0,
      }));
    }

    // 3. Enviar al servicio
    this.posService.processCheckoutWithPayments(finalPayments);
  }
}
