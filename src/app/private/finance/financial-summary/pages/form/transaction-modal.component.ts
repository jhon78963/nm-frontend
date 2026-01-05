import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-transaction-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './transaction-modal.component.html',
  styleUrl: './transaction-modal.component.scss',
})
export class TransactionModalComponent implements OnChanges {
  @Input() visible: boolean = false;
  @Input() type: 'INGRESO' | 'GASTO' = 'INGRESO';

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<any>();

  // Referencia al input del HTML para enfocarlo manualmente
  @ViewChild('amountInput') amountInput!: ElementRef;

  amount: number | null = null;
  selectedCategory: any = null;

  incomeCategories = [
    {
      id: 1,
      name: 'Venta',
      icon: 'fas fa-tshirt',
      colorClass: 'bg-green-100 text-green-600',
    },
    {
      id: 2,
      name: 'Capital',
      icon: 'fas fa-wallet',
      colorClass: 'bg-blue-100 text-blue-600',
    },
  ];

  expenseCategories = [
    {
      id: 1,
      name: 'Pasaje',
      icon: 'fas fa-bus',
      colorClass: 'bg-red-100 text-red-600',
    },
    {
      id: 2,
      name: 'Comida',
      icon: 'fas fa-utensils',
      colorClass: 'bg-orange-100 text-orange-600',
    },
    {
      id: 3,
      name: 'Puesto',
      icon: 'fas fa-store',
      colorClass: 'bg-purple-100 text-purple-600',
    },
    {
      id: 4,
      name: 'Otros',
      icon: 'fas fa-ellipsis-h',
      colorClass: 'surface-200 text-600',
    },
  ];

  // Detectar cuando se abre el modal para enfocar el input
  ngOnChanges(changes: SimpleChanges) {
    if (changes['visible'] && changes['visible'].currentValue === true) {
      // Esperamos 100ms a que el *ngIf renderice el input y luego enfocamos
      setTimeout(() => {
        if (this.amountInput) {
          this.amountInput.nativeElement.focus();
        }
      }, 100);
    }
  }

  get currentCategories() {
    return this.type === 'INGRESO'
      ? this.incomeCategories
      : this.expenseCategories;
  }

  get titleColor() {
    return this.type === 'INGRESO' ? 'text-green-600' : 'text-red-600';
  }

  // Helper para saber si el formulario es válido
  get isValid() {
    return this.amount && this.amount > 0 && this.selectedCategory;
  }

  close() {
    this.visible = false;
    this.visibleChange.emit(false);
    setTimeout(() => {
      this.amount = null;
      this.selectedCategory = null;
    }, 200);
  }

  save() {
    if (!this.isValid) {
      console.warn('Formulario inválido: Falta monto o categoría');
      return;
    }

    this.saved.emit({
      type: this.type,
      amount: this.amount,
      category: this.selectedCategory,
    });
    this.close();
  }
}
