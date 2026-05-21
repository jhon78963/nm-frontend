import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { MessageService } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import { KeyFilterModule } from 'primeng/keyfilter';
import { StepsModule } from 'primeng/steps';
import { ToastModule } from 'primeng/toast';

import { SharedModule } from '../../../../../../shared/shared.module';

import { GendersService } from '../../../../../../services/genders.service';
import { ProductsService } from '../../../services/products.service';

import { Gender } from '../../../../../../models/gender.interface';
import { Warehouse } from '../../../../../../models/warehouse.interface';
import { WarehousesService } from '../../../../../../services/warehouse.service';
import { Product, ProductSave } from '../../../models/products.model';

@Component({
  selector: 'app-products-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    KeyFilterModule,
    SharedModule,
    StepsModule,
    ToastModule,
  ],
  templateUrl: './products-form.component.html',
  styleUrl: './products-form.component.scss',
  providers: [DialogService, MessageService],
})
export class ProductsFormComponent implements OnInit {
  productId: number = 0;
  genders: Gender[] = [];
  warehouses: Warehouse[] = [];

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly gendersService: GendersService,
    private readonly productsService: ProductsService,
    private readonly warehousesService: WarehousesService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {
    if (this.route.snapshot.paramMap.get('id')) {
      this.productId = Number(this.route.snapshot.paramMap.get('id'));
    }
  }

  form: FormGroup = this.formBuilder.group({
    id: [null],
    name: ['', Validators.required],
    genderId: [{ value: 1, disabled: false }, Validators.required],
    warehouseId: [{ value: 1, disabled: false }, Validators.required],
  });

  ngOnInit(): void {
    this.gendersService.getAll().subscribe((genders: Gender[]) => {
      this.genders = genders;
    });
    this.warehousesService.getAll().subscribe((warehouses: Warehouse[]) => {
      this.warehouses = warehouses;
    });
    if (this.productId !== 0) {
      this.productsService.getOne(this.productId).subscribe({
        next: (product: Product) => {
          this.form.patchValue(product);
        },
      });
    }
  }

  get isValid(): boolean {
    return this.form.valid;
  }

  saveProductButton() {
    if (!this.form.valid) {
      this.form.markAllAsTouched();
      return;
    }

    const product = new ProductSave(this.form.getRawValue() as Product);
    if (product.id) {
      this.productsService.edit(product.id, product).subscribe({
        next: (resP: any) => {
          this.router.navigate([
            '/inventories/products/step/sizes',
            resP.productId,
          ]);
        },
      });
    } else {
      this.productsService.create(product).subscribe({
        next: (resP: any) => {
          this.router.navigate([
            '/inventories/products/step/sizes',
            resP.productId,
          ]);
        },
      });
    }
  }
}
