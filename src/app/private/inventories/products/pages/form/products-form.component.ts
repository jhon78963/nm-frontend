import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

import { KeyFilterModule } from 'primeng/keyfilter';

import { ProductsService } from '../../services/products.service';
import { GendersService } from '../../../../../services/genders.service';

import { SharedModule } from '../../../../../shared/shared.module';

import {
  Product,
  ProductSave,
  ProductSize,
  Size,
} from '../../models/products.model';
import { Gender } from '../../../../../models/gender.interface';
import { SizesTableComponent } from '../../components/sizes/table/sizes-table.component';
import { DialogService } from 'primeng/dynamicdialog';
import { SizesFormComponent } from '../../components/sizes/form/sizes-form.component';
import { showError, showSuccess } from '../../../../../utils/notifications';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-products-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    KeyFilterModule,
    ReactiveFormsModule,
    RouterLink,
    SharedModule,
    SizesTableComponent,
  ],
  templateUrl: './products-form.component.html',
  styleUrl: './products-form.component.scss',
  providers: [DialogService, MessageService],
})
export class ProductsFormComponent implements OnInit {
  productId: number = 0;
  genders: Gender[] = [];
  sizes: Size[] = [];

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly dialogService: DialogService,
    private readonly messageService: MessageService,
    private readonly productsService: ProductsService,
    private readonly gendersService: GendersService,
    private readonly route: ActivatedRoute,
  ) {
    if (this.route.snapshot.paramMap.get('id')) {
      this.productId = Number(this.route.snapshot.paramMap.get('id'));
    }
  }

  form: FormGroup = this.formBuilder.group({
    name: ['', Validators.required],
    description: ['', Validators.required],
    purchasePrice: ['', Validators.required],
    wholesalePrice: ['', Validators.required],
    minWholesalePrice: ['', Validators.required],
    ratailPrice: ['', Validators.required],
    minRatailPrice: [null, Validators.required],
    genderId: [{ value: null, disabled: true }, Validators.required],
  });

  ngOnInit(): void {
    this.gendersService.getAll().subscribe((genders: Gender[]) => {
      this.genders = genders;
    });

    if (this.productId !== 0) {
      this.productsService.getOne(this.productId).subscribe({
        next: (product: Product) => {
          this.form.patchValue(product);
          this.sizes = product.sizes;
        },
      });
    }
  }

  saveProductButton() {
    const product = new ProductSave(this.form.value);
    this.productsService.create(product).subscribe({
      next: () => {
        alert('producto creado');
      },
    });
  }

  addSize(productId: number) {
    const modal = this.dialogService.open(SizesFormComponent, {
      data: { productId },
      header: 'Agregar talla',
      styleClass: 'dialog-custom-form',
    });

    modal.onClose.subscribe({
      next: value => {
        value && value?.success
          ? showSuccess(this.messageService, 'Talla agregada')
          : value?.error
            ? showError(this.messageService, value?.error)
            : null;
      },
    });
  }

  getProductsizeSeletected(productSize: ProductSize) {
    console.log(productSize);
  }
}
