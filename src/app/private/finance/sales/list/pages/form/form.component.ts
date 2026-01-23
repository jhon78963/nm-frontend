import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  DialogService,
  DynamicDialogConfig,
  DynamicDialogRef,
} from 'primeng/dynamicdialog';
import { MessageService } from 'primeng/api';
import { SalesService } from '../../services/sales.service';
import { SharedModule } from '../../../../../../shared/shared.module';
import { formatDateTime } from '../../../../../../utils/dates';

@Component({
  selector: 'app-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, SharedModule],
  templateUrl: './form.component.html',
  styleUrl: './form.component.scss',
  providers: [DialogService, MessageService, DatePipe],
})
export class SaleFormComponent implements OnInit {
  form: FormGroup = this.formBuilder.group({
    creationTime: [new Date(), Validators.nullValidator],
    items: this.formBuilder.array([]),
    payments: this.formBuilder.array([]), // Nuevo Array de Pagos
  });

  calculatedTotal: number = 0;
  calculatedPayments: number = 0;

  paymentMethodsList = ['CASH', 'YAPE', 'CARD'];

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly salesService: SalesService,
    private readonly dynamicDialogRef: DynamicDialogRef,
    private readonly dynamicDialogConfig: DynamicDialogConfig,
    private readonly datePipe: DatePipe,
  ) {}

  ngOnInit(): void {
    if (this.dynamicDialogConfig.data.id) {
      const id = this.dynamicDialogConfig.data.id;
      this.salesService.getOne(id).subscribe((response: any) => {
        // 1. Fecha
        if (response.datetime_iso) {
          this.form.patchValue({
            creationTime: new Date(response.datetime_iso),
          });
        }

        // 2. Items
        this.initItems(response.items);

        // 3. Pagos (Cargar los existentes)
        this.initPayments(response.payments);

        this.recalculateTotals();
      });
    }
  }

  // --- ITEMS ---
  initItems(items: any[]) {
    const itemsArray = this.form.get('items') as FormArray;
    itemsArray.clear();
    items.forEach(item => {
      const group = this.formBuilder.group({
        id: [item.id],
        product_name: [item.product_name],
        description_full: [item.description_full],
        quantity: [item.quantity],
        unit_price: [item.unit_price, [Validators.required, Validators.min(0)]],
        subtotal: [item.subtotal],
      });

      // Recalcular al cambiar precio
      group.get('unit_price')?.valueChanges.subscribe(() => {
        const qty = group.get('quantity')?.value;
        const price = group.get('unit_price')?.value;
        group.patchValue({ subtotal: qty * price }, { emitEvent: false });
        this.recalculateTotals();
      });

      itemsArray.push(group);
    });
  }

  // --- PAGOS ---
  initPayments(payments: any[]) {
    const paymentsArray = this.form.get('payments') as FormArray;
    paymentsArray.clear();

    // Si no hay pagos registrados (antiguo), creamos uno por defecto CASH con el total
    if (!payments || payments.length === 0) {
      this.addPaymentRow(this.calculatedTotal, 'CASH');
      return;
    }

    payments.forEach(pay => {
      this.addPaymentRow(pay.amount, pay.method);
    });
  }

  addPaymentRow(amount: number = 0, method: string = 'CASH') {
    const paymentsArray = this.form.get('payments') as FormArray;
    const group = this.formBuilder.group({
      method: [method, Validators.required],
      amount: [amount, [Validators.required, Validators.min(0)]],
    });

    group.get('amount')?.valueChanges.subscribe(() => this.recalculateTotals());

    paymentsArray.push(group);
    this.recalculateTotals();
  }

  removePayment(index: number) {
    (this.form.get('payments') as FormArray).removeAt(index);
    this.recalculateTotals();
  }

  // --- CÁLCULOS ---
  recalculateTotals() {
    // Total Venta
    const items = (this.form.get('items') as FormArray).controls;
    this.calculatedTotal = items.reduce(
      (acc, ctrl) => acc + (ctrl.get('subtotal')?.value || 0),
      0,
    );

    // Total Pagado
    const payments = (this.form.get('payments') as FormArray).controls;
    this.calculatedPayments = payments.reduce(
      (acc, ctrl) => acc + (ctrl.get('amount')?.value || 0),
      0,
    );
  }

  // --- GETTERS ---
  get itemsControls() {
    return (this.form.get('items') as FormArray).controls;
  }
  get paymentsControls() {
    return (this.form.get('payments') as FormArray).controls;
  }

  // Validamos que formulario esté ok Y que los montos cuadren (con margen error decimal)
  get isFormValid(): boolean {
    const diff = Math.abs(this.calculatedTotal - this.calculatedPayments);
    return this.form.valid && diff < 0.1;
  }

  buttonSaveSale() {
    if (this.isFormValid) {
      const formValue = this.form.getRawValue();
      const id = this.dynamicDialogConfig.data.id;

      const payload: any = {
        id: id,
        code: this.dynamicDialogConfig.data.code,
        total: this.calculatedTotal,
        status: this.dynamicDialogConfig.data.status,
        creationTime: formatDateTime(formValue.creationTime, this.datePipe),
        items: formValue.items.map((i: any) => ({
          id: i.id,
          unit_price: i.unit_price,
        })),
        payments: formValue.payments.map((p: any) => ({
          method: p.method,
          amount: p.amount,
        })),
      };

      this.salesService.edit(id, payload).subscribe({
        next: () => this.dynamicDialogRef.close(true),
        error: () => {},
      });
    }
  }
}
