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
import { catchError, forkJoin, of } from 'rxjs';
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

  searchTerm = signal<string>('');
  filterStatus = signal<'all' | 'active' | 'inactive'>('all');

  attachedColors = computed(() =>
    this.colors().filter((c: CatalogColorRow) => c.variantAttached),
  );

  removableAttachedColors = computed(() =>
    this.attachedColors().filter((c: CatalogColorRow) => !!c.isExists),
  );

  totalAssignedStock = computed(() => {
    return this.colors().reduce((acc, color: { variantAttached?: boolean; stock?: unknown }) => {
      if (!color.variantAttached) {
        return acc;
      }
      return acc + (Number(color.stock) || 0);
    }, 0);
  });

  remainingStock = computed(() => {
    const limit = this.selectedSize?.stock || 0;
    return limit - this.totalAssignedStock();
  });

  isStockBalanced = computed(() => {
    return this.totalAssignedStock() === (this.selectedSize?.stock || 0);
  });

  /** Barra de progreso: evita división por cero si el maestro es 0. */
  stockAssignPercent = computed(() => {
    const cap = this.selectedSize?.stock ?? 0;
    const assigned = this.totalAssignedStock();
    if (cap <= 0) {
      return assigned > 0 ? 100 : 0;
    }
    return Math.min(100, Math.round((assigned / cap) * 100));
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
        const aa = !!(a.variantAttached && wa > 0) ? 1 : 0;
        const bb = !!(b.variantAttached && wb > 0) ? 1 : 0;
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
      localStorage.removeItem('selectedSize');
      return;
    }
    let selectedSize: Record<string, unknown>;
    try {
      selectedSize = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      localStorage.removeItem('selectedSize');
      return;
    }
    if (selectedSize && Number(selectedSize['productId']) === this.productId) {
      const psIdStored = selectedSize['productSizeId'];
      this.selectedSize = {
        id: Number(selectedSize['id']),
        productSizeId:
          psIdStored != null && psIdStored !== ''
            ? Number(psIdStored)
            : undefined,
        description: selectedSize['description'],
        stock: Number(selectedSize['stock']) || 0,
      };
      this.getColors(this.selectedSize.id);
    } else {
      localStorage.removeItem('selectedSize');
    }
  }

  getSizes(size?: string) {
    this.productSizeColorsService.getSizes(this.productId, size).subscribe({
      next: (sizesList: Size[]) => {
        this.sizes = sizesList as ProductSizeOption[];
      },
    });
  }

  getColors(sizeId: number) {
    this.productSizeColorsService.getColors(this.productId, sizeId).subscribe({
      next: (rawColors: unknown) => {
        const rows = Array.isArray(rawColors)
          ? (rawColors as Record<string, unknown>[])
          : [];
        const normalized = rows.map(c => this.normalizeColorRowFromApi(c));
        this.colors.set(normalized);
        this.syncSizesProductSizeMeta(sizeId);
        this.syncMasterStockFromVariants();
      },
    });
  }

  /** Alineación con backend: existe variante ⇔ fila pivot; stock 0 es válido (agotado). */
  private normalizeColorRowFromApi(c: Record<string, unknown>): CatalogColorRow {
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

  /** Actualiza opciones del dropdown (`product_size` id) sin pisar el stock maestro sincronizado por variantes. */
  private syncSizesProductSizeMeta(sizeId: number): void {
    if (!this.selectedSize || this.selectedSize.id !== sizeId) {
      return;
    }
    this.productSizeColorsService.getSizes(this.productId).subscribe({
      next: (sizesList: Size[]) => {
        this.sizes = sizesList as ProductSizeOption[];
        const row = this.sizes.find(s => s.id === sizeId);
        if (!row) {
          return;
        }
        this.selectedSize = {
          ...this.selectedSize,
          productSizeId: row.productSizeId ?? this.selectedSize.productSizeId,
        };
        this.persistSelectedSizeSnapshot();
      },
    });
  }

  /** Stock maestro (`product_size`) = suma de stocks de variantes marcadas como existentes en esta vista. */
  private syncMasterStockFromVariants(): void {
    if (!this.selectedSize) {
      return;
    }
    const sum = this.totalAssignedStock();
    this.selectedSize = { ...this.selectedSize, stock: sum };
    const sizeId = this.selectedSize.id;
    const idx = this.sizes.findIndex(s => s.id === sizeId);
    if (idx >= 0) {
      this.sizes[idx] = { ...this.sizes[idx], stock: sum };
      this.sizes = [...this.sizes];
    }
    this.persistSelectedSizeSnapshot();
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
      this.syncMasterStockFromVariants();
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
    this.syncMasterStockFromVariants();
  }

  private detachVariantWithApi(color: CatalogColorRow): void {
    const psId = color.productSizeId;
    if (!psId) {
      showError(this.messageService, 'Falta el identificador de talla-producto.');
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
    if (event.value) {
      event.value.productId = this.productId;
      localStorage.setItem('selectedSize', JSON.stringify(event.value));
      this.getColors(event.value.id);
    } else {
      this.messageService.clear();
      this.colors.set([]);
    }
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
    this.syncMasterStockFromVariants();
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
      (c: CatalogColorRow) =>
        !!c.productSizeId && c.variantAttached === true,
    );
    const requests = targets.map(color => {
      const stockPayload = Math.max(
        0,
        Math.trunc(Number(color.stock)),
      );
      const productSizeColorSave: ProductSizeColorSave = {
        stock: stockPayload,
      };

      const psId = color.productSizeId;
      return this.productSizeColorsService
        .add(psId as number, color.id, productSizeColorSave)
        .pipe(
          catchError(() => {
            return of(null);
          }),
        );
    });

    if (!requests.length) {
      showError(
        this.messageService,
        'No hay variantes marcadas para guardar.',
      );
      return;
    }

    forkJoin(requests).subscribe({
      next: () => {
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
        const toRemove = removable.filter(c => c.productSizeId != null) as CatalogColorRow[];
        const requests = toRemove.map((color: CatalogColorRow) =>
          this.productSizeColorsService
            .remove(color.productSizeId as number, color.id)
            .pipe(catchError(() => of(null))),
        );
        forkJoin(requests).subscribe({
          next: () => {
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
      showError(this.messageService, 'Falta el identificador de talla-producto.');
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
