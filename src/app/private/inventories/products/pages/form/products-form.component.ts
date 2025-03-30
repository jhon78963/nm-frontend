import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ProductsService } from '../../services/products.service';
import { GendersService } from '../../../../../services/genders.service';
import { Gender } from '../../../../../models/gender.interface';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../../../shared/shared.module';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Product, ProductSave, Size } from '../../models/products.model';
import { KeyFilterModule } from 'primeng/keyfilter';

@Component({
  selector: 'app-products-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    RouterLink,
    KeyFilterModule,
  ],
  templateUrl: './products-form.component.html',
  styleUrl: './products-form.component.scss',
})
export class ProductsFormComponent implements OnInit {
  productId: number = 0;
  genders: Gender[] = [];
  sizes: Size[] = [];

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly productsService: ProductsService,
    private readonly gendersService: GendersService,
    private route: ActivatedRoute,
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
          console.log(this.sizes);
        },
      });
    }

    console.log(this.productId);
  }

  saveProductButton() {
    const product = new ProductSave(this.form.value);
    this.productsService.create(product).subscribe({
      next: () => {
        alert('producto creado');
      },
    });
  }
}
