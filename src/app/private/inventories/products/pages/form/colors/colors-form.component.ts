import { CommonModule } from '@angular/common';
import { Component, computed, OnInit, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { ColorPickerModule } from 'primeng/colorpicker';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DropdownModule } from 'primeng/dropdown';
import { DialogService } from 'primeng/dynamicdialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MessagesModule } from 'primeng/messages';
import { ProgressBarModule } from 'primeng/progressbar';
import { RippleModule } from 'primeng/ripple';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { catchError, concat, of } from 'rxjs';
import { showError, showSuccess } from '../../../../../../utils/notifications';
import { ColorsCreateFormComponent } from '../../../../colors/pages/form/colors.component';
import { Size } from '../../../../sizes/models/sizes.model';
import { ProductSizeColorSave } from '../../../models/colors.interface';
import { ProductSizeColorsService } from '../../../services/productColors.service';

type ProductSizeOption = Size & { stock?: number; productSizeId?: number };

type CatalogColorRow = Record<string, unknown> & {
  id: number;
  productSizeId?: number | null;
  variantAttached: boolean;
  stock: number;
  isExists?: boolean;
  description?: string;
};

@Component({
  selector: 'app-colors-form',
  standalone: true,
  imports: [
    ButtonModule,
    CheckboxModule,
    CommonModule,
    ConfirmDialogModule,
    DropdownModule,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    InputTextModule,
    RippleModule,
    ColorPickerModule,
    MessagesModule,
    RouterLink,
    SelectButtonModule,
    ProgressBarModule,
    TagModule,
    InputNumberModule,
    TooltipModule,
  ],
  templateUrl: './colors-form.component.html',
  styleUrl: './colors-form.component.scss',
  providers: [ConfirmationService, DialogService, MessageService],
})
export class ColorsFormComponent implements OnInit {
  productId: number = 0;
  sizes: ProductSizeOption[] = [];
  colors = signal<CatalogColorRow[]>([]);
  filterValue: any;
  selectedSize: any;
  stepper: boolean = true;

  /** Talla elegida vigente para ignorar respuestas de red de una selección anterior. */
  private catalogSelectedSizeId: number | null = null;

  /** Variantes cargándose tras cambiar talla — evita mezclar suma anterior con maestro nuevo. */
  catalogColorsPending = signal(false);

  /**
   * `computed()` solo observa Signals; selectedSize/sizes son campos normales sin invalidarlo.
   * Se incrementa al cambiar selección u opciones para que maestro/recap no queden pegados.
   */
  private panelStockSourceEpoch = signal(0);

  private bumpPanelStockSourceEpoch(): void {
    this.panelStockSourceEpoch.update(n => n + 1);
  }

  searchTerm = signal<string>('');
  filterStatus = signal<'all' | 'active' | 'inactive'>('all');

  attachedColors = computed(() =>
    this.colors().filter((c: CatalogColorRow) => c.variantAttached),
  );

  removableAttachedColors = computed(() =>
    this.attachedColors().filter((c: CatalogColorRow) => !!c.isExists),
  );

  totalAssignedStock = computed(() => {
    if (this.catalogColorsPending()) {
      return 0;
    }
    return this.colors().reduce(
      (acc, color: { variantAttached?: boolean; stock?: unknown }) => {
        if (!color.variantAttached) {
          return acc;
        }
        return acc + (Number(color.stock) || 0);
      },
      0,
    );
  });

  /** Maestro desde la fila de `sizes` (misma fuente que el texto del combo), con respaldo del modelo. */
  masterProductSizeStock = computed(() => {
    this.panelStockSourceEpoch();
    const id = this.selectedSize?.id;
    if (id == null || id === '') {
      return 0;
    }
    const row = this.sizes.find(
      (s: ProductSizeOption) => Number(s.id) === Number(id),
    );
    if (
      row != null &&
      row.stock !== undefined &&
      row.stock !== null &&
      `${row.stock}`.trim() !== ''
    ) {
      const n = Number(row.stock);
      if (!Number.isNaN(n)) {
        return Math.max(0, Math.trunc(n));
      }
    }
    return Math.max(0, Math.trunc(Number(this.selectedSize?.stock ?? 0) || 0));
  });

  remainingStock = computed(() => {
    const limit = this.masterProductSizeStock();
    return limit - this.totalAssignedStock();
  });

  isStockBalanced = computed(() => {
    return this.totalAssignedStock() === this.masterProductSizeStock();
  });

  /** Barra estable mientras llegan variantes — evita barras/aviso contradictorios. */
  effectiveStockBalancedForPanel = computed(
    () => this.catalogColorsPending() || this.isStockBalanced(),
  );

  /** Barra sobre el maestro: 100% = igual al maestro; se capa visualmente pero el aviso marca exceso. */
  stockAssignPercent = computed(() => {
    const master = this.masterProductSizeStock();
    const assigned = this.totalAssignedStock();
    if (this.catalogColorsPending() || master <= 0) {
      return assigned > 0 && !this.catalogColorsPending() ? 100 : 0;
    }
    const pct = (assigned / master) * 100;
    return Math.min(100, Math.round(pct));
  });

  progressBarHue = computed((): string => {
    if (this.catalogColorsPending() || this.isStockBalanced()) {
      return '#22C55E';
    }
    const r = this.remainingStock();
    if (r < 0) {
      return '#EF4444';
    }
    return '#f59e0b';
  });

  /** Porcentaje real suma/maestro (>100 si hay exceso). La barra sigue usando `stockAssignPercent` (cap 100). */
  variantVsMasterRatioPercent = computed((): number | null => {
    if (this.catalogColorsPending()) {
      return null;
    }
    const m = this.masterProductSizeStock();
    if (m <= 0) {
      return null;
    }
    return Math.round((this.totalAssignedStock() / m) * 100);
  });

  filteredColors = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const status = this.filterStatus();

    return this.colors()
      .filter(c => {
        const matchesSearch = String(c.description ?? '')
          .toLowerCase()
          .includes(term);
        const stockNum = Number(c.stock) || 0;
        const matchesStatus =
          status === 'all'
            ? true
            : status === 'active'
              ? !!c.variantAttached && stockNum > 0
              : !!c.variantAttached && stockNum === 0;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        const wa = Number(a.stock) || 0;
        const wb = Number(b.stock) || 0;
        const aa = a.variantAttached && wa > 0 ? 1 : 0;
        const bb = b.variantAttached && wb > 0 ? 1 : 0;
        return bb - aa;
      });
  });

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly dialogService: DialogService,
    private readonly messageService: MessageService,
    private readonly confirmationService: ConfirmationService,
    private readonly productSizeColorsService: ProductSizeColorsService,
  ) {
    if (this.route.snapshot.paramMap.get('id')) {
      this.productId = Number(this.route.snapshot.paramMap.get('id'));
      this.stepper = this.router.url.includes('/step/');
    }
  }

  formGroup: FormGroup = new FormGroup({
    size: new FormControl(),
  });

  ngOnInit(): void {
    this.getSizes();
    this.loadColors();
    this.formGroup.get('size')?.valueChanges.subscribe((size: any) => {
      this.getSizes(size);
    });
  }

  loadColors() {
    const raw = localStorage.getItem('selectedSize');
    if (!raw) {
      this.catalogSelectedSizeId = null;
      this.catalogColorsPending.set(false);
      localStorage.removeItem('selectedSize');
      return;
    }
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      this.catalogSelectedSizeId = null;
      this.catalogColorsPending.set(false);
      localStorage.removeItem('selectedSize');
      return;
    }
    if (parsed && Number(parsed['productId']) === this.productId) {
      const psIdStored = parsed['productSizeId'];
      this.selectedSize = {
        id: Number(parsed['id']),
        productSizeId:
          psIdStored != null && psIdStored !== ''
            ? Number(psIdStored)
            : undefined,
        description: parsed['description'],
        stock: Number(parsed['stock']) || 0,
      };
      this.catalogSelectedSizeId = Number(this.selectedSize.id);
      this.pinSelectedSizeToOptions();
      this.bumpPanelStockSourceEpoch();
      this.getColors(Number(this.selectedSize.id));
    } else {
      this.catalogSelectedSizeId = null;
      this.catalogColorsPending.set(false);
      localStorage.removeItem('selectedSize');
    }
  }

  getSizes(size?: string) {
    this.productSizeColorsService.getSizes(this.productId, size).subscribe({
      next: (sizesList: Size[]) => {
        this.sizes = sizesList as ProductSizeOption[];
        this.pinSelectedSizeToOptions();
        this.bumpPanelStockSourceEpoch();
      },
    });
  }

  getColors(sizeId: number) {
    const sid = Number(sizeId);
    this.catalogColorsPending.set(true);
    this.colors.set([]);

    this.productSizeColorsService.getColors(this.productId, sid).subscribe({
      next: (rawColors: unknown) => {
        if (
          sid !== this.catalogSelectedSizeId ||
          Number(this.selectedSize?.id) !== sid
        ) {
          return;
        }

        const rows = Array.isArray(rawColors)
          ? (rawColors as Record<string, unknown>[])
          : [];
        const normalized = rows.map(c => this.normalizeColorRowFromApi(c));
        this.colors.set(normalized);
        this.catalogColorsPending.set(false);
        this.syncSizesProductSizeMeta(sid);
      },
      error: () => {
        if (sid === this.catalogSelectedSizeId) {
          this.catalogColorsPending.set(false);
        }
      },
    });
  }

  /** Alineación con backend: existe variante ⇔ fila pivot; stock 0 es válido (agotado). */
  private normalizeColorRowFromApi(
    c: Record<string, unknown>,
  ): CatalogColorRow {
    const isExists = !!c['isExists'];
    const rawStock = c['stock'];
    const stockNum = Math.max(
      0,
      Math.trunc(
        Number(
          rawStock === null || rawStock === undefined || rawStock === ''
            ? 0
            : rawStock,
        ),
      ),
    );
    return {
      ...c,
      stock: stockNum,
      variantAttached: isExists,
    } as CatalogColorRow;
  }

  /**
   * Tras cada GET colors/sizes el array tiene objetos nuevos: el dropdown usa dataKey=id
   * y esta rutina enlaza selectedSize al mismo objeto que la opción en la lista.
   */
  private pinSelectedSizeToOptions(): void {
    const current = this.selectedSize as ProductSizeOption | undefined;
    if (!current?.id) {
      return;
    }
    const row = this.sizes.find(s => Number(s.id) === Number(current.id));
    if (!row) {
      return;
    }

    row.productSizeId = row.productSizeId ?? current.productSizeId;

    this.selectedSize = row;
    this.persistSelectedSizeSnapshot();
    this.bumpPanelStockSourceEpoch();
  }

  /** Refresca `productSizeId` y stock maestro desde `GET colors/sizes`. */
  private syncSizesProductSizeMeta(sizeId: number): void {
    const sid = Number(sizeId);
    if (
      this.catalogSelectedSizeId !== sid ||
      !this.selectedSize ||
      Number(this.selectedSize.id) !== sid
    ) {
      return;
    }
    this.productSizeColorsService.getSizes(this.productId).subscribe({
      next: (sizesList: Size[]) => {
        if (
          sid !== this.catalogSelectedSizeId ||
          Number(this.selectedSize?.id) !== sid
        ) {
          return;
        }

        this.sizes = sizesList as ProductSizeOption[];
        const row = this.sizes.find(s => Number(s.id) === sid);
        if (!row) {
          this.pinSelectedSizeToOptions();
          return;
        }
        const apiMaster =
          row.stock != null && !Number.isNaN(Number(row.stock))
            ? Math.max(0, Math.trunc(Number(row.stock)))
            : null;
        if (apiMaster !== null) {
          row.stock = apiMaster;
        }
        row.productSizeId =
          row.productSizeId ?? this.selectedSize?.productSizeId;

        this.selectedSize = row;
        this.sizes = [...this.sizes];
        this.persistSelectedSizeSnapshot();
        this.bumpPanelStockSourceEpoch();
      },
    });
  }

  private persistSelectedSizeSnapshot(): void {
    if (!this.selectedSize) {
      return;
    }
    localStorage.setItem(
      'selectedSize',
      JSON.stringify({
        ...this.selectedSize,
        productId: this.productId,
      }),
    );
  }

  onVariantAttachedChange(color: CatalogColorRow, nextChecked: boolean): void {
    if (nextChecked) {
      color.variantAttached = true;
      color.stock = Math.max(0, Math.trunc(Number(color.stock) || 0));
      this.colors.update(rows => [...rows]);
      return;
    }

    if (color.isExists) {
      // Evita desmarcar hasta confirmación: quitar equivale a borrar pivote `product_size_color`.
      color.variantAttached = true;
      this.colors.update(rows => [...rows]);
      this.confirmationService.confirm({
        header: 'Quitar variante de color',
        message: `"${String(color.description)}" ya está enlazado a esta talla. ¿Eliminar esta variante? Se eliminará la relación en el servidor.`,
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Sí, eliminar',
        rejectLabel: 'Cancelar',
        acceptButtonStyleClass: 'p-button-danger',
        accept: () => {
          this.detachVariantWithApi(color);
        },
      });
      return;
    }

    color.variantAttached = false;
    this.colors.update(rows => [...rows]);
  }

  private detachVariantWithApi(color: CatalogColorRow): void {
    const psId = color.productSizeId;
    if (!psId) {
      showError(
        this.messageService,
        'Falta el identificador de talla-producto.',
      );
      return;
    }
    this.productSizeColorsService.remove(psId, color.id).subscribe({
      next: () => {
        showSuccess(this.messageService, 'Variante de color eliminada.');
        this.loadColors();
      },
      error: () => this.loadColors(),
    });
  }

  getSelectedSize(event: any) {
    if (event?.value?.id != null && event.value.id !== '') {
      const sid = Number(event.value.id);
      this.catalogSelectedSizeId = sid;

      event.value.productId = this.productId;
      this.pinSelectedSizeToOptions();
      const pin = this.selectedSize;
      localStorage.setItem(
        'selectedSize',
        JSON.stringify({
          ...pin,
          productId: this.productId,
        }),
      );

      this.catalogColorsPending.set(true);
      this.colors.set([]);
      this.bumpPanelStockSourceEpoch();
      this.getColors(sid);
      return;
    }

    this.catalogSelectedSizeId = null;
    this.catalogColorsPending.set(false);
    this.messageService.clear();
    this.colors.set([]);
    localStorage.removeItem('selectedSize');
    this.bumpPanelStockSourceEpoch();
  }

  resetFunction() {
    this.getSizes();
    this.formGroup.get('size')?.patchValue('');
  }

  onStockChange(color: CatalogColorRow) {
    const raw = color.stock as unknown;
    const stockNum = Math.max(
      0,
      Math.trunc(Number(raw === '' || raw == null ? 0 : raw)),
    );
    color.stock = stockNum;
    this.colors.update(currentColors => [...currentColors]);
  }

  createColor() {
    const modal = this.dialogService.open(ColorsCreateFormComponent, {
      data: {
        productId: this.productId,
      },
      header: 'Crear Color',
      styleClass: 'dialog-custom-form',
    });

    modal.onClose.subscribe({
      next: (value: any) => {
        if (value?.success) {
          showSuccess(this.messageService, 'Color Creado.');
          this.getSizes();
          this.loadColors();
        } else if (value?.error) {
          showError(this.messageService, 'Hubo un error, intente nuevamente');
        }
      },
    });
  }

  saveAllSelectedColors() {
    const targets = this.attachedColors().filter(
      (c: CatalogColorRow) => !!c.productSizeId && c.variantAttached === true,
    );
    const requests = targets.map(color => {
      const stockPayload = Math.max(0, Math.trunc(Number(color.stock)));
      const productSizeColorSave: ProductSizeColorSave = {
        stock: stockPayload,
      };

      const psId = color.productSizeId as number;
      if (color.isExists) {
        return this.productSizeColorsService
          .update(psId, color.id, productSizeColorSave)
          .pipe(catchError(() => of(null)));
      }
      return this.productSizeColorsService
        .add(psId, color.id, productSizeColorSave)
        .pipe(catchError(() => of(null)));
    });

    if (!requests.length) {
      showError(this.messageService, 'No hay variantes marcadas para guardar.');
      return;
    }

    concat(...requests).subscribe({
      complete: () => {
        showSuccess(this.messageService, 'Cambios de color guardados.');
        this.loadColors();
      },
      error: () =>
        showError(
          this.messageService,
          'No se pudieron guardar todos los colores.',
        ),
    });
  }

  deleteAllSelectedColors() {
    const removable = this.removableAttachedColors();
    if (!removable.length) {
      showError(
        this.messageService,
        'No hay variantes guardadas para eliminar (solo están pendientes sin guardar).',
      );
      return;
    }
    this.confirmationService.confirm({
      header: 'Quitar todas las variantes enlazadas',
      message: `Se eliminarán ${removable.length} variante(s) de color de esta talla. ¿Continuar?`,
      icon: 'pi pi-trash',
      acceptLabel: 'Sí, quitar todas',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        const toRemove = removable.filter(
          c => c.productSizeId != null,
        ) as CatalogColorRow[];
        const requests = toRemove.map((color: CatalogColorRow) =>
          this.productSizeColorsService
            .remove(color.productSizeId as number, color.id)
            .pipe(catchError(() => of(null))),
        );
        concat(...requests).subscribe({
          complete: () => {
            showSuccess(this.messageService, 'Colores removidos.');
            this.loadColors();
          },
          error: () =>
            showError(
              this.messageService,
              'No se pudieron remover todos los colores.',
            ),
        });
      },
    });
  }

  saveColorSizeProductButton(color: CatalogColorRow) {
    const psId = color.productSizeId;
    if (!psId) {
      showError(
        this.messageService,
        'No hay vínculo producto–talla; guarde primero la talla en inventario.',
      );
      return;
    }
    const stockPayload = Math.max(0, Math.trunc(Number(color.stock)));
    const productSizeColorSave: ProductSizeColorSave = {
      stock: stockPayload,
    };

    this.productSizeColorsService
      .add(psId, color.id, productSizeColorSave)
      .subscribe({
        next: () => {
          showSuccess(this.messageService, 'Stock de color actualizado.');
          this.loadColors();
        },
        error: () => this.loadColors(),
      });
  }

  editColorSizeProductButton(color: CatalogColorRow) {
    this.saveColorSizeProductButton(color);
  }

  removeColorSizeProductButton(color: CatalogColorRow) {
    const psId = color.productSizeId;
    if (!psId) {
      showError(
        this.messageService,
        'Falta el identificador de talla-producto.',
      );
      return;
    }
    this.productSizeColorsService.remove(psId, color.id).subscribe({
      next: () => {
        showSuccess(this.messageService, 'Variante de color eliminada.');
        this.loadColors();
      },
      error: () => this.loadColors(),
    });
  }
}
