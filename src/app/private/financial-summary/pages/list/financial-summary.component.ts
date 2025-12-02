import { Component } from '@angular/core';
import { TransactionModalComponent } from '../form/transaction-modal.component';

@Component({
  selector: 'app-financial-summary',
  standalone: true,
  imports: [TransactionModalComponent],
  templateUrl: './financial-summary.component.html',
  styleUrl: './financial-summary.component.scss',
})
export class FinancialSummaryListComponent {
  // Variables para controlar el modal
  modalVisible: boolean = false;
  modalType: 'INGRESO' | 'GASTO' = 'INGRESO';

  // Función que llaman tus botones "Ingreso" y "Gasto"
  openTransactionModal(type: 'INGRESO' | 'GASTO') {
    this.modalType = type;
    this.modalVisible = true;
  }

  // Función que recibe los datos cuando el usuario da click en Guardar
  handleTransactionSave(data: any) {
    console.log('Datos guardados:', data);
    // Aquí actualizas tu tabla, llamas a tu API, etc.
    // Ejemplo:
    // this.kpis.cajaTotal += data.amount;
  }
}
