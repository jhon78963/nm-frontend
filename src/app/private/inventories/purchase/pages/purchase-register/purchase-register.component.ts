import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  HostListener,
  inject,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import {
  AutoComplete,
  AutoCompleteCompleteEvent,
  AutoCompleteModule,
  AutoCompleteSelectEvent,
} from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { DividerModule } from 'primeng/divider';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { PanelModule } from 'primeng/panel';
import { RippleModule } from 'primeng/ripple';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import {
  catchError,
  debounceTime,
  EMPTY,
  filter,
  finalize,
  forkJoin,
  map,
  merge,
  of,
  Subject,
  switchMap,
  tap,
} from 'rxjs';

import { Gender } from '../../../../../models/gender.interface';
import { Warehouse } from '../../../../../models/warehouse.interface';
import { GendersService } from '../../../../../services/genders.service';
import { WarehousesService } from '../../../../../services/warehouse.service';
import { showError, showSuccess } from '../../../../../utils/notifications';
import { Vendor } from '../../../../directory/vendors/models/vendors.model';
import { Product } from '../../../products/models/products.model';
import { ProductsService } from '../../../products/services/products.service';
import { Size } from '../../../sizes/models/sizes.model';
import { buildPurchaseBulkPayload } from '../../models/purchase-payload';
import {
  genTempId,
  ProductColorOption,
  ProductSizeOption,
  PurchaseBulkPayload,
  PurchaseDraftColorVariant,
  PurchaseLineFormValue,
  SizeTypeOption,
} from '../../models/purchase.models';
import type { PurchaseRegisterBulkResponse } from '../../models/purchases-list.model';
import { PurchaseCatalogService } from '../../services/purchase-catalog.service';
import {
  PurchaseRegisterDraftService,
  PurchaseRegisterDraftSnapshot,
} from '../../services/purchase-register-draft.service';
import { PurchaseService } from '../../services/purchase.service';

const LEGACY_DRAFT_STORAGE_KEYS = [
  'nm_purchase_register_draft_v2',
  'nm_purchase_register_draft_v1',
] as const;

@Component({
  selector: 'app-purchase-register',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    ToolbarModule,
    CardModule,
    ButtonModule,
    TableModule,
    AutoCompleteModule,
    DropdownModule,
    InputTextModule,
    InputNumberModule,
    CalendarModule,
    CheckboxModule,
    SelectButtonModule,
    DividerModule,
    RippleModule,
    ToastModule,
    PanelModule,
    DialogModule,
  ],
  templateUrl: './purchase-register.component.html',
  styleUrl: './purchase-register.component.scss',
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PurchaseRegisterComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly persistDraft$ = new Subject<void>();
  /** Evita escribir en memoria mientras se aplica un borrador (evita bucles). */
  private persistDraftEnabled = false;
  /** Si el usuario eligió proveedor de la lista: al editar el texto se limpia `vendorId`. */
  private supplierNameLockedForVendorId: string | null = null;

  readonly productSourceMode = [
    { label: 'Producto existente', value: true },
    { label: 'Producto nuevo', value: false },
  ];

  header = this.fb.group({
    supplierName: ['', Validators.required],
    vendorId: [null as number | null],
    documentNote: [''],
    registeredAt: [new Date(), Validators.required],
    warehouseId: [1, [Validators.required, Validators.min(1)]],
  });

  /** Borrador de talla: precios y barcode van aquí (padre). */
  lineDraft = this.fb.group({
    newProductName: ['', [Validators.maxLength(50)]],
    newProductGenderId: [null as number | null],
    /** Tipo de talla del catálogo (siempre primero; define el listado de tallas). */
    selectedSizeTypeId: [null as number | null],
    sizeNewToggle: [false],
    newSizeDescription: ['', [Validators.maxLength(25)]],
    colorNewToggle: [false],
    useColorVariant: [true],
    newColorDescription: ['', [Validators.maxLength(25)]],
    newColorHash: ['', [Validators.maxLength(25)]],
    selectedSizeId: [null as number | null],
    selectedColorId: [null as number | null],
    barcode: ['', [Validators.maxLength(32)]],
    purchasePrice: [0, [Validators.required, Validators.min(0)]],
    salePrice: [0, [Validators.min(0)]],
    minSalePrice: [0, [Validators.min(0)]],
    /** Cantidad por variante antes de “Añadir variante”. */
    variantQuantity: [1, [Validators.required, Validators.min(1)]],
    /** Si no hay variante por color: stock solo en `product_size`. */
    sizeOnlyQuantity: [1, [Validators.required, Validators.min(1)]],
    /** Cola temporal Sección 2 (rehidratar con clear + push, no solo patchValue). */
    draftColorQueue: this.fb.array<FormGroup>([]),
  });

  lines = this.fb.array<FormGroup>([]);

  /** Cola temporal de variantes (Sección 2), parte del `lineDraft` para persistencia fiel. */
  get draftColorQueue(): FormArray<FormGroup> {
    return this.lineDraft.get('draftColorQueue') as FormArray<FormGroup>;
  }

  genders: Gender[] = [];
  sizeTypes: SizeTypeOption[] = [];
  filteredProducts: Product[] = [];
  selectedProduct: Product | null = null;
  /** Tallas del catálogo para el tipo seleccionado (independiente del producto). */
  catalogSizes = signal<Size[]>([]);
  /** Pivot producto–talla cuando el producto ya existe (desde `colors/sizes`). */
  productPivotBySizeId = signal(new Map<number, ProductSizeOption>());
  colorOptions = signal<ProductColorOption[]>([]);
  useExistingProduct = signal(true);
  activeNewProductTempId: string | null = null;
  submitting = signal(false);
  lastPayloadJson = signal<string | null>(null);
  /** Modal para ver / copiar el JSON sin alargar la página. */
  jsonViewerVisible = signal(false);
  /** Total global reactivo (Sección 4). */
  totalEstimated = signal(0);
  /** Fila removida de la tabla mientras se corrige en el constructor. */
  isEditingLine = signal(false);

  warehouses: Warehouse[] = [];
  filteredVendors: Vendor[] = [];

  @ViewChild('colorSearchAc') colorSearchAc?: AutoComplete;

  /** Buscador rápido de colores (ngModel standalone; el alta es con Enter o clic). */
  colorCatalogSearch = '';
  filteredColorsForPicker: ProductColorOption[] = [];

  constructor(
    private readonly fb: FormBuilder,
    private readonly catalog: PurchaseCatalogService,
    private readonly purchaseApi: PurchaseService,
    private readonly purchaseDraft: PurchaseRegisterDraftService,
    private readonly gendersService: GendersService,
    private readonly warehousesService: WarehousesService,
    private readonly productsService: ProductsService,
    private readonly messageService: MessageService,
    private readonly router: Router,
  ) {}

  /** OnPush: refresca la vista tras mutaciones async fuera de signals. */
  private markViewForCheck(): void {
    this.cdr.markForCheck();
  }

  ngOnInit(): void {
    this.gendersService
      .getAll()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap(() => this.markViewForCheck()),
      )
      .subscribe({
        next: rows => {
          this.genders = rows;
        },
      });
    this.catalog
      .getSizeTypes()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap(() => this.markViewForCheck()),
      )
      .subscribe({
        next: rows => {
          this.sizeTypes = rows ?? [];
        },
      });
    this.warehousesService
      .getAll()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap(() => this.markViewForCheck()),
      )
      .subscribe({
        next: rows => {
          this.warehouses = rows ?? [];
        },
      });

    this.tryRestoreDraftFromMemory();

    this.header
      .get('supplierName')
      ?.valueChanges.pipe(
        takeUntilDestroyed(this.destroyRef),
        tap(() => this.markViewForCheck()),
      )
      .subscribe(val => {
        const lock = this.supplierNameLockedForVendorId;
        if (lock != null && String(val ?? '').trim() !== lock) {
          this.header.patchValue({ vendorId: null }, { emitEvent: false });
          this.supplierNameLockedForVendorId = null;
        }
      });
  }

  @HostListener('window:beforeunload')
  flushPurchaseDraftOnUnload(): void {
    if (this.persistDraftEnabled) {
      this.persistDraftInMemory();
    }
  }

  searchVendors(ev: AutoCompleteCompleteEvent): void {
    const q = (ev.query ?? '').trim();
    if (q.length < 2) {
      this.filteredVendors = [];
      return;
    }
    this.catalog
      .searchVendors(q, 20)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap(() => this.markViewForCheck()),
      )
      .subscribe({
        next: rows => {
          this.filteredVendors = rows ?? [];
        },
      });
  }

  onSupplierSelect(ev: AutoCompleteSelectEvent): void {
    const v = ev.value as Vendor | string | null | undefined;
    if (v && typeof v === 'object' && 'name' in v) {
      const row = v as Vendor & { id?: number };
      const id = Number(row.id);
      const nm = String(row.name ?? '').trim();
      if (Number.isFinite(id) && id > 0) {
        this.header.patchValue({ supplierName: nm, vendorId: id });
        this.supplierNameLockedForVendorId = nm;
      } else {
        this.header.patchValue({ supplierName: nm, vendorId: null });
        this.supplierNameLockedForVendorId = null;
      }
    }
  }

  searchProducts(ev: AutoCompleteCompleteEvent): void {
    const q = (ev.query ?? '').trim();
    if (q.length < 2) {
      this.filteredProducts = [];
      return;
    }
    this.catalog
      .searchProducts(q, 20, 1)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap(() => this.markViewForCheck()),
      )
      .subscribe({
        next: rows => {
          this.filteredProducts = rows;
        },
      });
  }

  onProductPicked(product: Product): void {
    this.colorOptions.set([]);
    this.colorCatalogSearch = '';
    this.filteredColorsForPicker = [];
    this.draftColorQueue.clear({ emitEvent: false });
    this.lineDraft.patchValue(
      {
        selectedSizeId: null,
        selectedColorId: null,
        sizeNewToggle: false,
        colorNewToggle: false,
      },
      { emitEvent: false },
    );
    forkJoin({
      sizes: this.catalog.getProductSizes(product.id),
      full: this.productsService
        .getOne(product.id)
        .pipe(catchError(() => of(product))),
    })
      .pipe(
        switchMap(({ sizes, full }) => {
          this.selectedProduct = full;
          this.filteredProducts = [full];
          const m = new Map<number, ProductSizeOption>();
          for (const r of sizes ?? []) {
            m.set(r.id, r);
          }
          this.productPivotBySizeId.set(m);

          const types = full.sizeTypeId ?? [];
          const firstType =
            Array.isArray(types) && types.length > 0 ? Number(types[0]) : null;

          if (firstType != null && Number.isFinite(firstType) && firstType > 0) {
            this.lineDraft.patchValue(
              { selectedSizeTypeId: firstType },
              { emitEvent: false },
            );
            return this.catalog.getSizesBySizeType(firstType).pipe(
              catchError(() => of([] as Size[])),
            );
          }

          this.lineDraft.patchValue(
            { selectedSizeTypeId: null },
            { emitEvent: false },
          );
          this.catalogSizes.set([]);
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef),
        tap(() => this.markViewForCheck()),
      )
      .subscribe({
        next: rows => {
          if (rows != null) {
            this.catalogSizes.set(rows ?? []);
          }
          this.refreshColorsAfterSizeChange();
          this.requestPersistDraft();
        },
        error: () => {
          this.selectedProduct = product;
          this.filteredProducts = [product];
          this.productPivotBySizeId.set(new Map());
          this.requestPersistDraft();
        },
      });
  }

  clearProductSelection(): void {
    this.selectedProduct = null;
    this.filteredProducts = [];
    this.productPivotBySizeId.set(new Map());
    this.colorOptions.set([]);
    this.colorCatalogSearch = '';
    this.filteredColorsForPicker = [];
    this.draftColorQueue.clear({ emitEvent: false });
    this.lineDraft.patchValue(
      {
        selectedSizeId: null,
        selectedColorId: null,
      },
      { emitEvent: false },
    );
    this.refreshColorsAfterSizeChange();
    this.requestPersistDraft();
  }

  clearDraftVariants(): void {
    this.draftColorQueue.clear({ emitEvent: false });
    this.colorCatalogSearch = '';
    this.filteredColorsForPicker = [];
    this.requestPersistDraft();
  }

  /** Rellena precios/barcode desde el pivot producto–talla si existe. */
  applyPricesFromSelectedSize(): void {
    const draft = this.lineDraft.getRawValue();
    if (draft.sizeNewToggle || !draft.selectedSizeId) {
      return;
    }
    const merged = this.getMergedSizeOption(draft.selectedSizeId);
    if (!merged) {
      return;
    }
    this.lineDraft.patchValue(
      {
        barcode: merged.barcode ?? '',
        purchasePrice: merged.purchasePrice ?? 0,
        salePrice: merged.salePrice ?? 0,
        minSalePrice: merged.minSalePrice ?? 0,
      },
      { emitEvent: false },
    );
  }

  private getMergedSizeOption(sizeId: number | null): ProductSizeOption | null {
    if (sizeId == null) {
      return null;
    }
    const cat = this.catalogSizes().find(s => s.id === sizeId);
    const pivot = this.productPivotBySizeId().get(sizeId);
    if (!cat && !pivot) {
      return null;
    }
    return {
      id: sizeId,
      description: cat?.description ?? pivot?.description ?? '',
      productSizeId: pivot?.productSizeId,
      stock: pivot?.stock,
      barcode: pivot?.barcode,
      purchasePrice: pivot?.purchasePrice,
      salePrice: pivot?.salePrice,
      minSalePrice: pivot?.minSalePrice,
    };
  }

  /** Texto en dropdown de tallas: stock y si la talla ya existe en el producto. */
  catalogSizeLabel(size: Size): string {
    const base = (size.description ?? '').trim() || `Talla #${size.id}`;
    if (!this.useExistingProduct() || !this.selectedProduct?.id) {
      return base;
    }
    const merged = this.getMergedSizeOption(size.id);
    const parts: string[] = [base];
    if (merged?.stock != null && Number.isFinite(Number(merged.stock))) {
      parts.push(`stock ${merged.stock}`);
    }
    if (merged?.productSizeId != null && merged.productSizeId > 0) {
      parts.push('en producto');
    } else {
      parts.push('sin fila en producto aún');
    }
    return parts.join(' · ');
  }

  /**
   * Producto existente + talla del catálogo → colores ya ligados a esa talla.
   * Producto nuevo + talla del catálogo → colores del catálogo global (como las tallas).
   */
  canPickExistingColors(): boolean {
    const draft = this.lineDraft.getRawValue();
    if (draft.sizeNewToggle || !draft.selectedSizeId) {
      return false;
    }
    if (this.useExistingProduct()) {
      return !!this.selectedProduct?.id;
    }
    return true;
  }

  showColorCatalogPick(): boolean {
    const draft = this.lineDraft.getRawValue();
    return !!(
      draft.useColorVariant &&
      this.canPickExistingColors() &&
      !draft.colorNewToggle
    );
  }

  showNewColorFields(): boolean {
    const draft = this.lineDraft.getRawValue();
    if (!draft.useColorVariant) {
      return false;
    }
    return !this.canPickExistingColors() || !!draft.colorNewToggle;
  }

  onSizeTypeChosen(): void {
    this.clearDraftVariants();
    const typeId = this.lineDraft.get('selectedSizeTypeId')?.value;
    this.lineDraft.patchValue(
      { selectedSizeId: null, selectedColorId: null },
      { emitEvent: false },
    );
    this.colorOptions.set([]);
    if (!typeId) {
      this.catalogSizes.set([]);
      return;
    }
    this.catalog
      .getSizesBySizeType(Number(typeId))
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap(() => this.markViewForCheck()),
      )
      .subscribe({
        next: rows => {
          this.catalogSizes.set(rows ?? []);
        },
      });
  }

  onCatalogSizeChosen(): void {
    const sizeId = this.lineDraft.get('selectedSizeId')?.value;
    if (sizeId == null) {
      this.refreshColorsAfterSizeChange();
      return;
    }
    const draft = this.lineDraft.getRawValue();
    if (!draft.sizeNewToggle) {
      const merged = this.getMergedSizeOption(Number(sizeId));
      const hasRowInProduct =
        merged != null &&
        merged.productSizeId != null &&
        merged.productSizeId > 0;
      if (hasRowInProduct) {
        this.applyPricesFromSelectedSize();
      }
    }
    this.refreshColorsAfterSizeChange();
  }

  private refreshColorsAfterSizeChange(): void {
    const draft = this.lineDraft.getRawValue();
    const productId = this.selectedProduct?.id;
    const useExisting = this.useExistingProduct();

    if (draft.sizeNewToggle || !draft.selectedSizeId) {
      this.colorOptions.set([]);
      this.lineDraft.patchValue(
        { selectedColorId: null },
        { emitEvent: false },
      );
      return;
    }

    if (useExisting && productId) {
      this.catalog
        .getColors(productId, draft.selectedSizeId)
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          tap(() => this.markViewForCheck()),
        )
        .subscribe({
          next: rows => {
            this.colorOptions.set(rows ?? []);
            this.lineDraft.patchValue(
              { selectedColorId: null },
              { emitEvent: false },
            );
          },
        });
      return;
    }

    if (!useExisting) {
      this.catalog
        .getColorsCatalogAll()
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          tap(() => this.markViewForCheck()),
        )
        .subscribe({
          next: rows => {
            this.colorOptions.set(rows ?? []);
            this.lineDraft.patchValue(
              { selectedColorId: null },
              { emitEvent: false },
            );
          },
        });
      return;
    }

    this.colorOptions.set([]);
    this.lineDraft.patchValue({ selectedColorId: null }, { emitEvent: false });
  }

  onSizeNewToggleChange(): void {
    this.clearDraftVariants();
    const on = !!this.lineDraft.get('sizeNewToggle')?.value;
    if (on) {
      this.lineDraft.patchValue(
        {
          selectedSizeId: null,
          colorNewToggle: true,
          selectedColorId: null,
        },
        { emitEvent: false },
      );
      this.colorOptions.set([]);
    } else {
      this.lineDraft.patchValue(
        {
          colorNewToggle: false,
          newColorDescription: '',
          newColorHash: '',
        },
        { emitEvent: false },
      );
      this.refreshColorsAfterSizeChange();
    }
  }

  toggleProductSource(isExisting: boolean): void {
    this.useExistingProduct.set(isExisting);
    this.activeNewProductTempId = null;
    this.clearDraftVariants();
    if (isExisting) {
      this.lineDraft.patchValue({
        newProductName: '',
        newProductGenderId: null,
        sizeNewToggle: false,
      });
    } else {
      this.clearProductSelection();
      this.catalogSizes.set([]);
      this.lineDraft.patchValue(
        {
          sizeNewToggle: false,
          selectedSizeTypeId: null,
          selectedSizeId: null,
          selectedColorId: null,
          useColorVariant: true,
        },
        { emitEvent: false },
      );
    }
  }

  removeDraftVariant(index: number): void {
    this.draftColorQueue.removeAt(index);
    this.requestPersistDraft();
  }

  /** Suma de cantidades en la cola de variantes (panel Colores — Stock). */
  draftColorsQuantitySum(): number {
    let sum = 0;
    for (const g of this.draftColorQueue.controls) {
      sum += Number(g.get('quantity')?.value) || 0;
    }
    return sum;
  }

  onColorSearchComplete(ev: AutoCompleteCompleteEvent): void {
    const q = (ev.query ?? '').trim().toLowerCase();
    const opts = this.colorOptions();
    if (!q) {
      this.filteredColorsForPicker = opts.slice(0, 50);
      return;
    }
    this.filteredColorsForPicker = opts
      .filter(c => c.description.toLowerCase().includes(q))
      .slice(0, 60);
  }

  onCatalogColorAutoSelect(ev: AutoCompleteSelectEvent): void {
    const opt = ev.value as ProductColorOption | null;
    if (!opt?.id) {
      return;
    }
    this.addCatalogColorToQueue(opt, 1);
    this.colorCatalogSearch = '';
    this.filteredColorsForPicker = [];
    this.scheduleFocusColorSearch();
  }

  onColorSearchKeydown(ev: KeyboardEvent): void {
    if (ev.key !== 'Enter') {
      return;
    }
    const q = this.colorCatalogSearch.trim().toLowerCase();
    if (!q) {
      return;
    }
    const opts = this.colorOptions();
    const exact = opts.find(c => c.description.trim().toLowerCase() === q);
    const single =
      this.filteredColorsForPicker.length === 1
        ? this.filteredColorsForPicker[0]
        : null;
    const pick = exact ?? single;
    if (!pick?.id) {
      return;
    }
    ev.preventDefault();
    ev.stopPropagation();
    this.addCatalogColorToQueue(pick, 1);
    this.colorCatalogSearch = '';
    this.filteredColorsForPicker = [];
    this.scheduleFocusColorSearch();
  }

  private scheduleFocusColorSearch(): void {
    queueMicrotask(() => {
      const ac = this.colorSearchAc as unknown as {
        focusInput?: () => void;
        inputEL?: { nativeElement?: HTMLElement };
      };
      ac?.focusInput?.();
      ac?.inputEL?.nativeElement?.focus();
    });
  }

  private addCatalogColorToQueue(opt: ProductColorOption, qty: number): void {
    if (
      this.draftQueueRawRows().some(
        r => r.colorMode === 'existing' && r.colorId === opt.id,
      )
    ) {
      showError(this.messageService, 'Ese color ya está en la lista.');
      this.scheduleFocusColorSearch();
      return;
    }
    const safeQty = !Number.isFinite(qty) || qty < 1 ? 1 : Math.floor(qty);
    const entry: PurchaseDraftColorVariant = {
      id: genTempId('dv'),
      displayLabel: opt.description,
      colorMode: 'existing',
      colorId: opt.id,
      colorTempId: null,
      colorHash: null,
      quantity: safeQty,
    };
    this.draftColorQueue.push(
      this.createDraftColorQueueGroup(
        entry as unknown as Record<string, unknown>,
      ),
    );
    this.requestPersistDraft();
  }

  private normalizeNewProductKey(
    name: string,
    genderId: number | null,
  ): string {
    return `${String(name).trim().toLowerCase()}|${genderId ?? ''}`;
  }

  /**
   * Varias filas con el mismo nombre + género comparten un `productTempId`
   * (un solo producto nuevo en `catalogUpserts`).
   */
  private resolveNewProductTempId(
    name: string,
    genderId: number | null,
  ): string {
    const key = this.normalizeNewProductKey(name, genderId);
    for (const ctrl of this.lines.controls) {
      const raw = ctrl.getRawValue() as Record<string, unknown>;
      if (raw['productMode'] !== 'new') {
        continue;
      }
      const rowKey = this.normalizeNewProductKey(
        String(raw['productName'] ?? ''),
        raw['productGenderId'] != null ? Number(raw['productGenderId']) : null,
      );
      if (rowKey === key && raw['productTempId']) {
        return String(raw['productTempId']);
      }
    }
    return genTempId('p');
  }

  addDraftVariant(): void {
    if (this.useExistingProduct() && !this.selectedProduct?.id) {
      showError(
        this.messageService,
        'Primero elegí un producto existente antes de agregar variantes de color.',
      );
      return;
    }
    const draft = this.lineDraft.getRawValue();
    const qty = Number(draft.variantQuantity) || 0;
    if (qty < 1) {
      showError(
        this.messageService,
        'La cantidad de la variante debe ser al menos 1.',
      );
      return;
    }
    const forceNewColor =
      !!draft.colorNewToggle || !this.canPickExistingColors();

    let colorMode: 'existing' | 'new';
    let colorId: number | null;
    let colorTempId: string | null;
    let colorHash: string | null;
    let displayLabel: string;

    if (forceNewColor) {
      if (!draft.newColorDescription?.trim()) {
        showError(
          this.messageService,
          'Escribí el nombre del color (solo si no existe en el catálogo y lo estás creando ahora).',
        );
        return;
      }
      colorMode = 'new';
      colorId = null;
      colorTempId = genTempId('c');
      colorHash = draft.newColorHash?.trim() || null;
      displayLabel = draft.newColorDescription.trim();
    } else {
      if (draft.selectedColorId == null) {
        showError(
          this.messageService,
          'Elegí un color del catálogo o usá el buscador arriba. Si no está en la lista, activá “Color nuevo en el sistema” y cargá nombre y hex.',
        );
        return;
      }
      const co = this.colorOptions().find(c => c.id === draft.selectedColorId);
      if (!co) {
        showError(this.messageService, 'Color no válido.');
        return;
      }
      if (
        this.draftQueueRawRows().some(
          r => r.colorMode === 'existing' && r.colorId === co.id,
        )
      ) {
        showError(this.messageService, 'Ese color ya está en la lista.');
        return;
      }
      colorMode = 'existing';
      colorId = co.id;
      colorTempId = null;
      colorHash = null;
      displayLabel = co.description;
    }

    const entry: PurchaseDraftColorVariant = {
      id: genTempId('dv'),
      displayLabel,
      colorMode,
      colorId,
      colorTempId,
      colorHash,
      quantity: qty,
    };
    this.draftColorQueue.push(
      this.createDraftColorQueueGroup(
        entry as unknown as Record<string, unknown>,
      ),
    );
    this.lineDraft.patchValue({ variantQuantity: 1 });
    showSuccess(this.messageService, 'Variante añadida a la lista.');
  }

  addLine(): void {
    const draft = this.lineDraft.getRawValue();
    const useExisting = this.useExistingProduct();

    if (useExisting && !this.selectedProduct) {
      showError(
        this.messageService,
        'Selecciona un producto o cambia a “Producto nuevo”.',
      );
      return;
    }
    if (!draft.selectedSizeTypeId) {
      showError(this.messageService, 'Selecciona el tipo de talla.');
      return;
    }
    if (!useExisting) {
      if (!draft.newProductName?.trim()) {
        showError(this.messageService, 'Indica el nombre del producto nuevo.');
        return;
      }
      if (!draft.newProductGenderId) {
        showError(
          this.messageService,
          'Selecciona género para el producto nuevo.',
        );
        return;
      }
    }

    let productMode: 'existing' | 'new';
    let productId: number | null;
    let productTempId: string | null;
    let productName: string;
    let productGenderId: number | null;

    if (useExisting) {
      productMode = 'existing';
      productId = this.selectedProduct!.id;
      productTempId = null;
      productName = this.selectedProduct!.name;
      productGenderId = null;
    } else {
      productMode = 'new';
      productId = null;
      productTempId = this.resolveNewProductTempId(
        (draft.newProductName ?? '').trim(),
        draft.newProductGenderId,
      );
      this.activeNewProductTempId = productTempId;
      productName = (draft.newProductName ?? '').trim();
      productGenderId = draft.newProductGenderId;
    }

    let sizeMode: 'existing' | 'new';
    let sizeId: number | null;
    let sizeTempId: string | null;
    let sizeLabel: string;
    let sizeTypeId: number | null;
    let productSizeId: number | null;

    const sizeTypeIdForLine = Number(draft.selectedSizeTypeId);

    if (draft.sizeNewToggle) {
      if (!draft.newSizeDescription?.trim()) {
        showError(
          this.messageService,
          'Escribe la descripción de la talla nueva.',
        );
        return;
      }
      sizeMode = 'new';
      sizeId = null;
      sizeTempId = genTempId('s');
      sizeLabel = draft.newSizeDescription.trim();
      sizeTypeId = sizeTypeIdForLine;
      productSizeId = null;
    } else {
      if (!draft.selectedSizeId) {
        showError(
          this.messageService,
          'Selecciona una talla del catálogo o usa “Talla no figura en el catálogo”.',
        );
        return;
      }
      const merged = this.getMergedSizeOption(draft.selectedSizeId);
      if (!merged) {
        showError(
          this.messageService,
          'Talla no válida para el tipo seleccionado.',
        );
        return;
      }
      sizeMode = 'existing';
      sizeId = merged.id;
      sizeTempId = null;
      sizeLabel = merged.description ?? '';
      sizeTypeId = sizeTypeIdForLine;
      productSizeId = merged.productSizeId ?? null;
    }

    const variants = this.draftQueueRawRows();
    let colorRows: {
      displayLabel: string;
      colorId: number | null;
      colorTempId: string | null;
      colorHash: string | null;
      quantity: number;
    }[] = [];

    if (draft.useColorVariant) {
      if (variants.length === 0) {
        showError(
          this.messageService,
          'Añade al menos una variante de color con “Añadir variante”.',
        );
        return;
      }
      colorRows = variants.map(v => ({
        displayLabel: v.displayLabel,
        colorId: v.colorId,
        colorTempId: v.colorTempId,
        colorHash: v.colorHash,
        quantity: v.quantity,
      }));
    } else {
      const sq = Number(draft.sizeOnlyQuantity) || 0;
      if (sq < 1) {
        showError(
          this.messageService,
          'Indica la cantidad a ingresar a nivel talla.',
        );
        return;
      }
      colorRows = [
        {
          displayLabel: '— (solo talla)',
          colorId: null,
          colorTempId: null,
          colorHash: null,
          quantity: sq,
        },
      ];
    }

    const pPrice = Number(draft.purchasePrice) || 0;
    const sumQty = colorRows.reduce((a, c) => a + (Number(c.quantity) || 0), 0);
    const subtotal = Math.round(sumQty * pPrice * 100) / 100;

    const colorsArr = this.fb.array<FormGroup>([]);
    for (const c of colorRows) {
      colorsArr.push(
        this.fb.group({
          _rowKey: [genTempId('kc')],
          displayLabel: [c.displayLabel],
          colorId: [c.colorId],
          colorTempId: [c.colorTempId],
          colorHash: [c.colorHash],
          quantity: [c.quantity, [Validators.required, Validators.min(1)]],
        }),
      );
    }

    const lineGroup = this.fb.group({
      lineId: [genTempId('l')],
      productName: [productName],
      sizeLabel: [sizeLabel],
      productMode: [productMode],
      productId: [productId],
      productTempId: [productTempId],
      productGenderId: [productGenderId],
      sizeMode: [sizeMode],
      sizeId: [sizeId],
      sizeTempId: [sizeTempId],
      sizeTypeId: [sizeTypeId],
      productSizeId: [productSizeId],
      barcode: [draft.barcode?.trim() || null],
      purchasePrice: [pPrice, [Validators.required, Validators.min(0)]],
      salePrice: [Number(draft.salePrice) || 0, [Validators.min(0)]],
      minSalePrice: [Number(draft.minSalePrice) || 0, [Validators.min(0)]],
      colors: colorsArr,
      subtotal: [{ value: subtotal, disabled: true }],
    });

    this.bindLineTotals(lineGroup);
    this.lines.push(lineGroup);
    this.recalcGrandTotal();
    this.resetConstructorAfterLineAdded();
    this.isEditingLine.set(false);
    showSuccess(
      this.messageService,
      'Fila agregada: talla con sus variantes de color.',
    );
  }

  /**
   * Tras agregar una fila: deja producto (y cabecera/proveedor) tal cual;
   * limpia solo talla elegida, precios/barcode y variantes de color del constructor.
   */
  private resetConstructorAfterLineAdded(): void {
    this.draftColorQueue.clear({ emitEvent: false });
    this.lineDraft.patchValue(
      {
        selectedSizeId: null,
        selectedColorId: null,
        sizeNewToggle: false,
        newSizeDescription: '',
        colorNewToggle: false,
        newColorDescription: '',
        newColorHash: '',
        barcode: '',
        purchasePrice: 0,
        salePrice: 0,
        minSalePrice: 0,
        variantQuantity: 1,
        sizeOnlyQuantity: 1,
      },
      { emitEvent: false },
    );
    this.refreshColorsAfterSizeChange();
    this.requestPersistDraft();
  }

  /** Subtotal de fila + total global al editar precio compra o cantidades de color (sin bucle por `subtotal`). */
  private bindLineTotals(lineGroup: FormGroup): void {
    const p = lineGroup.get('purchasePrice')!;
    const colors = lineGroup.get('colors') as FormArray<FormGroup>;
    const onChange = (): void => {
      this.recalcLineSubtotal(lineGroup);
      this.recalcGrandTotal();
      this.markViewForCheck();
    };
    merge(p.valueChanges, colors.valueChanges)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap(() => this.markViewForCheck()),
      )
      .subscribe(onChange);
    colors.controls.forEach(cg => {
      cg.get('quantity')!
        .valueChanges.pipe(
          takeUntilDestroyed(this.destroyRef),
          tap(() => this.markViewForCheck()),
        )
        .subscribe(onChange);
    });
    onChange();
  }

  private recalcLineSubtotal(lineGroup: FormGroup): void {
    const pr = Number(lineGroup.get('purchasePrice')?.value) || 0;
    const colors = lineGroup.get('colors') as FormArray<FormGroup>;
    let sum = 0;
    for (const cg of colors.controls) {
      sum += Number(cg.get('quantity')?.value) || 0;
    }
    lineGroup
      .get('subtotal')!
      .patchValue(Math.round(sum * pr * 100) / 100, { emitEvent: false });
  }

  recalcGrandTotal(): void {
    let t = 0;
    for (const g of this.lines.controls) {
      t += Number(g.get('subtotal')?.value) || 0;
    }
    this.totalEstimated.set(Math.round(t * 100) / 100);
  }

  lineColors(line: AbstractControl): FormArray<FormGroup> {
    return line.get('colors') as FormArray<FormGroup>;
  }

  trackLineColorKey(cg: AbstractControl): string {
    return String((cg as FormGroup).get('_rowKey')?.value ?? '');
  }

  colorsSummaryText(line: AbstractControl): string {
    const arr = this.lineColors(line);
    const parts: string[] = [];
    for (const g of arr.controls) {
      const label = g.get('displayLabel')?.value ?? '';
      const q = g.get('quantity')?.value ?? 0;
      parts.push(`${label}: ${q} ud`);
    }
    return parts.join(', ') || '—';
  }

  removeLine(index: number): void {
    this.lines.removeAt(index);
    this.recalcGrandTotal();
  }

  editLine(index: number): void {
    const row = this.lines.at(index) as FormGroup | undefined;
    if (!row) {
      return;
    }
    const raw = row.getRawValue() as Record<string, unknown>;
    this.lines.removeAt(index);
    this.recalcGrandTotal();
    this.isEditingLine.set(true);

    this.clearDraftVariants();
    this.lineDraft.patchValue(
      {
        selectedColorId: null,
        colorNewToggle: false,
        newColorDescription: '',
        newColorHash: '',
        variantQuantity: 1,
        barcode: (raw['barcode'] as string) ?? '',
        purchasePrice: Number(raw['purchasePrice']) || 0,
        salePrice: Number(raw['salePrice']) || 0,
        minSalePrice: Number(raw['minSalePrice']) || 0,
      },
      { emitEvent: false },
    );

    const colorsRaw = (raw['colors'] as Record<string, unknown>[]) ?? [];
    const isSoloTalla =
      colorsRaw.length === 1 &&
      String(colorsRaw[0]?.['displayLabel'] ?? '').includes('solo talla');

    if (isSoloTalla) {
      this.lineDraft.patchValue({
        useColorVariant: false,
        sizeOnlyQuantity: Number(colorsRaw[0]?.['quantity']) || 1,
      });
    } else {
      this.lineDraft.patchValue({ useColorVariant: true });
      const draftVariants: PurchaseDraftColorVariant[] = colorsRaw.map(c => ({
        id: genTempId('dv'),
        displayLabel: String(c['displayLabel'] ?? ''),
        colorMode: c['colorId'] != null ? 'existing' : 'new',
        colorId: (c['colorId'] as number | null) ?? null,
        colorTempId: (c['colorTempId'] as string | null) ?? null,
        colorHash: (c['colorHash'] as string | null) ?? null,
        quantity: Number(c['quantity']) || 0,
      }));
      this.draftColorQueue.clear({ emitEvent: false });
      for (const dv of draftVariants) {
        this.draftColorQueue.push(
          this.createDraftColorQueueGroup(
            dv as unknown as Record<string, unknown>,
          ),
        );
      }
      const hasExisting = draftVariants.some(v => v.colorId != null);
      this.lineDraft.patchValue({ colorNewToggle: !hasExisting });
    }

    const sizeTypeId =
      raw['sizeTypeId'] != null ? Number(raw['sizeTypeId']) : null;
    const sizeMode = raw['sizeMode'] as string;
    this.lineDraft.patchValue(
      {
        selectedSizeTypeId: sizeTypeId,
        sizeNewToggle: sizeMode === 'new',
        newSizeDescription:
          sizeMode === 'new' ? String(raw['sizeLabel'] ?? '') : '',
        selectedSizeId: null,
      },
      { emitEvent: false },
    );

    if (sizeTypeId) {
      this.catalog
        .getSizesBySizeType(sizeTypeId)
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          tap(() => this.markViewForCheck()),
        )
        .subscribe({
          next: sizes => {
            this.catalogSizes.set(sizes ?? []);
            if (sizeMode === 'existing' && raw['sizeId'] != null) {
              this.lineDraft.patchValue(
                { selectedSizeId: Number(raw['sizeId']) },
                { emitEvent: false },
              );
            }
            this.finishEditLineProductHydration(raw);
          },
        });
    } else {
      this.catalogSizes.set([]);
      this.finishEditLineProductHydration(raw);
    }

    showSuccess(
      this.messageService,
      'Línea cargada para edición. Corregí y pulsá de nuevo “Agregar a la tabla”.',
    );
  }

  private finishEditLineProductHydration(raw: Record<string, unknown>): void {
    const mode = raw['productMode'] as string;
    if (mode === 'existing' && raw['productId'] != null) {
      this.useExistingProduct.set(true);
      this.productsService
        .getOne(Number(raw['productId']))
        .pipe(
          switchMap((p: Product) => {
            this.selectedProduct = p;
            this.filteredProducts = [p];
            return this.catalog.getProductSizes(p.id);
          }),
          takeUntilDestroyed(this.destroyRef),
          tap(() => this.markViewForCheck()),
        )
        .subscribe({
          next: rows => {
            const m = new Map<number, ProductSizeOption>();
            for (const r of rows ?? []) {
              m.set(r.id, r);
            }
            this.productPivotBySizeId.set(m);
            this.refreshColorsAfterSizeChange();
          },
          error: () => {
            showError(
              this.messageService,
              'No se pudo cargar el producto de la línea.',
            );
          },
        });
    } else {
      this.useExistingProduct.set(false);
      this.selectedProduct = null;
      this.filteredProducts = [];
      this.productPivotBySizeId.set(new Map());
      this.lineDraft.patchValue(
        {
          newProductName: String(raw['productName'] ?? ''),
          newProductGenderId: (raw['productGenderId'] as number | null) ?? null,
        },
        { emitEvent: false },
      );
      this.activeNewProductTempId =
        (raw['productTempId'] as string | null) ?? null;
      this.refreshColorsAfterSizeChange();
    }
  }

  removeLineColorVariant(lineIndex: number, colorIndex: number): void {
    const line = this.lines.at(lineIndex);
    const arr = this.lineColors(line);
    if (arr.length <= 1) {
      showError(
        this.messageService,
        'La fila debe tener al menos una variante de color.',
      );
      return;
    }
    arr.removeAt(colorIndex);
    this.recalcLineSubtotal(line as FormGroup);
    this.recalcGrandTotal();
  }

  registerPurchase(): void {
    if (this.header.invalid) {
      this.header.markAllAsTouched();
      showError(
        this.messageService,
        'Completa la cabecera (proveedor y fecha).',
      );
      return;
    }
    if (this.lines.length === 0) {
      showError(this.messageService, 'Agrega al menos una línea al detalle.');
      return;
    }

    const nameTrim = String(this.header.value.supplierName ?? '').trim();
    const existingVid = this.header.value.vendorId;
    const ensureVendor$ =
      existingVid != null && Number(existingVid) > 0
        ? of(void 0)
        : this.catalog.resolveOrCreateVendor(nameTrim).pipe(
            tap(v => {
              const nm = String(v.name ?? nameTrim).trim();
              this.header.patchValue(
                { vendorId: v.id, supplierName: nm },
                { emitEvent: false },
              );
              this.supplierNameLockedForVendorId = nm;
            }),
            map(() => void 0),
          );

    this.submitting.set(true);
    ensureVendor$
      .pipe(
        switchMap(() => {
          const built = this.buildBulkPayload();
          if (!built) {
            showError(
              this.messageService,
              'Agrega líneas al detalle antes de registrar.',
            );
            return EMPTY;
          }
          this.lastPayloadJson.set(built.json);
          return this.purchaseApi.registerBulk(built.payload);
        }),
        catchError(err => {
          const msg =
            err?.error?.message ??
            err?.message ??
            'No se pudo crear el proveedor o registrar la compra. Revisá consola y JSON.';
          showError(this.messageService, msg);
          console.warn('[purchase:bulk]', err);
          return EMPTY;
        }),
        finalize(() => {
          this.submitting.set(false);
          this.markViewForCheck();
        }),
        takeUntilDestroyed(this.destroyRef),
        tap(() => this.markViewForCheck()),
      )
      .subscribe({
        next: (res: PurchaseRegisterBulkResponse) => {
          showSuccess(this.messageService, 'Ingreso registrado correctamente.');
          this.resetAll();
          const pid = res?.purchaseId;
          if (pid != null && Number(pid) > 0) {
            void this.router.navigate(['/inventories/purchase', pid]);
          }
        },
      });
  }

  copyPayload(): void {
    const t = this.lastPayloadJson();
    if (!t) {
      showError(
        this.messageService,
        'Generá el JSON con “Generar JSON” o abrí “Ver JSON” desde el detalle.',
      );
      return;
    }
    void navigator.clipboard.writeText(t).then(() => {
      showSuccess(this.messageService, 'JSON copiado al portapapeles.');
    });
  }

  /** Genera el payload y guarda el string formateado (toast + listo para copiar / modal). */
  previewPayload(): void {
    const built = this.buildBulkPayload();
    if (!built) {
      showError(this.messageService, 'Agrega líneas para generar el JSON.');
      return;
    }
    this.lastPayloadJson.set(built.json);
    showSuccess(
      this.messageService,
      'JSON generado. Usá “Ver JSON” para revisarlo o copiarlo.',
    );
  }

  /**
   * Arma cabecera + líneas como en `POST purchases/bulk`.
   */
  private buildBulkPayload(): {
    json: string;
    payload: PurchaseBulkPayload;
  } | null {
    if (this.lines.length === 0) {
      return null;
    }
    const rawLines = this.collectLinesForPayload();
    const payload = buildPurchaseBulkPayload(
      {
        supplierName: this.header.value.supplierName ?? '',
        vendorId: this.header.value.vendorId ?? null,
        documentNote: this.header.value.documentNote || null,
        registeredAt: this.header.value.registeredAt ?? new Date(),
        warehouseId: Number(this.header.value.warehouseId) || 1,
      },
      rawLines,
    );
    return { json: JSON.stringify(payload, null, 2), payload };
  }

  private collectLinesForPayload(): PurchaseLineFormValue[] {
    return this.lines.controls.map(g => {
      const v = g.getRawValue();
      const colors = (v.colors as Record<string, unknown>[]).map(c => ({
        displayLabel: String(c['displayLabel'] ?? ''),
        colorId: (c['colorId'] as number | null) ?? null,
        colorTempId: (c['colorTempId'] as string | null) ?? null,
        colorHash: (c['colorHash'] as string | null) ?? null,
        quantity: Number(c['quantity']) || 0,
        // _rowKey solo UI
      }));
      const sumQty = colors.reduce((a, c) => a + (Number(c.quantity) || 0), 0);
      const pr = Number(v.purchasePrice) || 0;
      const rawSub = Number(v.subtotal);
      const subtotal =
        Number.isFinite(rawSub) && rawSub > 0.00001
          ? rawSub
          : Math.round(sumQty * pr * 100) / 100;
      return {
        lineId: v.lineId,
        productName: v.productName,
        sizeLabel: v.sizeLabel,
        productMode: v.productMode,
        productId: v.productId,
        productTempId: v.productTempId,
        productGenderId: v.productGenderId,
        sizeMode: v.sizeMode,
        sizeId: v.sizeId,
        sizeTempId: v.sizeTempId,
        sizeTypeId: v.sizeTypeId,
        productSizeId: v.productSizeId,
        barcode: v.barcode,
        purchasePrice: Number(v.purchasePrice) || 0,
        salePrice: Number(v.salePrice) || 0,
        minSalePrice: Number(v.minSalePrice) || 0,
        subtotal,
        colors,
      };
    });
  }

  resetAll(): void {
    this.persistDraftEnabled = false;
    this.purchaseDraft.clear();
    this.lines.clear({ emitEvent: false });
    this.isEditingLine.set(false);
    this.totalEstimated.set(0);
    this.catalogSizes.set([]);
    this.productPivotBySizeId.set(new Map());
    this.supplierNameLockedForVendorId = null;
    this.header.patchValue(
      {
        supplierName: '',
        vendorId: null,
        documentNote: '',
        registeredAt: new Date(),
        warehouseId: 1,
      },
      { emitEvent: false },
    );
    this.lineDraft.reset(
      {
        newProductName: '',
        newProductGenderId: null,
        selectedSizeTypeId: null,
        sizeNewToggle: false,
        newSizeDescription: '',
        colorNewToggle: false,
        useColorVariant: true,
        newColorDescription: '',
        newColorHash: '',
        selectedSizeId: null,
        selectedColorId: null,
        barcode: '',
        purchasePrice: 0,
        salePrice: 0,
        minSalePrice: 0,
        variantQuantity: 1,
        sizeOnlyQuantity: 1,
      },
      { emitEvent: false },
    );
    this.draftColorQueue.clear({ emitEvent: false });
    this.clearProductSelection();
    this.clearDraftVariants();
    this.useExistingProduct.set(true);
    this.activeNewProductTempId = null;
    this.lastPayloadJson.set(null);
    this.persistDraftEnabled = true;
  }

  onUseColorVariantChange(): void {
    if (!this.lineDraft.get('useColorVariant')?.value) {
      this.clearDraftVariants();
    }
  }

  // ——— Borrador en memoria (solo mientras la SPA está abierta) ———

  private requestPersistDraft(): void {
    if (this.persistDraftEnabled) {
      this.persistDraft$.next();
    }
  }

  private wireDraftAutoSave(): void {
    merge(
      this.header.valueChanges,
      this.lineDraft.valueChanges,
      this.lines.valueChanges,
      this.persistDraft$,
    )
      .pipe(
        debounceTime(400),
        filter(() => this.persistDraftEnabled),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.persistDraftInMemory());
  }

  private buildDraftSnapshot(): PurchaseRegisterDraftSnapshot {
    const useExisting = this.useExistingProduct();
    return {
      version: 2,
      header: this.header.getRawValue() as Record<string, unknown>,
      lineDraft: this.lineDraft.getRawValue() as unknown as Record<
        string,
        unknown
      >,
      lines: this.lines.controls.map(
        c => (c as FormGroup).getRawValue() as Record<string, unknown>,
      ),
      useExistingProduct: useExisting,
      selectedProductId:
        useExisting && this.selectedProduct ? this.selectedProduct.id : null,
      activeNewProductTempId: this.activeNewProductTempId,
      isEditingLine: this.isEditingLine(),
    };
  }

  private persistDraftInMemory(): void {
    const snap = this.buildDraftSnapshot();
    const supplier = String(snap.header['supplierName'] ?? '').trim();
    const hasLines = snap.lines.length > 0;
    const dq = snap.lineDraft['draftColorQueue'];
    const hasVariants = Array.isArray(dq) && dq.length > 0;
    const ld = snap.lineDraft;
    const newName = String(ld['newProductName'] ?? '').trim();
    const hasSizeType =
      ld['selectedSizeTypeId'] != null && Number(ld['selectedSizeTypeId']) > 0;
    const hasCatalogSize =
      ld['selectedSizeId'] != null && Number(ld['selectedSizeId']) > 0;
    const hasPricesOrBarcode =
      Number(ld['purchasePrice']) > 0 ||
      Number(ld['salePrice']) > 0 ||
      Number(ld['minSalePrice']) > 0 ||
      !!String(ld['barcode'] ?? '').trim();
    const hasMeaningfulConstructor =
      hasVariants ||
      hasSizeType ||
      hasCatalogSize ||
      !!newName ||
      hasPricesOrBarcode ||
      snap.selectedProductId != null;

    if (!hasLines && !supplier && !hasMeaningfulConstructor) {
      this.purchaseDraft.clear();
      return;
    }

    this.purchaseDraft.save(snap);
  }

  /** Elimina borradores legacy en localStorage (hallazgo M5 — ya no se usan). */
  private purgeLegacyBrowserDraft(): void {
    try {
      for (const key of LEGACY_DRAFT_STORAGE_KEYS) {
        localStorage.removeItem(key);
      }
    } catch {
      /* ignore */
    }
  }

  private enablePersistDraft(): void {
    this.persistDraftEnabled = true;
  }

  private tryRestoreDraftFromMemory(): void {
    this.purgeLegacyBrowserDraft();

    const parsed = this.purchaseDraft.read();
    if (!parsed || parsed.version !== 2) {
      this.enablePersistDraft();
      this.wireDraftAutoSave();
      return;
    }

    this.persistDraftEnabled = false;

    const h = parsed.header ?? {};
    const vidRaw = h['vendorId'];
    const vendorId =
      vidRaw != null && vidRaw !== '' && Number(vidRaw) > 0
        ? Number(vidRaw)
        : null;
    const supName = String(h['supplierName'] ?? '').trim();
    this.header.patchValue(
      {
        supplierName: supName,
        vendorId,
        documentNote: String(h['documentNote'] ?? ''),
        registeredAt: h['registeredAt']
          ? new Date(String(h['registeredAt']))
          : new Date(),
        warehouseId:
          Number(h['warehouseId']) > 0 ? Number(h['warehouseId']) : 1,
      },
      { emitEvent: false },
    );
    this.supplierNameLockedForVendorId =
      vendorId != null && supName ? supName : null;

    this.applyLineDraftFromSnapshot(
      (parsed.lineDraft ?? {}) as Record<string, unknown>,
    );

    this.useExistingProduct.set(!!parsed.useExistingProduct);
    this.activeNewProductTempId = parsed.activeNewProductTempId ?? null;
    this.isEditingLine.set(!!parsed.isEditingLine);

    this.rebuildLinesFromSnapshot(parsed.lines ?? []);

    const afterCatalogSizes = (): void => {
      if (parsed.useExistingProduct && parsed.selectedProductId != null) {
        this.hydrateSelectedProductForDraft(parsed.selectedProductId, () => {
          this.enablePersistDraft();
          this.wireDraftAutoSave();
          showSuccess(
            this.messageService,
            'Se recuperó el borrador de esta sesión (cabecera, producto y líneas).',
          );
        });
      } else {
        this.selectedProduct = null;
        this.filteredProducts = [];
        this.productPivotBySizeId.set(new Map());
        this.colorOptions.set([]);
        this.refreshColorsAfterSizeChange();
        this.enablePersistDraft();
        this.wireDraftAutoSave();
        showSuccess(
          this.messageService,
          'Se recuperó el borrador de esta sesión.',
        );
      }
    };

    const typeId = this.lineDraft.get('selectedSizeTypeId')?.value;
    if (typeId) {
      this.catalog
        .getSizesBySizeType(Number(typeId))
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          tap(() => this.markViewForCheck()),
        )
        .subscribe({
          next: rows => {
            this.catalogSizes.set(rows ?? []);
            afterCatalogSizes();
          },
          error: () => {
            this.catalogSizes.set([]);
            afterCatalogSizes();
          },
        });
    } else {
      this.catalogSizes.set([]);
      afterCatalogSizes();
    }
  }

  private hydrateSelectedProductForDraft(
    productId: number,
    done: () => void,
  ): void {
    forkJoin({
      full: this.productsService.getOne(productId),
      sizes: this.catalog.getProductSizes(productId),
    })
      .pipe(
        switchMap(({ full, sizes }) => {
          this.selectedProduct = full;
          this.filteredProducts = [full];
          const m = new Map<number, ProductSizeOption>();
          for (const r of sizes ?? []) {
            m.set(r.id, r);
          }
          this.productPivotBySizeId.set(m);

          const draftType = this.lineDraft.get('selectedSizeTypeId')?.value;
          if (draftType != null && Number(draftType) > 0) {
            return of(void 0);
          }

          const types = full.sizeTypeId ?? [];
          const firstType =
            Array.isArray(types) && types.length > 0 ? Number(types[0]) : null;

          if (firstType != null && Number.isFinite(firstType) && firstType > 0) {
            this.lineDraft.patchValue(
              { selectedSizeTypeId: firstType },
              { emitEvent: false },
            );
            return this.catalog.getSizesBySizeType(firstType).pipe(
              tap(rows => this.catalogSizes.set(rows ?? [])),
              catchError(() => {
                this.catalogSizes.set([]);
                return of([]);
              }),
              map(() => void 0),
            );
          }

          return of(void 0);
        }),
        takeUntilDestroyed(this.destroyRef),
        tap(() => this.markViewForCheck()),
      )
      .subscribe({
        next: () => {
          this.refreshColorsAfterSizeChange();
          done();
        },
        error: () => {
          showError(
            this.messageService,
            'Borrador: no se pudo recargar el producto guardado.',
          );
          this.selectedProduct = null;
          this.filteredProducts = [];
          done();
        },
      });
  }

  private createDraftColorQueueGroup(row: Record<string, unknown>): FormGroup {
    const mode = row['colorMode'] === 'new' ? 'new' : 'existing';
    const qty = Number(row['quantity']);
    return this.fb.group({
      id: [String(row['id'] ?? genTempId('dv'))],
      displayLabel: [String(row['displayLabel'] ?? '')],
      colorMode: [mode as 'existing' | 'new'],
      colorId: [row['colorId'] != null ? Number(row['colorId']) : null],
      colorTempId: [(row['colorTempId'] as string | null) ?? null],
      colorHash: [(row['colorHash'] as string | null) ?? null],
      quantity: [
        !Number.isFinite(qty) || qty < 1 ? 1 : qty,
        [Validators.required, Validators.min(1)],
      ],
    });
  }

  private draftQueueRawRows(): PurchaseDraftColorVariant[] {
    return this.draftColorQueue.controls.map(c => {
      const v = (c as FormGroup).getRawValue() as Record<string, unknown>;
      return {
        id: String(v['id'] ?? ''),
        displayLabel: String(v['displayLabel'] ?? ''),
        colorMode: v['colorMode'] === 'new' ? 'new' : 'existing',
        colorId: v['colorId'] != null ? Number(v['colorId']) : null,
        colorTempId: (v['colorTempId'] as string | null) ?? null,
        colorHash: (v['colorHash'] as string | null) ?? null,
        quantity: Number(v['quantity']) || 0,
      };
    });
  }

  /**
   * Rehidrata la Sección 2 sin `patchValue` ciego sobre el `FormArray`:
   * vacía la cola, aplica escalares con coerción y vuelve a crear cada fila.
   */
  private applyLineDraftFromSnapshot(rawLineDraft: Record<string, unknown>): void {
    const qRaw = rawLineDraft['draftColorQueue'];
    const queueSnapshot: Record<string, unknown>[] = Array.isArray(qRaw)
      ? (qRaw as Record<string, unknown>[])
      : [];

    this.draftColorQueue.clear({ emitEvent: false });

    this.lineDraft.patchValue(
      {
        newProductName: String(rawLineDraft['newProductName'] ?? ''),
        newProductGenderId:
          rawLineDraft['newProductGenderId'] != null
            ? Number(rawLineDraft['newProductGenderId'])
            : null,
        selectedSizeTypeId:
          rawLineDraft['selectedSizeTypeId'] != null
            ? Number(rawLineDraft['selectedSizeTypeId'])
            : null,
        sizeNewToggle: !!rawLineDraft['sizeNewToggle'],
        newSizeDescription: String(rawLineDraft['newSizeDescription'] ?? ''),
        colorNewToggle: !!rawLineDraft['colorNewToggle'],
        useColorVariant: rawLineDraft['useColorVariant'] !== false,
        newColorDescription: String(rawLineDraft['newColorDescription'] ?? ''),
        newColorHash: String(rawLineDraft['newColorHash'] ?? ''),
        selectedSizeId:
          rawLineDraft['selectedSizeId'] != null
            ? Number(rawLineDraft['selectedSizeId'])
            : null,
        selectedColorId:
          rawLineDraft['selectedColorId'] != null
            ? Number(rawLineDraft['selectedColorId'])
            : null,
        barcode: String(rawLineDraft['barcode'] ?? ''),
        purchasePrice: Number(rawLineDraft['purchasePrice']) || 0,
        salePrice: Number(rawLineDraft['salePrice']) || 0,
        minSalePrice: Number(rawLineDraft['minSalePrice']) || 0,
        variantQuantity: Math.max(
          1,
          Number(rawLineDraft['variantQuantity']) || 1,
        ),
        sizeOnlyQuantity: Math.max(
          1,
          Number(rawLineDraft['sizeOnlyQuantity']) || 1,
        ),
      },
      { emitEvent: false },
    );

    for (const row of queueSnapshot) {
      this.draftColorQueue.push(this.createDraftColorQueueGroup(row));
    }

    this.syncConstructorUiAfterDraftRestore();
  }

  /**
   * Alinea señales / listas auxiliares con los booleanos restaurados (p-checkbox, bloques @if).
   */
  private syncConstructorUiAfterDraftRestore(): void {
    const draft = this.lineDraft.getRawValue();
    if (draft.sizeNewToggle) {
      this.colorOptions.set([]);
      return;
    }
  }

  private rebuildLinesFromSnapshot(rows: Record<string, unknown>[]): void {
    this.lines.clear({ emitEvent: false });
    for (const raw of rows) {
      const colorsRaw = (raw['colors'] as Record<string, unknown>[]) ?? [];
      const colorsArr = this.fb.array<FormGroup>([]);
      for (const c of colorsRaw) {
        colorsArr.push(
          this.fb.group({
            _rowKey: [String(c['_rowKey'] ?? genTempId('kc'))],
            displayLabel: [String(c['displayLabel'] ?? '')],
            colorId: [c['colorId'] != null ? Number(c['colorId']) : null],
            colorTempId: [(c['colorTempId'] as string | null) ?? null],
            colorHash: [(c['colorHash'] as string | null) ?? null],
            quantity: [
              Number(c['quantity']) || 1,
              [Validators.required, Validators.min(1)],
            ],
          }),
        );
      }

      const lineGroup = this.fb.group({
        lineId: [String(raw['lineId'] ?? genTempId('l'))],
        productName: [String(raw['productName'] ?? '')],
        sizeLabel: [String(raw['sizeLabel'] ?? '')],
        productMode: [raw['productMode'] ?? 'existing'],
        productId: [raw['productId'] != null ? Number(raw['productId']) : null],
        productTempId: [(raw['productTempId'] as string | null) ?? null],
        productGenderId: [
          raw['productGenderId'] != null
            ? Number(raw['productGenderId'])
            : null,
        ],
        sizeMode: [raw['sizeMode'] ?? 'existing'],
        sizeId: [raw['sizeId'] != null ? Number(raw['sizeId']) : null],
        sizeTempId: [(raw['sizeTempId'] as string | null) ?? null],
        sizeTypeId: [
          raw['sizeTypeId'] != null ? Number(raw['sizeTypeId']) : null,
        ],
        productSizeId: [
          raw['productSizeId'] != null ? Number(raw['productSizeId']) : null,
        ],
        barcode: [(raw['barcode'] as string | null) ?? null],
        purchasePrice: [
          Number(raw['purchasePrice']) || 0,
          [Validators.required, Validators.min(0)],
        ],
        salePrice: [Number(raw['salePrice']) || 0, [Validators.min(0)]],
        minSalePrice: [Number(raw['minSalePrice']) || 0, [Validators.min(0)]],
        colors: colorsArr,
        subtotal: [{ value: Number(raw['subtotal']) || 0, disabled: true }],
      });

      this.bindLineTotals(lineGroup);
      this.lines.push(lineGroup);
    }
    this.recalcGrandTotal();
  }
}
