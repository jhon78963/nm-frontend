import { HttpResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { KeyFilterModule } from 'primeng/keyfilter';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { RadioButtonModule } from 'primeng/radiobutton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import {
  debounceTime,
  distinctUntilChanged,
  finalize,
  switchMap,
  tap,
} from 'rxjs';

import { LoadingService } from '../../../../services/loading.service';
import { SharedModule } from '../../../../shared/shared.module';
import { showError } from '../../../../utils/notifications';
import { notifyWooCommerceSyncResult } from '../../../../utils/woo-commerce-sync-feedback';
import { ProductGalleryComponent } from '../../../inventories/products/components/product-gallery/product-gallery.component';
import { Product, ProductListResponse, ProductSave } from '../../../inventories/products/models/products.model';
import { ProductsService } from '../../../inventories/products/services/products.service';
import { ProductWooCommerceService, ProductWooCommerceSyncResponse } from '../../services/product-woocommerce.service';

@Component({
  selector: 'app-ecommerce-publish',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SharedModule,
    ButtonModule,
    CheckboxModule,
    RadioButtonModule,
    TableModule,
    PaginatorModule,
    TagModule,
    ToastModule,
    TooltipModule,
    KeyFilterModule,
    ProductGalleryComponent,
  ],
  templateUrl: './ecommerce-publish.component.html',
  styleUrl: './ecommerce-publish.component.scss',
  providers: [MessageService],
})
export class EcommercePublishComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  products: Product[] = [];
  total = 0;
  limit = 10;
  page = 1;
  searchTerm = '';
  selectedProduct: Product | null = null;
  isSaving = false;
  mediaCount = 0;

  searchForm = this.formBuilder.group({
    search: [''],
  });

  publishForm: FormGroup = this.formBuilder.group({
    isFeatured: [false],
    isOnSale: [false],
    percentageDiscount: [''],
    cashDiscount: [''],
    wooStatus: ['draft', Validators.required],
  });

  readonly wooStatusOptions = [
    { label: 'Borrador', value: 'draft' },
    { label: 'Publicado', value: 'publish' },
  ];

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly productsService: ProductsService,
    private readonly productWooCommerceService: ProductWooCommerceService,
    private readonly loadingService: LoadingService,
    private readonly messageService: MessageService,
  ) {}

  ngOnInit(): void {
    this.loadProducts();

    this.searchForm
      .get('search')
      ?.valueChanges.pipe(
        debounceTime(500),
        distinctUntilChanged(),
        switchMap(term => {
          this.searchTerm = (term ?? '').trim();
          this.page = 1;
          return this.fetchProducts(this.limit, 1, this.searchTerm);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  clearFilter(): void {
    this.searchTerm = '';
    this.page = 1;
    this.searchForm.get('search')?.setValue('');
    this.loadProducts();
  }

  onPageChange(event: PaginatorState): void {
    this.limit = event.rows ?? 10;
    this.page = (event.page ?? 0) + 1;
    this.loadProducts();
  }

  selectProduct(product: Product): void {
    if (this.selectedProduct?.id === product.id) {
      this.selectedProduct = null;
      return;
    }

    this.selectedProduct = product;
    this.mediaCount = product.media?.length ?? 0;
    this.loadProductDetails(product.id);
  }

  isSelected(product: Product): boolean {
    return this.selectedProduct?.id === product.id;
  }

  mediaCountFor(product: Product): number {
    return product.media?.length ?? product.gallery?.length ?? 0;
  }

  onMediaCountChange(count: number): void {
    this.mediaCount = count;
  }

  saveAndSync(): void {
    if (!this.selectedProduct || this.publishForm.invalid || this.isSaving) {
      return;
    }

    this.isSaving = true;
    const productId = this.selectedProduct.id;
    const current = this.selectedProduct;
    const payload = new ProductSave({
      id: productId,
      name: current.name,
      barcode: current.barcode,
      description: current.description,
      status: current.status,
      genderId: current.genderId,
      warehouseId: current.warehouseId,
      percentageDiscount: this.publishForm.value.percentageDiscount || 0,
      cashDiscount: this.publishForm.value.cashDiscount || 0,
      isFeatured: !!this.publishForm.value.isFeatured,
      isOnSale: !!this.publishForm.value.isOnSale,
      wooStatus: this.publishForm.value.wooStatus as 'draft' | 'publish',
    });

    this.productsService
      .edit(productId, payload)
      .pipe(
        switchMap(() => this.productWooCommerceService.syncProduct(productId)),
        finalize(() => {
          this.isSaving = false;
        }),
      )
      .subscribe({
        next: (response: HttpResponse<ProductWooCommerceSyncResponse>) => {
          notifyWooCommerceSyncResult(
            this.messageService,
            response.body?.wooCommerceSync,
            'Configuración guardada.',
          );

          if (response.body?.wooProductId) {
            this.selectedProduct = {
              ...this.selectedProduct!,
              wooCommerce: {
                productId: response.body.wooProductId,
                lastSyncedAt: response.body.lastSyncedAt,
              },
            };
          }
        },
        error: (err: { error?: { message?: string } }) => {
          showError(
            this.messageService,
            err?.error?.message ?? 'No se pudo guardar ni sincronizar el producto.',
          );
        },
      });
  }

  private loadProducts(): void {
    this.fetchProducts(this.limit, this.page, this.searchTerm).subscribe();
  }

  private loadProductDetails(productId: number): void {
    this.productsService.getOne(productId).subscribe({
      next: (product: Product) => {
        this.selectedProduct = product;
        this.mediaCount = product.media?.length ?? 0;
        this.publishForm.patchValue({
          isFeatured: product.isFeatured ?? false,
          isOnSale: product.isOnSale ?? false,
          percentageDiscount: product.percentageDiscount ?? '',
          cashDiscount: product.cashDiscount ?? '',
          wooStatus: product.wooStatus ?? 'draft',
        });
      },
      error: () => {
        showError(
          this.messageService,
          'No se pudo cargar la configuración ecommerce del producto.',
        );
      },
    });
  }

  private fetchProducts(limit: number, page: number, search: string) {
    this.loadingService.sendLoadingState(true);
    return this.productsService.searchProducts(limit, page, search).pipe(
      tap((response: ProductListResponse) => {
        this.products = response.data ?? [];
        this.total = response.paginate?.total ?? 0;

        const selectedId = this.selectedProduct?.id;
        if (selectedId) {
          this.selectedProduct =
            this.products.find(p => p.id === selectedId) ??
            this.selectedProduct;
        }
      }),
      finalize(() => this.loadingService.sendLoadingState(false)),
    );
  }
}
