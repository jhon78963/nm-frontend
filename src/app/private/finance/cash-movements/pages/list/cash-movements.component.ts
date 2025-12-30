import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  signal,
  computed,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

// PrimeNG imports
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { CashflowService } from '../../services/cash-movements.service';

@Component({
  selector: 'app-cashflow',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
  ],
  providers: [DatePipe],
  templateUrl: './cash-movements.component.html',
  styleUrl: './cash-movements.component.scss',
})
export class CashMovementsListComponent implements OnInit, OnDestroy {
  cashflowService = inject(CashflowService);
  datePipe = inject(DatePipe);

  // Fecha actual seleccionada
  currentDate = new Date();

  // Signals para la vista (reactivos)
  lists = signal<any>({ sales: [], incomes: [], expenses: [] });
  summary = signal<any>({ opening_balance: 100, final_balance: 0 });

  // Filtros visuales
  filters = { cash: true, yape: true, card: true };

  // Control del Modal
  showModal = false;
  modalType: 'INCOME' | 'EXPENSE' = 'INCOME';
  movementForm = { description: '', amount: null as number | null };

  private reportSubscription?: Subscription;

  // Computado: Operaciones Netas
  netOperations = computed(() => {
    const s = this.summary();
    return (
      (s.total_sales || 0) + (s.total_incomes || 0) - (s.total_expenses || 0)
    );
  });

  ngOnInit() {
    // 1. SUSCRIPCIÓN AL ESTADO DEL SERVICIO
    // Cada vez que el servicio actualice los datos (por carga inicial o por un registro nuevo),
    // nuestros signals se actualizarán automáticamente.
    this.reportSubscription = this.cashflowService
      .getReport()
      .subscribe(data => {
        if (data && data.lists) {
          this.lists.set(data.lists);
          this.summary.set(data.summary);
        }
      });

    // 2. CARGA INICIAL
    this.refreshData();
  }

  ngOnDestroy() {
    if (this.reportSubscription) {
      this.reportSubscription.unsubscribe();
    }
  }

  // Helper para formatear fecha y llamar al servicio
  refreshData() {
    const dateStr = this.datePipe.transform(this.currentDate, 'yyyy-MM-dd')!;
    // Solo llamamos a cargar, la suscripción en ngOnInit se encarga de actualizar la vista
    this.cashflowService.loadDailyReport(dateStr).subscribe();
  }

  changeDate(days: number) {
    this.currentDate.setDate(this.currentDate.getDate() + days);
    this.currentDate = new Date(this.currentDate); // Trigger change detection
    this.refreshData();
  }

  // Filtrado visual local (sin cambios)
  filteredList(type: 'sales' | 'incomes' | 'expenses') {
    const list = this.lists()[type] || [];
    return list.filter((item: any) => {
      const method = (item.method || 'CASH').toUpperCase();
      if (method.includes('CASH') && !this.filters.cash) return false;
      if (
        (method.includes('YAPE') || method.includes('PLIN')) &&
        !this.filters.yape
      )
        return false;
      if (
        (method.includes('CARD') || method.includes('TARJETA')) &&
        !this.filters.card
      )
        return false;
      return true;
    });
  }

  // Modal Actions
  openModal(type: 'INCOME' | 'EXPENSE') {
    this.modalType = type;
    this.movementForm = { description: '', amount: null };
    this.showModal = true;
  }

  setQuickExpense(desc: string, amount: number) {
    this.movementForm.description = desc;
    this.movementForm.amount = amount;
  }

  saveMovement() {
    if (!this.movementForm.amount) return;

    const dateStr = this.datePipe.transform(this.currentDate, 'yyyy-MM-dd')!;

    // Usamos el servicio reactivo: Crea y recarga automáticamente
    this.cashflowService
      .registerMovement(
        {
          type: this.modalType,
          amount: this.movementForm.amount,
          description: this.movementForm.description,
        },
        dateStr,
      )
      .subscribe({
        next: () => {
          this.showModal = false;
          // No necesitamos llamar a loadData() aquí, el servicio ya hizo el switchMap
        },
        error: err => console.error('Error guardando movimiento', err),
      });
  }
}
