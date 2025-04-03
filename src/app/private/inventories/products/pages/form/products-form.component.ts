import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

import { KeyFilterModule } from 'primeng/keyfilter';

import { ProductsService } from '../../services/products.service';
import { GendersService } from '../../../../../services/genders.service';

import { SharedModule } from '../../../../../shared/shared.module';

import { Product, ProductSave, Size } from '../../models/products.model';
import { Gender } from '../../../../../models/gender.interface';
import { SizesTableComponent } from '../../components/sizes/table/sizes-table.component';
import { DialogService } from 'primeng/dynamicdialog';
// import { showError, showSuccess } from '../../../../../utils/notifications';
import { MessageService } from 'primeng/api';
import { ProductSizesService } from '../../services/productSizes.service';
import { ProductSizeColorsService } from '../../services/productColors.service';

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
  @Output() addSizeEvent = new EventEmitter<void>();
  productId: number = 0;
  genders: Gender[] = [];
  sizes: Size[] = [];

  constructor(
    private readonly router: Router,
    private readonly formBuilder: FormBuilder,
    private readonly dialogService: DialogService,
    private readonly messageService: MessageService,
    private readonly productsService: ProductsService,
    private readonly productSizesService: ProductSizesService,
    private readonly productSizeColorsService: ProductSizeColorsService,
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
    salePrice: ['', Validators.required],
    minSalePrice: ['', Validators.required],
    genderId: [{ value: 1, disabled: false }, Validators.required],
    productSizes: this.formBuilder.array([]),
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
      next: (resP: any) => {
        const productSizes = this.form.get('productSizes')?.value || [];
        productSizes.forEach((productSize: any) => {
          this.productSizesService
            .add(resP.productId, productSize.size.id, {
              stock: productSize.stock,
              price: productSize.price,
            })
            .subscribe({
              next: (res: any) => {
                productSize.colors?.forEach((color: any) => {
                  this.productSizeColorsService
                    .add(res.productSizeId, color.id, {
                      stock: 1,
                      price: productSize.price,
                    })
                    .subscribe({
                      next: () => {
                        this.router.navigate([
                          `/inventories/products/edit/${resP.productId}`,
                        ]);
                      },
                    });
                });
              },
            });
        });
      },
    });
  }

  addSize() {
    this.addSizeEvent.emit();
  }

  // addSize(productId: number) {
  //   const modal = this.dialogService.open(SizesFormComponent, {
  //     data: { productId },
  //     header: 'Agregar talla',
  //     styleClass: 'dialog-custom-form',
  //   });

  //   modal.onClose.subscribe({
  //     next: (res: any) => {
  //       if (res && res.sizeSelected) {
  //         console.log(res.sizeSelected);
  //         this.sizes.push({
  //           id: res.sizeSelected.sizeId,
  //           description: 'S',
  //           stock: res.sizeSelected.stock,
  //           price: 10,
  //           colors: res.sizeSelected.colors,
  //         });
  //       }
  //     },
  //   });
  // }

  getProductsizeSeletected(form: any) {
    console.log(form);
  }
}
