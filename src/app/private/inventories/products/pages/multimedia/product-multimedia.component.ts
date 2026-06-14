import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
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
  forkJoin,
  switchMap,
  tap,
} from 'rxjs';

import { LoadingService } from '../../../../../services/loading.service';
import { SharedModule } from '../../../../../shared/shared.module';
import { ProductGalleryComponent } from '../../components/product-gallery/product-gallery.component';
import { Product } from '../../models/products.model';
import { ProductMediaService } from '../../services/product-media.service';
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
  providers: [MessageService],
})
export class ProductMultimediaComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  products: Product[] = [];
  total = 0;
  limit = 10;
  page = 1;
  searchTerm = '';
  selectedProduct: Product | null = null;
  thumbUrls = new Map<number, string>();
  private mediaCountOverrides = new Map<number, number>();

  formGroup = new FormGroup({
    search: new FormControl<string>(''),
  });

  constructor(
    private readonly productsService: ProductsService,
    private readonly productMediaService: ProductMediaService,
    private readonly loadingService: LoadingService,
  ) {
    this.destroyRef.onDestroy(() => this.revokeThumbUrls());
  }

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
    const override = this.mediaCountOverrides.get(product.id);
    if (override !== undefined) {
      return override;
    }

    return product.media?.length ?? product.gallery?.length ?? 0;
  }

  thumbUrl(product: Product): string | null {
    return this.thumbUrls.get(product.id) ?? null;
  }

  onMediaCountChange(count: number): void {
    if (!this.selectedProduct) {
      return;
    }

    this.mediaCountOverrides.set(this.selectedProduct.id, count);
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

        this.loadThumbnails(this.products);
      }),
      finalize(() => this.loadingService.sendLoadingState(false)),
    );
  }

  private loadThumbnails(products: Product[]): void {
    this.revokeThumbUrls();

    const withMedia = products.filter(
      product => (product.media?.length ?? 0) > 0,
    );

    if (withMedia.length === 0) {
      return;
    }

    forkJoin(
      withMedia.map(product =>
        this.productMediaService
          .getPreviewBlob(product.id, product.media![0].id)
          .pipe(
            tap(blob =>
              this.thumbUrls.set(product.id, URL.createObjectURL(blob)),
            ),
          ),
      ),
    ).subscribe();
  }

  private revokeThumbUrls(): void {
    for (const url of this.thumbUrls.values()) {
      URL.revokeObjectURL(url);
    }
    this.thumbUrls.clear();
  }
}
