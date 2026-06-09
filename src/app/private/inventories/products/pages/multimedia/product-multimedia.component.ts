import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
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

import { LoadingService } from '../../../../../services/loading.service';
import { SharedModule } from '../../../../../shared/shared.module';
import { ProductGalleryComponent } from '../../components/product-gallery/product-gallery.component';
import { Product } from '../../models/products.model';
import { ProductsService } from '../../services/products.service';

@Component({
  selector: 'app-product-multimedia',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SharedModule,
    ButtonModule,
    TableModule,
    PaginatorModule,
    TagModule,
    ToastModule,
    TooltipModule,
    ProductGalleryComponent,
  ],
  templateUrl: './product-multimedia.component.html',
  styleUrl: './product-multimedia.component.scss',
})
export class ProductMultimediaComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  products: Product[] = [];
  total = 0;
  limit = 10;
  page = 1;
  searchTerm = '';
  selectedProduct: Product | null = null;

  formGroup = new FormGroup({
    search: new FormControl<string>(''),
  });

  constructor(
    private readonly productsService: ProductsService,
    private readonly loadingService: LoadingService,
  ) {}

  ngOnInit(): void {
    this.loadProducts();

    this.formGroup
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
    this.formGroup.get('search')?.setValue('');
    this.loadProducts();
  }

  onPageChange(event: PaginatorState): void {
    this.limit = event.rows ?? 10;
    this.page = (event.page ?? 0) + 1;
    this.loadProducts();
  }

  selectProduct(product: Product): void {
    this.selectedProduct =
      this.selectedProduct?.id === product.id ? null : product;
  }

  isSelected(product: Product): boolean {
    return this.selectedProduct?.id === product.id;
  }

  mediaCount(product: Product): number {
    return product.media?.length ?? product.gallery?.length ?? 0;
  }

  private loadProducts(): void {
    this.fetchProducts(this.limit, this.page, this.searchTerm).subscribe();
  }

  private fetchProducts(limit: number, page: number, search: string) {
    this.loadingService.sendLoadingState(true);
    return this.productsService.searchProducts(limit, page, search).pipe(
      tap(response => {
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
