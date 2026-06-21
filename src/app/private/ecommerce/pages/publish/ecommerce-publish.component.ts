import { HttpResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { KeyFilterModule } from 'primeng/keyfilter';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { RadioButtonModule } from 'primeng/radiobutton';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import {
  catchError,
  concatMap,
  debounceTime,
  distinctUntilChanged,
  finalize,
  forkJoin,
  from,
  map,
  of,
  switchMap,
  tap,
  toArray,
} from 'rxjs';

import { Gender } from '../../../../models/gender.interface';
import { Warehouse } from '../../../../models/warehouse.interface';
import { ApiService } from '../../../../services/api.service';
import { GendersService } from '../../../../services/genders.service';
import { LoadingService } from '../../../../services/loading.service';
import { WarehousesService } from '../../../../services/warehouse.service';
import { SharedModule } from '../../../../shared/shared.module';
import { showError, showSuccess } from '../../../../utils/notifications';
import { notifyWooCommerceSyncResult } from '../../../../utils/woo-commerce-sync-feedback';
import { ColorListResponse } from '../../../inventories/colors/models/colors.model';
import { ProductGalleryComponent } from '../../../inventories/products/components/product-gallery/product-gallery.component';
import { ProductSizeColorSave } from '../../../inventories/products/models/colors.interface';
import {
  Product,
  ProductListResponse,
  ProductSave,
} from '../../../inventories/products/models/products.model';
import { ProductSizeSave } from '../../../inventories/products/models/sizes.interface';
import { ProductSizeColorsService } from '../../../inventories/products/services/productColors.service';
import { ProductSizesService } from '../../../inventories/products/services/productSizes.service';
import { ProductsService } from '../../../inventories/products/services/products.service';
import { SizeListResponse } from '../../../inventories/sizes/models/sizes.model';
import {
  ProductWooCommerceService,
  ProductWooCommerceSyncResponse,
} from '../../services/product-woocommerce.service';

type ViewMode = 'search' | 'create';

interface CatalogColor {
  id: number;
  description: string;
}

interface CatalogSize {
  id: number;
  description: string;
}

interface VariantFormValue {
  sizeId: number | null;
  colorId: number | null;
  salePrice: string | number;
  minSalePrice: string | number;
  stock: number;
}

@Component({
  selector: 'app-ecommerce-publish',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    SharedModule,
    ButtonModule,
    CheckboxModule,
    RadioButtonModule,
    SelectButtonModule,
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

  @ViewChild('productGalleryRef')
  productGallery?: ProductGalleryComponent;

  products: Product[] = [];
  total = 0;
  limit = 10;
  page = 1;
  searchTerm = '';
  selectedProduct: Product | null = null;
  isSaving = false;
  isCreating = false;
  mediaCount = 0;

  viewMode: ViewMode = 'search';
  genders: Gender[] = [];
  warehouses: Warehouse[] = [];
  catalogSizes: CatalogSize[] = [];
  catalogColors: CatalogColor[] = [];

  readonly viewModeOptions = [
    { label: 'Buscar en almacén', value: 'search' as ViewMode },
    { label: 'Crear producto', value: 'create' as ViewMode },
  ];

  searchForm = this.formBuilder.group({
    search: [''],
  });

  createForm: FormGroup = this.formBuilder.group({
    name: ['', Validators.required],
    barcode: [''],
    description: [''],
    genderId: [null as number | null, Validators.required],
    warehouseId: [null as number | null, Validators.required],
    variants: this.formBuilder.array([this.buildVariantGroup()]),
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
    private readonly productSizesService: ProductSizesService,
    private readonly productSizeColorsService: ProductSizeColorsService,
    private readonly productWooCommerceService: ProductWooCommerceService,
    private readonly gendersService: GendersService,
    private readonly warehousesService: WarehousesService,
    private readonly apiService: ApiService,
    private readonly loadingService: LoadingService,
    private readonly messageService: MessageService,
  ) {}

  ngOnInit(): void {
    this.loadCatalogs();
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

  get variants(): FormArray {
    return this.createForm.get('variants') as FormArray;
  }

  variantGroup(index: number): FormGroup {
    return this.variants.at(index) as FormGroup;
  }

  buildVariantGroup(): FormGroup {
    return this.formBuilder.group({
      sizeId: [null as number | null, Validators.required],
      colorId: [null as number | null, Validators.required],
      salePrice: ['', Validators.required],
      minSalePrice: [''],
      stock: [0],
    });
  }

  addVariantRow(): void {
    this.variants.push(this.buildVariantGroup());
  }

  removeVariantRow(index: number): void {
    if (this.variants.length <= 1) {
      return;
    }
    this.variants.removeAt(index);
  }

  onViewModeChange(mode: ViewMode): void {
    this.viewMode = mode;
    if (mode === 'create') {
      this.selectedProduct = null;
    }
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

    this.viewMode = 'search';
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

  createProduct(): void {
    if (this.createForm.invalid || this.isCreating) {
      this.createForm.markAllAsTouched();
      return;
    }

    this.isCreating = true;
    const raw = this.createForm.getRawValue();
    const variants = (raw.variants ?? []) as VariantFormValue[];

    this.productsService
      .create(
        new ProductSave({
          name: raw.name,
          barcode: raw.barcode,
          description: raw.description,
          genderId: raw.genderId,
          warehouseId: raw.warehouseId,
          status: 'AVAILABLE',
        }),
      )
      .pipe(
        switchMap(response => {
          const productId = response.productId;
          return from(variants).pipe(
            concatMap(variant =>
              this.attachVariant(productId, variant, String(raw.barcode ?? '')),
            ),
            toArray(),
            map(() => productId),
          );
        }),
        switchMap(productId => this.productsService.getOne(productId)),
        finalize(() => {
          this.isCreating = false;
        }),
      )
      .subscribe({
        next: (product: Product) => {
          showSuccess(
            this.messageService,
            'Producto creado. Completa la publicación en WordPress abajo.',
          );
          this.viewMode = 'search';
          this.selectedProduct = product;
          this.mediaCount = product.media?.length ?? 0;
          this.publishForm.patchValue({
            isFeatured: false,
            isOnSale: false,
            percentageDiscount: '',
            cashDiscount: '',
            wooStatus: 'draft',
          });
          this.loadProducts();
        },
        error: (err: { error?: { message?: string } }) => {
          showError(
            this.messageService,
            err?.error?.message ?? 'No se pudo crear el producto.',
          );
        },
      });
  }

  saveAndSync(): void {
    if (!this.selectedProduct || this.publishForm.invalid || this.isSaving) {
      return;
    }

    const gallery = this.productGallery;
    if (!gallery) {
      showError(
        this.messageService,
        'La galería aún no está lista. Espera un momento e intenta de nuevo.',
      );
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

    gallery
      .uploadPendingIfAny(true)
      .pipe(
        switchMap(() => this.productsService.edit(productId, payload)),
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
        error: (err: { error?: { message?: string }; message?: string }) => {
          showError(
            this.messageService,
            err?.error?.message ??
              err?.message ??
              'No se pudo guardar, subir imágenes ni sincronizar el producto.',
          );
        },
      });
  }

  private attachVariant(
    productId: number,
    variant: VariantFormValue,
    productBarcode: string,
  ) {
    const sizeId = Number(variant.sizeId);
    const colorId = Number(variant.colorId);
    const salePrice = Number(variant.salePrice);
    const minSalePrice = Number(variant.minSalePrice || variant.salePrice);
    const stock = Number(variant.stock ?? 0);

    const sizePayload: ProductSizeSave = {
      barcode: productBarcode ? Number(productBarcode) || 0 : 0,
      stock,
      purchasePrice: 0,
      salePrice,
      minSalePrice,
    };

    const colorPayload: ProductSizeColorSave = { stock };

    return this.productSizesService.add(productId, sizeId, sizePayload).pipe(
      switchMap(() =>
        this.apiService.get<{ productSizeId: number }>(
          `products/${productId}/size/${sizeId}`,
        ),
      ),
      switchMap(res =>
        this.productSizeColorsService.add(
          res.productSizeId,
          colorId,
          colorPayload,
        ),
      ),
    );
  }

  private loadCatalogs(): void {
    forkJoin({
      genders: this.gendersService.getAll().pipe(catchError(() => of([] as Gender[]))),
      warehouses: this.warehousesService.getAll().pipe(catchError(() => of([] as Warehouse[]))),
      sizes: this.apiService
        .get<SizeListResponse>('sizes?limit=200&page=1')
        .pipe(catchError(() => of({ data: [], paginate: { total: 0, pages: 0 } }))),
      colors: this.apiService
        .get<ColorListResponse>('colors?limit=200&page=1')
        .pipe(catchError(() => of({ data: [], paginate: { total: 0, pages: 0 } }))),
    }).subscribe({
      next: ({ genders, warehouses, sizes, colors }) => {
        this.genders = genders;
        this.warehouses = warehouses;
        this.catalogSizes = (sizes.data ?? []).map(size => ({
          id: size.id,
          description: size.description,
        }));
        this.catalogColors = (colors.data ?? []).map(color => ({
          id: color.id,
          description: color.description,
        }));

        const defaultWarehouse =
          warehouses.find(w => w.id === 1) ?? warehouses[0] ?? null;
        const defaultGender = genders[0] ?? null;

        this.createForm.patchValue({
          warehouseId: defaultWarehouse?.id ?? null,
          genderId: defaultGender?.id ?? null,
        });
      },
      error: () => {
        showError(
          this.messageService,
          'No se pudieron cargar catálogos de tallas, colores o almacenes.',
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
