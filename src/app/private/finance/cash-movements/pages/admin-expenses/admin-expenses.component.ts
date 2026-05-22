import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

// PrimeNG
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { FileUpload, FileUploadModule } from 'primeng/fileupload';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';

import { DialogModule } from 'primeng/dialog';
import { BASE_UPLOAD_URL } from '../../../../../utils/constants';
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
    FileUploadModule,
    TableModule,
    TagModule,
    ToastModule,
    DialogModule,
    SafeUrlPipe,
  ],
  providers: [MessageService, DatePipe, DialogModule],
  templateUrl: './admin-expenses.component.html',
})
export class AdminExpensesComponent implements OnInit {
  @ViewChild('fileUpload') fileUpload!: FileUpload;

  private readonly authService = inject(AuthService);

  baseUploadUrl = BASE_UPLOAD_URL;

  selectedMonth: Date = new Date();

  private cashService = inject(CashflowService);
  private messageService = inject(MessageService);
  private datePipe = inject(DatePipe);

  // Estado del componente
  loading = signal(false);
  adminExpenses = signal<any[]>([]);
  selectedFile: File | null = null;

  // Variables para el Preview
  displayPreview = signal(false);
  previewUrl = signal('');
  isPdf = signal(false);

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

  showVoucher(path: string) {
    const base = this.baseUploadUrl.replace(/\/$/, '');
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const fullUrl = `${base}${normalizedPath}`;
    this.previewUrl.set(fullUrl);

    // Detectamos si es PDF por la extensión
    this.isPdf.set(path.toLowerCase().endsWith('.pdf'));

    this.displayPreview.set(true);
  }

  onFileSelect(event: any) {
    this.selectedFile = event.files[0];
  }

  editExpense(expense: any) {
    this.isEditing.set(true);
    this.editingId = expense.id;

    this.expenseForm = {
      description: expense.description,
      amount: expense.amount,
      date: new Date(expense.date), // Convertimos el string de la BD a Date
      payment_method: expense.method,
      category: 'ADMINISTRATIVE',
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
          this.selectedFile,
          currentMonthStr,
        )
      : this.cashService.registerMovement(
          { ...this.expenseForm, date: formattedDate },
          this.selectedFile,
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
    this.selectedFile = null;
    this.isEditing.set(false);
    this.editingId = null;
    if (this.fileUpload) this.fileUpload.clear();
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
}
