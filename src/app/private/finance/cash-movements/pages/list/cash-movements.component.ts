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
import { ConfirmationService, MessageService } from 'primeng/api';
import { AuthService } from '../../../../../auth/services/auth.service';

// PrimeNG imports
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar'; // <-- Importado el Calendario
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
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
    DropdownModule,
    ConfirmDialogModule,
    ToastModule,
  ],
  providers: [DatePipe, ConfirmationService, MessageService],
  templateUrl: './cash-movements.component.html',
  styleUrl: './cash-movements.component.scss',
})
export class CashMovementsListComponent implements OnInit, OnDestroy {
  cashflowService = inject(CashflowService);
  datePipe = inject(DatePipe);
  private readonly authService = inject(AuthService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  readonly isAdmin = computed(() => this.authService.isAdminUser());

  canStoreCashflow(): boolean {
    return this.authService.hasPermission('cashflow.store');
  }

  // Fecha actual seleccionada
  currentDate = new Date();

  // Signals para la vista (reactivos)
  lists = signal<any>({ sales: [], incomes: [], expenses: [] });
  summary = signal<any>({ opening_balance: 100, final_balance: 0 });

  // Filtros visuales
  filters = { cash: true, yape: true, card: true };

  // Control del Modal
  showModal = false;
  isEditing = false;
  editingId: number | null = null;
  modalType: 'INCOME' | 'EXPENSE' = 'INCOME';
  movementForm = {
    payment_method: 'CASH',
    description: '',
    amount: null as number | null,
    date: new Date(),
  };

  paymentMethodsList = ['CASH', 'YAPE', 'CARD'];

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
    // Solo sumamos ingresos y restamos egresos del día. Ignoramos opening_balance.
    return this.filteredTotalIncomesAmount - this.filteredTotalExpensesAmount;
  }

  // get filteredFinalBalance(): number {
  //   const base = Number(this.summary().opening_balance) || 0;
  //   return (
  //     base + this.filteredTotalIncomesAmount - this.filteredTotalExpensesAmount
  //   );
  // }

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

    // Convertimos el objeto filters {cash: true, yape: false...} en un array ['CASH']
    const activeFilters: string[] = [];
    if (this.filters.cash) activeFilters.push('CASH');
    if (this.filters.yape) {
      activeFilters.push('YAPE');
      activeFilters.push('PLIN'); // Incluimos PLIN por si acaso
    }
    if (this.filters.card) activeFilters.push('CARD');

    // Tu servicio debe aceptar estos filtros (puedes mandarlos como query params)
    this.cashflowService.loadDailyReport(dateStr, activeFilters).subscribe();
  }

  toggleFilter(key: 'cash' | 'yape' | 'card') {
    this.filters[key] = !this.filters[key];
    this.refreshData(); // Recargamos del servidor para que el Mixto se recalcule
  }

  changeDate(days: number) {
    this.currentDate.setDate(this.currentDate.getDate() + days);
    this.currentDate = new Date(this.currentDate); // Trigger change detection
    this.refreshData();
  }

  /** Ej.: Miércoles 03 de junio, 2026 */
  get formattedViewDate(): string {
    const d = this.currentDate;
    const weekday = new Intl.DateTimeFormat('es-PE', {
      weekday: 'long',
    }).format(d);
    const month = new Intl.DateTimeFormat('es-PE', { month: 'long' }).format(d);
    const day = String(d.getDate()).padStart(2, '0');
    const cap = (value: string) =>
      value.charAt(0).toLocaleUpperCase('es-PE') + value.slice(1);

    return `${cap(weekday)} ${day} de ${cap(month)}, ${d.getFullYear()}`;
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
    this.isEditing = false;
    this.editingId = null;
    this.modalType = type;

    // LÓGICA DE FECHA: Toma la fecha visualizada + la hora actual
    const defaultDate = new Date(this.currentDate);
    const now = new Date();
    defaultDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());

    this.movementForm = {
      description: '',
      amount: null,
      date: defaultDate,
      payment_method: 'CASH',
    };
    this.showModal = true;
  }

  openModalForEdit(item: { id: number; description: string; amount: number; date?: string; method?: string; payment_method?: string }, type: 'INCOME' | 'EXPENSE') {
    this.isEditing = true;
    this.editingId = item.id;
    this.modalType = type;
    this.movementForm = {
      description: item.description,
      amount: item.amount,
      date: item.date
        ? new Date(item.date.replace(' ', 'T'))
        : new Date(this.currentDate),
      payment_method: item.method ?? item.payment_method ?? 'CASH',
    };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.isEditing = false;
    this.editingId = null;
  }

  get modalHeader(): string {
    if (this.isEditing) {
      return this.modalType === 'INCOME' ? 'Editar Ingreso' : 'Editar Gasto';
    }

    return this.modalType === 'INCOME' ? 'Registrar Ingreso' : 'Registrar Gasto';
  }

  get modalSaveLabel(): string {
    if (this.isEditing) {
      return this.modalType === 'INCOME' ? 'Guardar cambios' : 'Guardar cambios';
    }

    return this.modalType === 'INCOME' ? 'Guardar Ingreso' : 'Confirmar Gasto';
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

    // Creamos el objeto con la categoría por defecto 'STORE'
    const movementData = {
      type: this.modalType,
      category: 'STORE', // <--- Importante: Para que el Service sepa que es de tienda
      amount: this.movementForm.amount,
      description: this.movementForm.description,
      date: formattedDate,
      payment_method: this.movementForm.payment_method,
    };

    const request$ =
      this.isEditing && this.editingId
        ? this.cashflowService.updateMovement(
            this.editingId,
            movementData,
            null,
            dateStr,
            'STORE',
          )
        : this.cashflowService.registerMovement(movementData, null, dateStr);

    request$.subscribe({
      next: () => {
        this.closeModal();
      },
      error: err => console.error('Error guardando movimiento', err),
    });
  }

  confirmDeleteMovement(
    item: { id: number; description: string; amount: number },
    type: 'INCOME' | 'EXPENSE',
  ): void {
    const label = type === 'INCOME' ? 'ingreso' : 'gasto';

    this.confirmationService.confirm({
      header: 'Eliminar movimiento',
      message: `¿Eliminar este ${label} (S/ ${item.amount})? Esta acción no se puede deshacer.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.deleteMovement(item.id),
    });
  }

  deleteMovement(id: number): void {
    const dateStr = this.datePipe.transform(this.currentDate, 'yyyy-MM-dd')!;

    this.cashflowService.deleteMovement(id, dateStr, 'STORE').subscribe({
      next: () => {
        if (this.editingId === id) {
          this.closeModal();
        }
        this.messageService.add({
          severity: 'success',
          summary: 'Eliminado',
          detail: 'Movimiento eliminado correctamente.',
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo eliminar el movimiento.',
        });
      },
    });
  }
}
