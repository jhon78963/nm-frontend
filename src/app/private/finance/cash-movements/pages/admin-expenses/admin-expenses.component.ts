import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

// PrimeNG
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';

import { DialogModule } from 'primeng/dialog';
import { VoucherDropzoneComponent } from '../../../../shared/components/voucher-dropzone/voucher-dropzone.component';
import { SafeUrlPipe } from '../../pipes/safe-url.pipe';
import { AuthService } from '../../../../../auth/services/auth.service';
import { CashflowService } from '../../services/cash-movements.service';

@Component({
  selector: 'app-admin-expenses',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    CalendarModule,
    DropdownModule,
    TableModule,
    TagModule,
    ToastModule,
    DialogModule,
    TooltipModule,
    SafeUrlPipe,
    VoucherDropzoneComponent,
  ],
  providers: [MessageService, DatePipe],
  templateUrl: './admin-expenses.component.html',
})
export class AdminExpensesComponent implements OnInit {
  private readonly authService = inject(AuthService);

  selectedMonth: Date = new Date();

  private cashService = inject(CashflowService);
  private messageService = inject(MessageService);
  private datePipe = inject(DatePipe);

  // Estado del componente
  loading = signal(false);
  adminExpenses = signal<any[]>([]);
  selectedFiles: File[] = [];

  // Variables para el Preview
  displayPreview = signal(false);
  previewUrl = signal('');
  isPdf = signal(false);
  previewLoading = signal(false);
  previewItems: string[] = [];
  previewIndex = 0;
  private previewObjectUrl: string | null = null;

  isEditing = signal(false);
  editingId: number | null = null;

  // Formulario
  expenseForm = {
    description: '',
    amount: null,
    date: new Date(),
    payment_method: 'CASH',
    category: 'ADMINISTRATIVE',
    type: 'EXPENSE',
  };

  paymentMethods = [
    { label: 'Efectivo', value: 'CASH' },
    { label: 'Yape/Plin', value: 'YAPE' },
    { label: 'Tarjeta', value: 'CARD' },
    { label: 'Transferencia', value: 'TRANSFER' },
  ];

  expenseCategories = [
    {
      label: 'Gasto Administrativo (Sueldos, Servicios, Hosting)',
      value: 'ADMINISTRATIVE',
    },
    {
      label: 'Gasto de Tienda / Operativo (Varios)',
      value: 'STORE',
    },
  ];

  ngOnInit() {
    this.loadExpenses();
  }

  loadExpenses() {
    this.loading.set(true);
    const monthStr = this.datePipe.transform(this.selectedMonth, 'yyyy-MM')!;

    // El service se encarga de actualizar el BehaviorSubject
    this.cashService.loadMonthlyAdminExpenses(monthStr).subscribe({
      next: expenses => this.adminExpenses.set(expenses),
      error: () => {
        this.adminExpenses.set([]);
        this.loading.set(false);
      },
      complete: () => this.loading.set(false),
    });
  }

  showVoucher(paths: string | string[]) {
    const items = Array.isArray(paths) ? paths : [paths];
    this.previewItems = items.filter(Boolean);
    this.previewIndex = 0;
    if (!this.previewItems.length) return;
    this.loadPreviewAt(0);
  }

  prevPreview(): void {
    if (this.previewIndex > 0) {
      this.loadPreviewAt(this.previewIndex - 1);
    }
  }

  nextPreview(): void {
    if (this.previewIndex < this.previewItems.length - 1) {
      this.loadPreviewAt(this.previewIndex + 1);
    }
  }

  private loadPreviewAt(index: number): void {
    const path = this.previewItems[index];
    this.revokePreviewUrl();
    this.previewIndex = index;
    this.isPdf.set(path.toLowerCase().endsWith('.pdf'));
    this.displayPreview.set(true);
    this.previewLoading.set(true);

    this.cashService.getVoucherPreview(path).subscribe({
      next: blob => {
        this.previewObjectUrl = URL.createObjectURL(blob);
        this.previewUrl.set(this.previewObjectUrl);
        this.previewLoading.set(false);
      },
      error: () => {
        this.previewLoading.set(false);
        this.displayPreview.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar el comprobante.',
        });
      },
    });
  }

  onPreviewVisibleChange(visible: boolean) {
    this.displayPreview.set(visible);

    if (!visible) {
      this.revokePreviewUrl();
    }
  }

  private revokePreviewUrl() {
    if (this.previewObjectUrl) {
      URL.revokeObjectURL(this.previewObjectUrl);
      this.previewObjectUrl = null;
    }

    this.previewUrl.set('');
  }

  onDropzoneFiles(files: File[]): void {
    this.selectedFiles = files;
  }

  editExpense(expense: any) {
    this.isEditing.set(true);
    this.editingId = expense.id;

    this.expenseForm = {
      description: expense.description,
      amount: expense.amount,
      date: new Date(expense.date),
      payment_method: expense.method ?? expense.payment_method ?? 'CASH',
      category: expense.category ?? 'ADMINISTRATIVE',
      type: 'EXPENSE',
    };

    // El scroll hacia arriba para que el usuario vea el formulario
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  saveExpense() {
    if (!this.expenseForm.amount || !this.expenseForm.description) return;

    this.loading.set(true);
    const formattedDate = this.datePipe.transform(
      this.expenseForm.date,
      'yyyy-MM-dd HH:mm:ss',
    )!;
    const currentMonthStr = this.datePipe.transform(
      this.selectedMonth,
      'yyyy-MM',
    )!;

    const request$ = this.isEditing()
      ? this.cashService.updateMovement(
          this.editingId!,
          { ...this.expenseForm, date: formattedDate },
          this.selectedFiles.length ? this.selectedFiles : null,
          currentMonthStr,
        )
      : this.cashService.registerMovement(
          { ...this.expenseForm, date: formattedDate },
          this.selectedFiles.length ? this.selectedFiles : null,
          currentMonthStr,
        );

    request$.subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: this.isEditing() ? 'Gasto actualizado' : 'Gasto registrado',
        });
        this.resetForm();
        this.loadExpenses();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Ocurrió un error',
        });
        this.loading.set(false);
      },
    });
  }

  resetForm() {
    this.expenseForm = {
      description: '',
      amount: null,
      date: new Date(),
      payment_method: 'CASH',
      category: 'ADMINISTRATIVE',
      type: 'EXPENSE',
    };
    this.selectedFiles = [];
    this.isEditing.set(false);
    this.editingId = null;
  }

  canStoreCashflow(): boolean {
    return this.authService.hasPermission('cashflow.store');
  }

  canUpdateCashflow(): boolean {
    return this.authService.hasPermission('cashflow.update');
  }

  canSaveAdminExpense(): boolean {
    return this.isEditing() ? this.canUpdateCashflow() : this.canStoreCashflow();
  }

  getCategoryLabel(category: string | undefined): string {
    return (
      this.expenseCategories.find(option => option.value === category)?.label ??
      category ??
      '—'
    );
  }
}
