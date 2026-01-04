import { Component, inject, OnInit, signal } from '@angular/core';
import { FinancialSummaryService } from '../../services/financial-summary.service';
import { TableModule } from 'primeng/table';
import { CommonModule, DatePipe } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { TransactionModalComponent } from '../form/transaction-modal.component';
import { CashflowService } from '../../../finance/cash-movements/services/cash-movements.service';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-financial-summary',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    CardModule,
    TableModule,
    TagModule,
    TooltipModule,
    SkeletonModule,
    TransactionModalComponent,
  ],
  templateUrl: './financial-summary.component.html',
  styleUrl: './financial-summary.component.scss',
  providers: [DatePipe, MessageService],
})
export class FinancialSummaryListComponent implements OnInit {
  // Variables para controlar el modal
  private financialSummaryService = inject(FinancialSummaryService);
  private cashflowService = inject(CashflowService);
  currentDate = new Date();
  datePipe = inject(DatePipe);
  messageService = inject(MessageService);

  loading = signal<boolean>(true);

  cards = signal<any>({
    cash_total: { amount: 0, cash: 0, digital: 0 },
    sales_income: { amount: 0, growth: 0 },
    expenses: { amount: 0, description: '' },
    stock_investment: { amount: 0, description: '' },
  });

  transactions = signal<any[]>([]);

  showModal: boolean = false;
  modalType: 'INGRESO' | 'GASTO' = 'INGRESO';

  ngOnInit() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    this.loading.set(true);
    this.financialSummaryService.getSummary().subscribe({
      next: res => {
        this.cards.set(res.cards);
        this.transactions.set(res.recent_transactions);
        this.loading.set(false);
      },
      error: err => {
        console.error('Error cargando dashboard', err);
        this.loading.set(false);
      },
    });
  }

  // Función que llaman tus botones "Ingreso" y "Gasto"
  openTransactionModal(type: 'INGRESO' | 'GASTO') {
    this.modalType = type;
    this.showModal = true;
  }

  // Función que recibe los datos cuando el usuario da click en Guardar
  handleTransactionSave(data: any) {
    // 1. Llamamos a la API para guardar
    this.cashflowService.registerSummaryMovement(data).subscribe({
      next: (res: any) => {
        if (res.success) {
          // 2. Notificación de éxito
          this.messageService.add({
            severity: 'success',
            summary: 'Guardado',
            detail: 'Movimiento registrado correctamente',
          });

          // 3. Cerramos modal
          this.showModal = false;

          // 4. Recargamos los datos para ver el impacto en la caja
          // (Esto actualiza las tarjetas y la tabla automáticamente)
          this.loadDashboardData();
        }
      },
      error: err => {
        console.error(err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo registrar el movimiento',
        });
      },
    });
  }
}
