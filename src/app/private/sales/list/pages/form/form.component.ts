import { Component, OnInit } from '@angular/core';
import { SharedModule } from '../../../../../shared/shared.module';
import { CommonModule, DatePipe } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormArray, // Importante importar esto
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
import { formatDateTime } from '../../../../../utils/dates';

@Component({
  selector: 'app-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, SharedModule],
  templateUrl: './form.component.html',
  styleUrl: './form.component.scss',
  providers: [DialogService, MessageService, DatePipe],
})
export class SaleFormComponent implements OnInit {
  // Agregamos 'items' como un array de controles
  form: FormGroup = this.formBuilder.group({
    creationTime: [new Date(), Validators.required],
    items: this.formBuilder.array([]),
  });

  saleDetails: any = null;
  calculatedTotal: number = 0; // Para mostrar el total dinámico

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
        this.saleDetails = response;
        this.calculatedTotal = response.total;

        // 1. Cargar Fecha
        if (response.datetime_iso) {
          this.form.patchValue({
            creationTime: new Date(response.datetime_iso),
          });
        } else {
          this.form.patchValue(response);
        }

        // 2. Cargar Items en el FormArray para poder editarlos
        this.initItems(response.items);
      });
    }
  }

  // Inicializa el array de productos editable
  initItems(items: any[]) {
    const itemsArray = this.form.get('items') as FormArray;
    itemsArray.clear();

    items.forEach(item => {
      const group = this.formBuilder.group({
        id: [item.id], // ID del detalle para saber cuál actualizar
        product_name: [item.product_name], // Solo lectura
        size: [item.size],
        color: [item.color],
        quantity: [item.quantity], // Podrías hacerlo editable si quieres

        // El precio unitario es el campo estrella editable
        unit_price: [item.unit_price, [Validators.required, Validators.min(0)]],

        subtotal: [item.subtotal],
      });

      // Escuchamos cambios en el precio para actualizar subtotal y total general
      group.get('unit_price')?.valueChanges.subscribe(newPrice => {
        const qty = group.get('quantity')?.value || 0;
        const sub = (newPrice || 0) * qty;

        // Actualizamos el subtotal de la fila (sin emitir evento para evitar bucles)
        group.patchValue({ subtotal: sub }, { emitEvent: false });

        // Recalculamos el total de la venta
        this.updateGrandTotal();
      });

      itemsArray.push(group);
    });
  }

  updateGrandTotal() {
    const items = (this.form.get('items') as FormArray).controls;
    this.calculatedTotal = items.reduce((acc, control) => {
      return acc + (control.get('subtotal')?.value || 0);
    }, 0);
  }

  // Getter para usar en el HTML
  get itemsControls() {
    return (this.form.get('items') as FormArray).controls;
  }

  get isValid(): boolean {
    return this.form.valid;
  }

  buttonSaveSale() {
    if (this.form.valid) {
      // Obtenemos los valores crudos para incluir los campos deshabilitados si los hubiera
      const formValue = this.form.getRawValue();

      // Construimos el payload manual para asegurar la estructura
      const salePayload = {
        ...formValue, // fecha
        // Formateamos fecha si es necesario
        creationTime: formatDateTime(formValue.creationTime, this.datePipe),

        // Enviamos solo lo necesario de los items para actualizar (ID y nuevo precio)
        items: formValue.items.map((i: any) => ({
          id: i.id,
          unit_price: i.unit_price,
        })),
      };

      const id = this.dynamicDialogConfig.data.id;
      this.salesService.edit(id, salePayload).subscribe({
        next: () => this.dynamicDialogRef.close(true),
        error: () => {},
      });
    }
  }
}
