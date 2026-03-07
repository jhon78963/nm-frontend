import { CommonModule, DatePipe } from '@angular/common';
import {
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

// PrimeNG imports
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar'; // <-- Importado el Calendario
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
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
    CalendarModule,
    AutoCompleteModule,
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
  movementForm = {
    description: '',
    amount: null as number | null,
    date: new Date(),
  };

  get isAdmin() {
    const jsonData = localStorage.getItem('user');
    const userData = jsonData ? JSON.parse(jsonData) : undefined;
    return userData.role === 'Admin';
  }

  private reportSubscription?: Subscription;

  // Computado: Operaciones Netas
  netOperations = computed(() => {
    const s = this.summary();
    return (
      (s.total_sales || 0) + (s.total_incomes || 0) - (s.total_expenses || 0)
    );
  });

  get filteredTotalIncomesAmount(): number {
    const sales = this.filteredList('sales').reduce(
      (sum: number, item: any) => sum + (Number(item.amount) || 0),
      0,
    );
    const incomes = this.filteredList('incomes').reduce(
      (sum: number, item: any) => sum + (Number(item.amount) || 0),
      0,
    );
    return sales + incomes;
  }

  get filteredTotalExpensesAmount(): number {
    return this.filteredList('expenses').reduce(
      (sum: number, item: any) => sum + (Number(item.amount) || 0),
      0,
    );
  }

  get filteredFinalBalance(): number {
    const base = Number(this.summary().opening_balance) || 0;
    return (
      base + this.filteredTotalIncomesAmount - this.filteredTotalExpensesAmount
    );
  }

  ngOnInit() {
    // 1. SUSCRIPCIÓN AL ESTADO DEL SERVICIO
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
    this.cashflowService.loadDailyReport(dateStr).subscribe();
  }

  changeDate(days: number) {
    this.currentDate.setDate(this.currentDate.getDate() + days);
    this.currentDate = new Date(this.currentDate); // Trigger change detection
    this.refreshData();
  }

  // Filtrado visual local
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

    // LÓGICA DE FECHA: Toma la fecha visualizada + la hora actual
    const defaultDate = new Date(this.currentDate);
    const now = new Date();
    defaultDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());

    this.movementForm = { description: '', amount: null, date: defaultDate };
    this.showModal = true;
  }

  setQuickExpense(desc: string, amount: number) {
    this.movementForm.description = desc;
    this.movementForm.amount = amount;
  }

  saveMovement() {
    if (!this.movementForm.amount || !this.movementForm.date) return;

    const dateStr = this.datePipe.transform(this.currentDate, 'yyyy-MM-dd')!;

    // Formatear la fecha y hora seleccionadas para mandarlas a la BD
    const formattedDate = this.datePipe.transform(
      this.movementForm.date,
      'yyyy-MM-dd HH:mm:ss',
    );

    // Usamos el servicio reactivo: Crea y recarga automáticamente
    this.cashflowService
      .registerMovement(
        {
          type: this.modalType,
          amount: this.movementForm.amount,
          description: this.movementForm.description,
          date: formattedDate, // <-- Enviamos la fecha y hora
        } as any,
        dateStr,
      )
      .subscribe({
        next: () => {
          this.showModal = false;
        },
        error: err => console.error('Error guardando movimiento', err),
      });
  }
}
