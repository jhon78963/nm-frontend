import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { SalesService } from '../../services/sales.service';
import { InputNumberModule } from 'primeng/inputnumber'; // Importante para el input de precio
import { PosService } from '../../../pos/services/pos.service';

@Component({
  selector: 'app-exchange',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InputTextModule,
    ButtonModule,
    DropdownModule,
    InputNumberModule, // Agregado
  ],
  templateUrl: './exchange.component.html',
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class SaleExchangeComponent implements OnInit {
  salesService = inject(SalesService);
  posService = inject(PosService);
  config = inject(DynamicDialogConfig);
  ref = inject(DynamicDialogRef);

  step = 1;
  loading = true;

  // Datos
  saleFound: any = null;
  selectedReturnItem: any = null;

  newProductSearch = '';
  newProductFound: any = null;
  selectedNewVariant: any = null;

  // Diferencia
  paymentMethod = 'CASH';
  paymentMethods = [
    { label: 'Efectivo', value: 'CASH' },
    { label: 'Yape/Plin', value: 'YAPE' },
    { label: 'Tarjeta', value: 'CARD' },
  ];

  ngOnInit() {
    const saleId = this.config.data?.id;
    if (saleId) {
      this.loadSale(saleId);
    } else {
      this.loading = false;
    }
  }

  loadSale(id: number) {
    this.loading = true;
    this.salesService.getOne(id).subscribe({
      next: (res: any) => {
        this.saleFound = res;
        this.loading = false;
        this.step = 1;
      },
      error: () => {
        this.loading = false;
        this.ref.close();
      },
    });
  }

  selectReturnItem(item: any) {
    this.selectedReturnItem = item;
    this.step = 2;
  }

  async searchNewProduct() {
    if (!this.newProductSearch) return;
    const prod = await this.posService.searchProductBySku(
      this.newProductSearch,
    );
    if (prod) {
      this.newProductFound = prod;
    }
  }

  selectNewVariant(variant: any, size: string) {
    // Inicializamos negotiatedPrice con el precio de lista
    this.selectedNewVariant = {
      ...variant,
      size,
      negotiatedPrice: variant.price, // Nuevo campo editable
    };
    this.step = 3;
  }

  // Cálculos dinámicos
  get returnAmount() {
    return this.selectedReturnItem?.unit_price || 0;
  }

  // Ahora usamos el precio negociado
  get newAmount() {
    return this.selectedNewVariant?.negotiatedPrice || 0;
  }

  get difference() {
    return this.newAmount - this.returnAmount;
  }

  confirmExchange() {
    const diff = this.difference;

    const payload = {
      returned_detail_id: this.selectedReturnItem.id,
      difference_amount: diff > 0 ? diff : 0,
      payment_method: this.paymentMethod,
      new_item: {
        product_size_id: this.selectedNewVariant.product_size_id,
        color_id: this.selectedNewVariant.color_id,
        final_price: this.newAmount, // Enviamos el precio final por si el backend lo quiere registrar
      },
    };

    this.salesService.processExchange(payload).subscribe({
      next: () => {
        this.ref.close({ success: true });
      },
      error: err => console.error(err),
    });
  }

  close() {
    this.ref.close();
  }

  objectKeys(obj: any) {
    return Object.keys(obj);
  }
}
