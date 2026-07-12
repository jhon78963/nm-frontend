import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  AfterViewInit,
  Component,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DividerModule } from 'primeng/divider';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { RippleModule } from 'primeng/ripple';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { finalize, forkJoin, of, Subscription, switchMap } from 'rxjs';
import { Gender } from '../../../models/gender.interface';
import { Warehouse } from '../../../models/warehouse.interface';
import { GendersService } from '../../../services/genders.service';
import { ProgressSpinnerService } from '../../../services/progress-spinner.service';
import { WarehousesService } from '../../../services/warehouse.service';
import { SharedModule } from '../../../shared/shared.module';
import { AutocompleteResponse } from '../../../shared/models/autocomplete.interface';
import { Color } from '../colors/models/colors.model';
import { Product, ProductSave } from '../products/models/products.model';
import { ProductsService } from '../products/services/products.service';
import { InventoryReconciliationService } from './inventory-reconciliation.service';
import {
  ReconciliationColorDraft,
  ReconciliationDraft,
  ReconciliationProductApi,
  ReconciliationSizeDraft,
} from './models/inventory-reconciliation.model';

@Component({
  selector: 'app-inventory-reconciliation',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    RouterLink,
    ButtonModule,
    DialogModule,
    DividerModule,
    InputTextModule,
    InputNumberModule,
    ProgressSpinnerModule,
    ToastModule,
    TooltipModule,
    TagModule,
    RippleModule,
  ],
  providers: [MessageService],
  templateUrl: './inventory-reconciliation.component.html',
  styleUrl: './inventory-reconciliation.component.scss',
})
export class InventoryReconciliationComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  @ViewChild('searchInput')
  private searchInputRef?: ElementRef<HTMLInputElement>;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly inventoryService = inject(InventoryReconciliationService);
  private readonly productsService = inject(ProductsService);
  private readonly gendersService = inject(GendersService);
  private readonly warehousesService = inject(WarehousesService);
  private readonly progressSpinnerService = inject(ProgressSpinnerService);
  private readonly messageService = inject(MessageService);

  searchQuery = '';
  searching = false;
  loadingBundle = false;
  saving = false;

  searchResults: ReconciliationProductApi[] = [];
  searchResultsVisible = false;

  genders: Gender[] = [];
  warehouses: Warehouse[] = [];

  readonly statusOptions = [
    { id: 'AVAILABLE', description: 'Disponible' },
    { id: 'LIMITED_STOCK', description: 'Stock limitado' },
    { id: 'OUT_OF_STOCK', description: 'Fuera de stock' },
    { id: 'DISCONTINUED', description: 'Descontinuado' },
  ];

  productForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    genderId: [1, Validators.required],
    warehouseId: [1, Validators.required],
    barcode: [''],
    description: [''],
    purchasePrice: [null as number | null],
    salePrice: [null as number | null],
    minSalePrice: [null as number | null],
    status: ['AVAILABLE'],
    percentageDiscount: [''],
    cashDiscount: [''],
  });

  /** Última respuesta de GET /products/{id} para reconstruir ProductSave con campos no editables. */
  lastProductFromApi: Product | null = null;

  draft: ReconciliationDraft | null = null;
  private routeSub?: Subscription;
  private searchSub: Subscription | null = null;
  private saveSub: Subscription | null = null;
  private replaceColorSub: Subscription | null = null;
  private catalogSub: Subscription | null = null;

  replaceDialogVisible = false;
  replaceTargetColorId: number | null = null;
  catalogColors: Color[] = [];
  catalogColorsLoading = false;
  replacingVariantColor = false;
  replaceCtx: {
    productSizeId: number;
    sizeLabel: string;
    fromColorId: number;
    fromLabel: string;
    stock: number;
  } | null = null;

  addSizeDialogVisible = false;
  addSizeTarget: AutocompleteResponse | null = null;
  addingSize = false;

  addColorDialogVisible = false;
  addColorCtx: { productSizeId: number; sizeLabel: string } | null = null;
  addColorMode: 'catalog' | 'new' = 'catalog';
  addColorTargetId: number | null = null;
  addColorNewName = '';
  addColorInitialStock = 0;
  addingColor = false;

  ngOnInit(): void {
    this.gendersService.getAll().subscribe((g: Gender[]) => (this.genders = g));
    this.warehousesService
      .getAll()
      .subscribe((w: Warehouse[]) => (this.warehouses = w));

    this.routeSub = this.route.paramMap.subscribe(params => {
      const raw = params.get('productId');
      if (!raw) {
        this.clearWorkspace(false);
        return;
      }
      const id = Number(raw);
      if (!Number.isFinite(id) || id < 1) {
        return;
      }
      this.loadFullProduct(id);
    });
  }

  ngAfterViewInit(): void {
    this.focusSearch();
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
    this.searchSub?.unsubscribe();
    this.saveSub?.unsubscribe();
    this.replaceColorSub?.unsubscribe();
    this.catalogSub?.unsubscribe();
  }

  onSearchEnter(event: Event): void {
    event.preventDefault();
    this.runSearch();
  }

  focusSearch(): void {
    setTimeout(() => this.searchInputRef?.nativeElement?.focus(), 0);
  }

  runSearch(): void {
    const q = this.searchQuery.trim();
    if (!q || this.searching) {
      if (!q) {
        this.toast(
          'warn',
          'Escriba un nombre, ID o escanee un código de barras.',
        );
      }
      return;
    }

    this.searching = true;
    this.searchSub?.unsubscribe();
    this.searchSub = this.inventoryService
      .search(q)
      .pipe(finalize(() => (this.searching = false)))
      .subscribe({
        next: res => {
          const list = res.products ?? [];
          if (list.length === 0) {
            this.toast('warn', 'No se encontró ningún producto.');
            this.focusSearch();
            return;
          }

          if (list.length === 1) {
            this.openProduct(list[0].id);
            return;
          }

          this.searchResults = list;
          this.searchResultsVisible = true;
        },
        error: err => {
          this.toast('error', this.parseHttpError(err));
          this.focusSearch();
        },
      });
  }

  openProduct(id: number): void {
    this.searchResultsVisible = false;
    this.router.navigate(['/inventories/reconciliation', id], {
      replaceUrl: true,
    });
  }

  loadFullProduct(id: number): void {
    this.loadingBundle = true;
    forkJoin({
      meta: this.productsService.getOne(id),
      shelf: this.inventoryService.search(String(id)),
    })
      .pipe(finalize(() => (this.loadingBundle = false)))
      .subscribe({
        next: ({ meta, shelf }) => {
          const list = shelf.products ?? [];
          const inv = list.find(p => p.id === id) ?? list[0];
          if (!inv) {
            this.toast(
              'error',
              'No hay datos de inventario para este producto. Verifique el ID.',
            );
            return;
          }

          this.lastProductFromApi = meta;
          this.productForm.patchValue({
            name: meta.name ?? '',
            genderId: meta.genderId ?? 1,
            warehouseId: meta.warehouseId ?? 1,
            barcode: meta.barcode ?? '',
            description: meta.description ?? '',
            purchasePrice: meta.purchasePrice ?? null,
            salePrice: meta.salePrice ?? null,
            minSalePrice: meta.minSalePrice ?? null,
            status: this.normalizeStatus(meta.status),
            percentageDiscount: meta.percentageDiscount ?? '',
            cashDiscount: meta.cashDiscount ?? '',
          });

          this.applyProduct(inv);
          this.searchQuery =
            meta.name?.trim() ||
            (meta.barcode ? String(meta.barcode) : '') ||
            String(id);
        },
        error: err => {
          this.toast('error', this.parseHttpError(err));
        },
      });
  }

  colorStockSum(size: ReconciliationSizeDraft): number {
    return size.colors.reduce((acc, c) => acc + (Number(c.stock) || 0), 0);
  }

  hasColorBreakdown(size: ReconciliationSizeDraft): boolean {
    return size.colors.length > 0;
  }

  hasAnyShelfWarning(): boolean {
    return !!this.draft?.sizes.some(s => s.shelfInconsistentOnLoad);
  }

  saveAll(): void {
    if (!this.draft) {
      return;
    }
    this.markFormTouched();
    if (this.productForm.invalid) {
      this.toast(
        'warn',
        'Revise la sección Producto: nombre, género y tienda son obligatorios.',
      );
      return;
    }

    const id = this.draft.productId;
    const base = this.lastProductFromApi ?? ({} as Product);
    const v = this.productForm.getRawValue();
    const productPayload = new ProductSave({
      ...base,
      ...v,
      id,
    } as Product);

    if (!this.lastProductFromApi) {
      this.toast('error', 'Falta la ficha del producto; recargue la página.');
      return;
    }

    this.saving = true;
    this.saveSub?.unsubscribe();
    this.saveSub = this.productsService
      .edit(id, productPayload)
      .pipe(
        switchMap(() =>
          this.inventoryService.bulkUpdate(id, this.buildInventoryPayload()),
        ),
        finalize(() => (this.saving = false)),
      )
      .subscribe({
        next: () => {
          this.toast(
            'success',
            'Ficha del producto e inventario guardados correctamente.',
          );
          this.loadFullProduct(id);
          this.focusSearch();
        },
        error: err => {
          this.toast('error', this.parseHttpError(err));
        },
      });
  }

  clearProduct(navigate = true): void {
    this.clearWorkspace(navigate);
    this.focusSearch();
  }

  private clearWorkspace(navigate: boolean): void {
    this.draft = null;
    this.lastProductFromApi = null;
    this.productForm.reset({
      name: '',
      genderId: 1,
      warehouseId: 1,
      barcode: '',
      description: '',
      purchasePrice: null,
      salePrice: null,
      minSalePrice: null,
      status: 'AVAILABLE',
      percentageDiscount: '',
      cashDiscount: '',
    });
    this.searchQuery = '';
    this.searchResults = [];
    this.searchResultsVisible = false;
    this.replaceDialogVisible = false;
    this.replaceCtx = null;
    this.replaceTargetColorId = null;
    this.addSizeDialogVisible = false;
    this.addColorDialogVisible = false;
    this.catalogSub?.unsubscribe();
    this.replaceColorSub?.unsubscribe();
    if (navigate) {
      void this.router.navigate(['/inventories/reconciliation'], {
        replaceUrl: true,
      });
    }
  }

  private markFormTouched(): void {
    Object.keys(this.productForm.controls).forEach(k =>
      this.productForm.get(k)?.markAsTouched(),
    );
  }

  private buildInventoryPayload() {
    if (!this.draft) {
      return { sizes: [] };
    }
    const sizes = this.draft.sizes.map(s => {
      const prices = {
        purchasePrice: this.normalizeDraftPrice(s.purchasePrice),
        salePrice: this.normalizeDraftPrice(s.salePrice),
        minSalePrice: this.normalizeDraftPrice(s.minSalePrice),
      };
      if (s.colors.length > 0) {
        return {
          id: s.id,
          colors: s.colors.map(c => ({
            colorId: c.colorId,
            stock: Math.max(0, Math.trunc(Number(c.stock) || 0)),
          })),
          ...prices,
        };
      }
      return {
        id: s.id,
        stock: Math.max(0, Math.trunc(Number(s.masterStock) || 0)),
        ...prices,
      };
    });
    return { sizes };
  }

  private normalizeDraftPrice(v: unknown): number | null {
    if (v === null || v === undefined || v === '') {
      return null;
    }
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  trackBySizeId(_: number, s: ReconciliationSizeDraft): number {
    return s.id;
  }

  trackByColorId(_: number, c: { colorId: number }): number {
    return c.colorId;
  }

  get replaceColorDropdownOptions(): Color[] {
    const fromId = this.replaceCtx?.fromColorId;
    if (fromId == null) {
      return this.catalogColors;
    }
    return this.catalogColors.filter(c => c.id !== fromId);
  }

  openAddSizeDialog(): void {
    if (!this.draft || this.saving) {
      return;
    }
    this.addSizeTarget = null;
    this.addSizeDialogVisible = true;
  }

  closeAddSizeDialog(): void {
    this.addSizeDialogVisible = false;
    this.addSizeTarget = null;
  }

  onAddSizeSelected(item: AutocompleteResponse): void {
    this.addSizeTarget = item;
  }

  confirmAddSize(): void {
    const draft = this.draft;
    const size = this.addSizeTarget;
    if (!draft || !size?.id) {
      this.toast('warn', 'Seleccione una talla del catálogo.');
      return;
    }

    if (draft.sizes.some(s => s.sizeId === size.id)) {
      this.toast('warn', 'Esa talla ya está en el producto.');
      return;
    }

    const ref = draft.sizes[0];
    const v = this.productForm.getRawValue();
    this.addingSize = true;
    this.inventoryService
      .addSizeToProduct(draft.productId, size.id, {
        barcode: 0,
        stock: 0,
        purchasePrice: ref?.purchasePrice ?? v.purchasePrice ?? 0,
        salePrice: ref?.salePrice ?? v.salePrice ?? 0,
        minSalePrice: ref?.minSalePrice ?? v.minSalePrice ?? 0,
      })
      .pipe(finalize(() => (this.addingSize = false)))
      .subscribe({
        next: () => {
          this.toast('success', `Talla "${size.value}" agregada al producto.`);
          this.closeAddSizeDialog();
          this.loadFullProduct(draft.productId);
        },
        error: err => this.toast('error', this.parseHttpError(err)),
      });
  }

  openAddColorDialog(size: ReconciliationSizeDraft): void {
    if (!this.draft || this.saving) {
      return;
    }
    this.addColorCtx = {
      productSizeId: size.id,
      sizeLabel: size.sizeLabel,
    };
    this.addColorMode = 'catalog';
    this.addColorTargetId = null;
    this.addColorNewName = '';
    this.addColorInitialStock = 0;
    this.addColorDialogVisible = true;

    if (this.catalogColors.length === 0) {
      this.catalogColorsLoading = true;
      this.catalogSub?.unsubscribe();
      this.catalogSub = this.inventoryService.loadColorsCatalog().subscribe({
        next: rows => {
          this.catalogColors = rows ?? [];
          this.catalogColorsLoading = false;
        },
        error: err => {
          this.catalogColorsLoading = false;
          this.toast('error', this.parseHttpError(err));
        },
      });
    }
  }

  closeAddColorDialog(): void {
    this.addColorDialogVisible = false;
    this.addColorCtx = null;
    this.addColorTargetId = null;
    this.addColorNewName = '';
  }

  get addColorDropdownOptions(): Color[] {
    const size = this.draft?.sizes.find(
      s => s.id === this.addColorCtx?.productSizeId,
    );
    const used = new Set((size?.colors ?? []).map(c => c.colorId));
    return this.catalogColors.filter(c => !used.has(c.id));
  }

  confirmAddColor(): void {
    const draft = this.draft;
    const ctx = this.addColorCtx;
    if (!draft || !ctx) {
      return;
    }

    this.addingColor = true;
    const stock = Math.max(0, Math.trunc(Number(this.addColorInitialStock) || 0));

    const attachColor = (colorId: number) =>
      this.inventoryService
        .addColorToProductSize(ctx.productSizeId, colorId, { stock })
        .pipe(
          switchMap(() => {
            if (stock > 0) {
              return this.inventoryService.bulkUpdate(draft.productId, {
                sizes: [
                  {
                    id: ctx.productSizeId,
                    colors: [{ colorId, stock }],
                  },
                ],
              });
            }
            return of(null);
          }),
        );

    const colorId$ =
      this.addColorMode === 'new'
        ? this.inventoryService.resolveOrCreateColorId(this.addColorNewName)
        : this.addColorTargetId != null
          ? of(this.addColorTargetId)
          : of<number | null>(null);

    colorId$
      .pipe(
        switchMap((colorId: number | null) => {
          if (colorId == null || colorId < 1) {
            throw new Error('Seleccione un color o escriba uno nuevo.');
          }
          return attachColor(colorId);
        }),
        finalize(() => (this.addingColor = false)),
      )
      .subscribe({
        next: () => {
          this.toast('success', 'Color agregado a la talla.');
          this.closeAddColorDialog();
          this.loadFullProduct(draft.productId);
        },
        error: (err: unknown) => this.toast('error', this.parseHttpError(err)),
      });
  }

  openReplaceColorDialog(
    size: ReconciliationSizeDraft,
    color: ReconciliationColorDraft,
  ): void {
    if (this.replacingVariantColor || this.saving) {
      return;
    }
    this.replaceCtx = {
      productSizeId: size.id,
      sizeLabel: size.sizeLabel,
      fromColorId: color.colorId,
      fromLabel: color.description,
      stock: Math.max(0, Math.trunc(Number(color.stock) || 0)),
    };
    this.replaceTargetColorId = null;
    this.replaceDialogVisible = true;

    if (this.catalogColors.length > 0) {
      return;
    }
    this.catalogColorsLoading = true;
    this.catalogSub?.unsubscribe();
    this.catalogSub = this.inventoryService.loadColorsCatalog().subscribe({
      next: rows => {
        this.catalogColors = rows ?? [];
        this.catalogColorsLoading = false;
      },
      error: err => {
        this.catalogColorsLoading = false;
        this.toast('error', this.parseHttpError(err));
      },
    });
  }

  closeReplaceColorDialog(): void {
    this.replaceDialogVisible = false;
    this.replaceCtx = null;
    this.replaceTargetColorId = null;
  }

  confirmReplaceVariantColor(): void {
    const draft = this.draft;
    const ctx = this.replaceCtx;
    const toId = this.replaceTargetColorId;
    if (!draft || !ctx || toId == null) {
      this.toast('warn', 'Seleccione el color destino en el catálogo.');
      return;
    }
    if (toId === ctx.fromColorId) {
      this.toast('warn', 'Elija un color distinto al actual.');
      return;
    }

    this.replacingVariantColor = true;
    this.replaceColorSub?.unsubscribe();
    this.replaceColorSub = this.inventoryService
      .replaceVariantColor(draft.productId, ctx.productSizeId, {
        fromColorId: ctx.fromColorId,
        toColorId: toId,
      })
      .pipe(finalize(() => (this.replacingVariantColor = false)))
      .subscribe({
        next: res => {
          this.toast('success', res.message ?? 'Color actualizado.');
          if (res.product) {
            this.applyProduct(res.product as ReconciliationProductApi);
          }
          this.closeReplaceColorDialog();
        },
        error: err => {
          this.toast('error', this.parseHttpError(err));
        },
      });
  }

  private applyProduct(api: ReconciliationProductApi): void {
    this.draft = this.cloneProductToDraft(api);
  }

  private cloneProductToDraft(
    p: ReconciliationProductApi,
  ): ReconciliationDraft {
    const raw = JSON.parse(JSON.stringify(p)) as ReconciliationProductApi;
    return {
      productId: raw.id,
      name: raw.name ?? '',
      sku: raw.barcode ?? null,
      sizes: (raw.sizes ?? []).map(s => {
        const colors = (s.colors ?? []).map(c => ({
          colorId: c.colorId,
          description: c.description ?? `Color #${c.colorId}`,
          stock: Math.max(
            0,
            Math.trunc(
              Number(
                c.inventory?.available_quantity ??
                  (c as { stock?: number }).stock,
              ) || 0,
            ),
          ),
        }));
        const sumColors = colors.reduce((acc, c) => acc + c.stock, 0);
        const master = Math.max(
          0,
          Math.trunc(
            Number(
              s.inventory?.available_quantity ??
                (s as { stock?: number }).stock,
            ) || 0,
          ),
        );
        return {
          id: s.id,
          sizeId: s.sizeId,
          sizeLabel: s.size?.description ?? `Talla #${s.sizeId}`,
          barcode: s.barcode ?? null,
          masterStock: master,
          serverMasterStock: master,
          shelfInconsistentOnLoad: colors.length > 0 && sumColors !== master,
          purchasePrice: this.normalizeDraftPrice(s.purchasePrice),
          salePrice: this.normalizeDraftPrice(s.salePrice),
          minSalePrice: this.normalizeDraftPrice(s.minSalePrice),
          colors,
        };
      }),
    };
  }

  private normalizeStatus(status: unknown): string {
    if (typeof status === 'string' && status.trim()) {
      return status;
    }
    if (status && typeof status === 'object' && 'value' in status) {
      const v = (status as { value: unknown }).value;
      if (typeof v === 'string') {
        return v;
      }
    }
    return 'AVAILABLE';
  }

  private toast(
    severity: 'success' | 'error' | 'info' | 'warn',
    detail: string,
  ): void {
    const summary =
      severity === 'success'
        ? 'Listo'
        : severity === 'error'
          ? 'Error'
          : severity === 'warn'
            ? 'Atención'
            : 'Información';
    this.messageService.add({ severity, summary, detail, life: 8000 });
  }

  private parseHttpError(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      const body = err.error;

      if (typeof body === 'string' && body.trim()) {
        const shortened = body.length > 380 ? `${body.slice(0, 380)}…` : body;
        return shortened;
      }

      if (body && typeof body === 'object') {
        const o = body as Record<string, unknown>;
        if (typeof o['message'] === 'string' && o['message'].trim()) {
          return o['message'] as string;
        }
        const errors = o['errors'];
        if (errors && typeof errors === 'object') {
          const firstKey = Object.keys(errors as object)[0];
          const val = (errors as Record<string, unknown>)[firstKey];
          if (Array.isArray(val) && val.length > 0) {
            return String(val[0]);
          }
        }
      }

      if (err.message) {
        return err.message;
      }
      return `Error HTTP ${err.status ?? ''}`.trim();
    }
    return 'No se pudo completar la operación.';
  }
}
