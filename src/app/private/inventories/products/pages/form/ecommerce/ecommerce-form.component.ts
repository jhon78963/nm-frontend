import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SharedModule } from '../../../../../../shared/shared.module';
import { ToastModule } from 'primeng/toast';
import { KeyFilterModule } from 'primeng/keyfilter';
import { MessageService } from 'primeng/api';
import { TooltipModule } from 'primeng/tooltip';
import { LoadingService } from '../../../../../../services/loading.service';
import { ProgressSpinnerService } from '../../../../../../services/progress-spinner.service';
import { Product, ProductSave } from '../../../models/products.model';
import { ProductsService } from '../../../services/products.service';

@Component({
  selector: 'app-products-ecommerce-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    SharedModule,
    ToastModule,
    KeyFilterModule,
    TooltipModule,
  ],
  templateUrl: './ecommerce-form.component.html',
  styleUrl: './ecommerce-form.component.scss',
  providers: [MessageService],
})
export class EcommerceFormComponent implements OnInit {
  productId: number = 0;
  stepper: boolean = true;

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly formBuilder: FormBuilder,
    private readonly productsService: ProductsService,
    private readonly loadingService: LoadingService,
    private readonly progressSpinnerService: ProgressSpinnerService,
  ) {
    if (this.route.snapshot.paramMap.get('id')) {
      this.productId = Number(this.route.snapshot.paramMap.get('id'));
      this.stepper = this.router.url.includes('/step/');
    }
  }

  form: FormGroup = this.formBuilder.group({
    id: [null],
    percentageDiscount: ['', Validators.nullValidator],
    cashDiscount: ['', Validators.nullValidator],
  });

  ngOnInit(): void {
    if (this.productId !== 0) {
      this.productsService.getOne(this.productId).subscribe({
        next: (product: Product) => {
          this.form.patchValue(product);
        },
      });
    }

    this.loadingService.sendLoadingState(false);
  }

  get isValid(): boolean {
    return this.form.valid;
  }

  saveProductButton() {
    this.progressSpinnerService.show();
    const product = new ProductSave(this.form.value);
    if (this.productId) {
      this.productsService.edit(this.productId, product).subscribe({
        next: () => this.progressSpinnerService.hidden(),
        error: () => this.progressSpinnerService.hidden(),
      });
    }
  }
}
