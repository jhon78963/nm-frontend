import { CommonModule, DatePipe } from '@angular/common';
import {
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';

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
import { DividerModule } from 'primeng/divider';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { InputTextareaModule } from 'primeng/inputtextarea';

import { VoucherDropzoneComponent } from '../../../../shared/components/voucher-dropzone/voucher-dropzone.component';
import { SafeUrlPipe } from '../../pipes/safe-url.pipe';
import { AuthService } from '../../../../../auth/services/auth.service';
import { CashflowService } from '../../services/cash-movements.service';
import type {
  MonthEndTransferPreview,
  MonthEndTransferRecord,
} from '../../models/month-end-transfer.model';

@Component({
  selector: 'app-accumulated-expenses',
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
    DividerModule,
    TooltipModule,
    MessageModule,
    SkeletonModule,
    InputTextareaModule,
    SafeUrlPipe,
    VoucherDropzoneComponent,
  ],
  providers: [MessageService, DatePipe],
  templateUrl: './accumulated-expenses.component.html',
  styleUrl: './accumulated-expenses.component.scss',
})
export class AccumulatedExpensesComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  selectedMonth = signal(new Date());

  private cashService = inject(CashflowService);
  private messageService = inject(MessageService);
  private datePipe = inject(DatePipe);

  loading = signal(false);
  balanceLoading = signal(false);

  readonly selectedMonthKey = computed(() => this.toMonthKey(this.selectedMonth()));

  private readonly loadedMonthKey = signal<string | null>(null);
  private readonly loadedExpenses = signal<any[]>([]);
  private readonly loadedTotal = signal(0);

  /** Egresos del mes seleccionado (estado local; evita mezclar meses en caché compartido). */
  readonly displayedExpenses = computed(() =>
    this.loadedMonthKey() === this.selectedMonthKey()
      ? this.loadedExpenses()
      : [],
  );

  readonly displayedTotal = computed(() =>
    this.loadedMonthKey() === this.selectedMonthKey()
      ? this.loadedTotal()
      : 0,
  );

  selectedFiles: File[] = [];

  balanceForm = {
    cash_balance: 0,
    digital_balance: 0,
    tracking_start_month: new Date(),
  };

  initForm = {
    initial_cash: 0,
    initial_digital: 0,
    tracking_start_month: new Date(new Date().getFullYear(), 0, 1),
  };

  isInitialized = signal(false);

  currentBalance = signal({
    cash: 0,
    digital: 0,
    total: 0,
  });

  displayPreview = signal(false);
  previewUrl = signal('');
  isPdf = signal(false);
  previewLoading = signal(false);
  previewItems: string[] = [];
  previewIndex = 0;
  private previewObjectUrl: string | null = null;

  isEditing = signal(false);
  editingId: number | null = null;

  expenseForm = {
    description: '',
    amount: null as number | null,
    date: new Date(),
    payment_method: 'CASH',
    category: 'ACCUMULATED',
    type: 'EXPENSE',
  };

  paymentMethods = [
    { label: 'Efectivo', value: 'CASH' },
    { label: 'Yape/Plin', value: 'YAPE' },
    { label: 'Tarjeta', value: 'CARD' },
    { label: 'Transferencia', value: 'TRANSFER' },
  ];

  transferPreview = signal<MonthEndTransferPreview | null>(null);
  transferHistory = signal<MonthEndTransferRecord[]>([]);
  transferLoading = signal(false);
  transferSubmitting = signal(false);
  transferConfirmVisible = signal(false);

  transferForm = {
    cashAmount: 0,
    digitalAmount: 0,
    note: '',
  };

  readonly transferTotal = computed(
    () =>
      Math.round((this.transferForm.cashAmount + this.transferForm.digitalAmount) * 100) /
      100,
  );

  readonly transferBalanceAfter = computed(() => {
    const current = this.currentBalance();
    return {
      cash: Math.round((current.cash + this.transferForm.cashAmount) * 100) / 100,
      digital:
        Math.round((current.digital + this.transferForm.digitalAmount) * 100) / 100,
      total: Math.round((current.total + this.transferTotal()) * 100) / 100,
    };
  });

  ngOnInit() {
    this.loadBalanceSettings();
    this.loadExpenses();
    this.loadTransferPreview();
    this.loadTransferHistory();
  }

  loadBalanceSettings() {
    this.balanceLoading.set(true);
    this.cashService.loadAccumulatedAccountSettings().subscribe({
      next: settings => {
        this.isInitialized.set(settings.is_initialized);
        this.balanceForm = {
          cash_balance: settings.cash_balance,
          digital_balance: settings.digital_balance,
          tracking_start_month: settings.tracking_start_month
            ? this.parseTrackingMonth(settings.tracking_start_month)
            : new Date(new Date().getFullYear(), 0, 1),
        };
        this.initForm = {
          initial_cash: settings.initial_cash || 0,
          initial_digital: settings.initial_digital || 0,
          tracking_start_month: settings.tracking_start_month
            ? this.parseTrackingMonth(settings.tracking_start_month)
            : new Date(new Date().getFullYear(), 0, 1),
        };
        this.currentBalance.set({
          cash: settings.current_cash,
          digital: settings.current_digital,
          total: settings.current_total,
        });
        this.balanceLoading.set(false);
        if (settings.is_initialized) {
          this.loadTransferPreview();
        }
      },
      error: () => this.balanceLoading.set(false),
    });
  }

  initializeBalances() {
    this.balanceLoading.set(true);
    const trackingMonth = this.datePipe.transform(
      this.initForm.tracking_start_month,
      'yyyy-MM',
    )!;

    this.cashService
      .initializeAccumulatedAccountSettings({
        initial_cash: this.initForm.initial_cash,
        initial_digital: this.initForm.initial_digital,
        tracking_start_month: trackingMonth,
      })
      .subscribe({
        next: res => {
          this.messageService.add({
            severity: 'success',
            summary: 'Cuenta inicializada',
            detail: 'El saldo inicial de la Cuenta Acumulada quedó registrado.',
          });
          const data = res?.data;
          if (data) {
            this.isInitialized.set(true);
            this.currentBalance.set({
              cash: data.current_cash ?? 0,
              digital: data.current_digital ?? 0,
              total: data.current_total ?? 0,
            });
            this.balanceForm = {
              cash_balance: data.cash_balance ?? 0,
              digital_balance: data.digital_balance ?? 0,
              tracking_start_month: data.tracking_start_month
                ? this.parseTrackingMonth(data.tracking_start_month)
                : this.initForm.tracking_start_month,
            };
            this.loadTransferPreview();
            this.loadTransferHistory();
          }
          this.balanceLoading.set(false);
        },
        error: err => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail:
              err?.error?.errors?.initial_cash?.[0] ??
              'No se pudo inicializar la cuenta.',
          });
          this.balanceLoading.set(false);
        },
      });
  }

  saveBalanceSettings() {
    this.balanceLoading.set(true);
    const trackingMonth = this.datePipe.transform(
      this.balanceForm.tracking_start_month,
      'yyyy-MM',
    )!;

    this.cashService
      .updateAccumulatedAccountSettings({
        cash_balance: this.balanceForm.cash_balance,
        digital_balance: this.balanceForm.digital_balance,
        tracking_start_month: trackingMonth,
      })
      .subscribe({
        next: res => {
          this.messageService.add({
            severity: 'success',
            summary: 'Saldos actualizados',
            detail:
              'Los saldos manuales de la Cuenta Acumulada fueron guardados.',
          });
          const data = res?.data;
          if (data) {
            this.currentBalance.set({
              cash: data.current_cash ?? 0,
              digital: data.current_digital ?? 0,
              total: data.current_total ?? 0,
            });
            this.balanceForm.cash_balance = data.cash_balance ?? 0;
            this.balanceForm.digital_balance = data.digital_balance ?? 0;
          }
          this.balanceLoading.set(false);
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudieron guardar los saldos.',
          });
          this.balanceLoading.set(false);
        },
      });
  }

  parseTrackingMonth(value: string): Date {
    const [y, m] = value.split('-').map(Number);
    return new Date(y, m - 1, 1);
  }

  onSelectedMonthChange(date: Date): void {
    this.selectedMonth.set(date);
    this.loadExpenses(true);
    this.loadTransferPreview();
  }

  loadTransferPreview(): void {
    if (!this.isInitialized()) {
      return;
    }

    const monthStr = this.selectedMonthKey();
    this.transferLoading.set(true);

    this.cashService
      .loadMonthEndTransferPreview(monthStr)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: preview => {
          this.transferPreview.set(preview);
          if (!preview.alreadyTransferred) {
            this.transferForm.cashAmount = preview.suggested.cash;
            this.transferForm.digitalAmount = preview.suggested.digital;
          }
          this.transferLoading.set(false);
        },
        error: () => {
          this.transferPreview.set(null);
          this.transferLoading.set(false);
        },
      });
  }

  loadTransferHistory(): void {
    this.cashService
      .listMonthEndTransfers(undefined, 6)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: rows => this.transferHistory.set(rows),
        error: () => this.transferHistory.set([]),
      });
  }

  applySuggestedTransfer(): void {
    const preview = this.transferPreview();
    if (!preview) {
      return;
    }
    this.transferForm.cashAmount = preview.suggested.cash;
    this.transferForm.digitalAmount = preview.suggested.digital;
  }

  openTransferConfirm(): void {
    if (this.transferTotal() <= 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Monto requerido',
        detail: 'Indica cuánto deseas traspasar en efectivo o digital.',
      });
      return;
    }
    this.transferConfirmVisible.set(true);
  }

  submitMonthEndTransfer(): void {
    const monthStr = this.selectedMonthKey();
    this.transferSubmitting.set(true);

    this.cashService
      .recordMonthEndTransfer({
        transfer_month: monthStr,
        cash_amount: this.transferForm.cashAmount,
        digital_amount: this.transferForm.digitalAmount,
        note: this.transferForm.note.trim() || null,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: result => {
          this.transferConfirmVisible.set(false);
          this.transferPreview.set(result.preview);
          this.currentBalance.set({
            cash: result.settings.current_cash ?? 0,
            digital: result.settings.current_digital ?? 0,
            total: result.settings.current_total ?? 0,
          });
          this.balanceForm.cash_balance = result.settings.cash_balance ?? 0;
          this.balanceForm.digital_balance = result.settings.digital_balance ?? 0;
          this.transferForm.note = '';
          this.loadTransferHistory();
          this.messageService.add({
            severity: 'success',
            summary: 'Traspaso registrado',
            detail: `S/ ${this.transferTotal().toFixed(2)} pasaron de la caja operativa al fondo acumulado.`,
            life: 5000,
          });
          this.transferSubmitting.set(false);
        },
        error: err => {
          this.transferSubmitting.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'No se pudo traspasar',
            detail:
              err?.error?.errors?.transfer_month?.[0] ??
              err?.error?.errors?.cash_amount?.[0] ??
              err?.error?.message ??
              'Revisa los montos e intenta de nuevo.',
          });
        },
      });
  }

  private toMonthKey(date: Date): string {
    return this.datePipe.transform(date, 'yyyy-MM') ?? '';
  }

  loadExpenses(forceReload = false): void {
    const monthStr = this.selectedMonthKey();

    if (!forceReload && this.loadedMonthKey() === monthStr) {
      return;
    }

    this.loading.set(true);

    this.cashService
      .loadMonthlyAccumulatedExpenses(monthStr)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: result => {
          this.loadedMonthKey.set(monthStr);
          this.loadedExpenses.set(result.expenses);
          this.loadedTotal.set(result.total);
          this.loadBalanceSettings();
        },
        error: () => {
          this.loadedMonthKey.set(monthStr);
          this.loadedExpenses.set([]);
          this.loadedTotal.set(0);
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
      category: 'ACCUMULATED',
      type: 'EXPENSE',
    };

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  saveExpense() {
    if (!this.expenseForm.amount || !this.expenseForm.description) return;

    this.loading.set(true);
    const formattedDate = this.datePipe.transform(
      this.expenseForm.date,
      'yyyy-MM-dd HH:mm:ss',
    )!;
    const currentMonthStr = this.selectedMonthKey();

    const payload = {
      ...this.expenseForm,
      date: formattedDate,
    };

    const request$ = this.isEditing()
      ? this.cashService.updateMovement(
          this.editingId!,
          payload,
          this.selectedFiles.length ? this.selectedFiles : null,
          currentMonthStr,
          'ACCUMULATED',
        )
      : this.cashService.registerMovement(
          payload,
          this.selectedFiles.length ? this.selectedFiles : null,
          currentMonthStr,
        );

    request$.subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: this.isEditing()
            ? 'Egreso actualizado'
            : 'Egreso registrado desde Cuenta Acumulada',
        });
        this.resetForm();
        this.loadExpenses(true);
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
      category: 'ACCUMULATED',
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

  canSaveExpense(): boolean {
    return this.isEditing()
      ? this.canUpdateCashflow()
      : this.canStoreCashflow();
  }
}
