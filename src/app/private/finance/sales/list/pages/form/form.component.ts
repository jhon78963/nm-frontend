import { CommonModule, DatePipe } from '@angular/common';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MessageService } from 'primeng/api';
import {
  DialogService,
  DynamicDialogConfig,
  DynamicDialogRef,
} from 'primeng/dynamicdialog';
import { finalize } from 'rxjs';
import { SharedModule } from '../../../../../../shared/shared.module';
import { formatDateTime } from '../../../../../../utils/dates';
import { showError } from '../../../../../../utils/notifications';
import { SalesService } from '../../services/sales.service';
import { ProductSelectorComponent } from '../product-selector/product-selector.component';

@Component({
  selector: 'app-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, SharedModule],
  templateUrl: './form.component.html',
  styleUrl: './form.component.scss',
  providers: [DialogService, MessageService, DatePipe],
})
export class SaleFormComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  form: FormGroup = this.formBuilder.group({
    creationTime: [new Date(), Validators.nullValidator],
    items: this.formBuilder.array([]),
    payments: this.formBuilder.array([]), // Nuevo Array de Pagos
  });

  calculatedTotal: number = 0;
  calculatedPayments: number = 0;

  paymentMethodsList = ['CASH', 'YAPE', 'CARD'];

  isCanceled = signal<boolean>(false);
  isSaving = false;

  constructor(
    private readonly datePipe: DatePipe,
    private readonly dialogService: DialogService,
    private readonly dynamicDialogConfig: DynamicDialogConfig,
    private readonly dynamicDialogRef: DynamicDialogRef,
    private readonly formBuilder: FormBuilder,
    private readonly messageService: MessageService,
    private readonly salesService: SalesService,
  ) {}

  ngOnInit(): void {
    if (this.dynamicDialogConfig.data.id) {
      const id = this.dynamicDialogConfig.data.id;
      this.salesService
        .getOne(id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((response: any) => {
        this.isCanceled.set(response.status === 'CANCELED');

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

        if (this.isCanceled()) {
          this.form.disable();
        }
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
        quantity: [item.quantity, [Validators.required, Validators.min(1)]], // Agregado Validators
        unit_price: [item.unit_price, [Validators.required, Validators.min(0)]],
        subtotal: [item.subtotal],
        product_size_id: [null],
        color_id: [item.color_id],
      });

      // Recalcular al cambiar precio O CANTIDAD
      const recalculate = () => {
        const qty = group.get('quantity')?.value || 0;
        const price = group.get('unit_price')?.value || 0;
        group.patchValue({ subtotal: qty * price }, { emitEvent: false });
        this.recalculateTotals();
      };

      group
        .get('unit_price')
        ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(recalculate);
      group
        .get('quantity')
        ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(recalculate);

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

    group
      .get('amount')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.recalculateTotals());

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
          quantity: i.quantity,
          unit_price: i.unit_price,
          product_size_id: i.product_size_id,
          color_id: i.color_id,
        })),
        payments: formValue.payments.map((p: any) => ({
          method: p.method,
          amount: p.amount,
        })),
      };

      this.isSaving = true;
      this.salesService
        .edit(id, payload)
        .pipe(
          finalize(() => {
            this.isSaving = false;
          }),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe({
          next: () => this.dynamicDialogRef.close(true),
          error: (err: unknown) => {
            const message =
              (err as { error?: { message?: string }; message?: string })
                ?.error?.message ??
              (err as { message?: string })?.message ??
              'Error al guardar la venta.';
            showError(this.messageService, message);
          },
        });
    }
  }

  openExchangeProduct(index: number) {
    const ref = this.dialogService.open(ProductSelectorComponent, {
      header: 'Seleccionar Reemplazo',
      width: '60vw',
    });

    ref.onClose.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((res: any) => {
      if (res) {
        const itemsArray = this.form.get('items') as FormArray;
        const row = itemsArray.at(index);

        // MAPEAMOS MANUALMENTE: res -> formulario
        row.patchValue({
          product_size_id: res.product_size_id,
          color_id: res.color_id,
          product_name: res.name, // res tiene 'name', form tiene 'product_name'
          unit_price: res.sale_price, // res tiene 'sale_price', form tiene 'unit_price'
          description_full: `${res.name} (${res.size_name} | ${res.colorName})`,
          // Mantenemos la cantidad que ya estaba o la reseteamos a 1
          quantity: row.get('quantity')?.value || 1,
        });

        // Forzamos el cálculo de subtotal de esa fila
        const qty = row.get('quantity')?.value;
        const price = res.sale_price;
        row.get('subtotal')?.setValue(qty * price);

        // Recalculamos totales generales de la venta
        this.recalculateTotals();

        this.messageService.add({
          severity: 'success',
          summary: 'Producto Actualizado',
          detail: 'Se aplicó el cambio de mercadería localmente.',
        });
      }
    });
  }

  fixOverpayment() {
    const payments = this.form.get('payments') as FormArray;
    if (payments.length === 1) {
      // Si solo hay un pago, lo igualamos al total de la venta
      payments.at(0).patchValue({ amount: this.calculatedTotal });
    } else {
      // Si hay varios, reducimos el último hasta que cuadre
      const diff = this.calculatedPayments - this.calculatedTotal;
      const lastAmount = payments.at(payments.length - 1).get('amount')?.value;
      payments
        .at(payments.length - 1)
        .patchValue({ amount: lastAmount - diff });
    }
    this.recalculateTotals();
  }
}
