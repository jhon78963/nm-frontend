import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

// PrimeNG
import { toSignal } from '@angular/core/rxjs-interop';
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
import { SafeUrlPipe } from '../../pipes/safe-url.pipe';
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

  selectedMonth: Date = new Date();

  private cashService = inject(CashflowService);
  private messageService = inject(MessageService);
  private datePipe = inject(DatePipe);

  // Estado del componente
  loading = signal(false);
  adminExpenses = toSignal(this.cashService.getAdminExpenses(), {
    initialValue: [],
  });
  selectedFile: File | null = null;

  // Variables para el Preview
  displayPreview = signal(false);
  previewUrl = signal('');
  isPdf = signal(false);

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
      complete: () => this.loading.set(false),
    });
  }

  showVoucher(path: string) {
    const fullUrl = `http://127.0.0.1:3050${path}`;
    this.previewUrl.set(fullUrl);

    // Detectamos si es PDF por la extensión
    this.isPdf.set(path.toLowerCase().endsWith('.pdf'));

    this.displayPreview.set(true);
  }

  onFileSelect(event: any) {
    this.selectedFile = event.files[0];
  }

  saveExpense() {
    if (!this.expenseForm.amount || !this.expenseForm.description) return;

    this.loading.set(true);
    const formattedDate = this.datePipe.transform(
      this.expenseForm.date,
      'yyyy-MM-dd HH:mm:ss',
    )!;
    const currentDateStr = this.datePipe.transform(new Date(), 'yyyy-MM-dd')!;

    this.cashService
      .registerMovement(
        { ...this.expenseForm, date: formattedDate },
        this.selectedFile,
        currentDateStr,
      )
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Gasto registrado correctamente',
          });
          this.resetForm();
          this.loadExpenses();
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo subir el archivo',
          });
          this.loading.set(false);
        },
      });
  }

  resetForm() {
    this.expenseForm = {
      ...this.expenseForm,
      description: '',
      amount: null,
      date: new Date(),
      payment_method: 'CASH',
    };
    this.selectedFile = null;
    if (this.fileUpload) {
      this.fileUpload.clear();
    }
  }
}
