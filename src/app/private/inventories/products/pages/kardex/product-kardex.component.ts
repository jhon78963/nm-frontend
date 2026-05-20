import { CommonModule } from '@angular/common';
import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { take } from 'rxjs';
import { showError } from '../../../../../utils/notifications';
import { Size } from '../../../sizes/models/sizes.model';
import { SizesSelectedService } from '../../../sizes/services/sizes-selected.service';
import { KardexMovementRow } from '../../models/kardex.model';
import { Product } from '../../models/products.model';
import { ProductSizeColorsService } from '../../services/productColors.service';
import { ProductsService } from '../../services/products.service';
import { KardexService } from '../../services/kardex.service';

type KardexColorOption = {
  id: number;
  description?: string;
};

@Component({
  selector: 'app-product-kardex',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ButtonModule,
    CalendarModule,
    DropdownModule,
    TableModule,
    ToastModule,
  ],
  templateUrl: './product-kardex.component.html',
  styleUrl: './product-kardex.component.scss',
  providers: [MessageService],
})
export class ProductKardexComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly productsService = inject(ProductsService);
  private readonly sizesSelectedService = inject(SizesSelectedService);
  private readonly productSizeColorsService = inject(ProductSizeColorsService);
  private readonly kardexService = inject(KardexService);
  private readonly messageService = inject(MessageService);

  readonly productId = signal<number>(0);
  readonly product = signal<Product | null>(null);

  /** Rango de fechas del calendario (PrimeNG range). */
  dateRange: Date[] | null = null;

  readonly sizeOptions = signal<Size[]>([]);
  selectedSize: Size | null = null;

  readonly colorSelectItems = signal<{ label: string; value: number | null }[]>(
    [{ label: 'Maestro (sin color)', value: null }],
  );
  selectedColorId: number | null = null;

  readonly loadingSizes = signal(false);
  readonly loadingKardex = signal(false);

  readonly movements = signal<KardexMovementRow[]>([]);
  readonly openingBalance = signal<number | null>(null);
  readonly closingBalance = signal<number | null>(null);

  readonly hasResult = computed(
    () => this.openingBalance() !== null && !this.loadingKardex(),
  );

  ngOnInit(): void {
    this.dateRange = this.buildCurrentMonthRange();
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(pm => {
        const idRaw = pm.get('id');
        const id = idRaw !== null && idRaw !== '' ? Number(idRaw) : 0;
        if (id > 0) {
          this.productId.set(id);
          this.loadProductContext(id);
        }
      });
  }

  loadKardex(): void {
    const product = this.product();
    const warehouseId = product?.warehouseId ?? 0;
    const pid = this.productId();
    const size = this.selectedSize;
    const psId = size?.productSizeId ?? 0;

    if (warehouseId < 1) {
      showError(
        this.messageService,
        'El producto no tiene almacén asignado; no se puede consultar el kardex.',
      );
      return;
    }

    if (psId < 1) {
      showError(this.messageService, 'Selecciona una talla válida.');
      return;
    }

    const range = this.resolveDateRange();
    if (range === null) {
      showError(
        this.messageService,
        'Selecciona un rango de fechas completo (inicio y fin).',
      );
      return;
    }

    this.loadingKardex.set(true);
    this.openingBalance.set(null);
    this.closingBalance.set(null);
    this.movements.set([]);
    this.kardexService
      .getReport({
        warehouseId,
        productId: pid,
        productSizeId: psId,
        colorId: this.selectedColorId,
        fechaInicio: range.start,
        fechaFin: range.end,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: res => {
          if (res.success && res.data) {
            this.openingBalance.set(res.data.meta.opening_balance_quantity);
            this.closingBalance.set(res.data.meta.closing_balance_quantity);
            this.movements.set(res.data.movements ?? []);
          } else {
            this.openingBalance.set(null);
            this.closingBalance.set(null);
            this.movements.set([]);
          }
          this.loadingKardex.set(false);
        },
        error: () => {
          this.loadingKardex.set(false);
          this.openingBalance.set(null);
          this.closingBalance.set(null);
          this.movements.set([]);
          showError(
            this.messageService,
            'No se pudo cargar el kardex. Verifica permisos y datos.',
          );
        },
      });
  }

  onSizeChange(): void {
    const size = this.selectedSize;
    this.selectedColorId = null;
    this.colorSelectItems.set([{ label: 'Maestro (sin color)', value: null }]);
    const prod = this.product();
    if (prod !== null && size !== null && size.id > 0) {
      this.loadColorsForSize(prod.id, size.id);
    }
  }

  formatOccurred(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) {
      return iso;
    }
    return d.toLocaleString('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  documentCode(row: KardexMovementRow): string {
    const code = row.reference?.code;
    return code !== undefined && code !== null && code !== ''
      ? String(code)
      : '—';
  }

  motivo(row: KardexMovementRow): string {
    return row.movement_type_label ?? '—';
  }

  isIn(row: KardexMovementRow): boolean {
    return row.direction === 'IN';
  }

  private loadProductContext(id: number): void {
    this.loadingSizes.set(true);
    this.productsService.getOne(id).subscribe({
      next: (p: Product) => {
        this.product.set(p);
        const typeIds =
          p.sizeTypeId && p.sizeTypeId.length > 0 ? p.sizeTypeId : [1];
        this.sizesSelectedService.callGetList(id, typeIds).subscribe({
          next: () => {
            this.sizesSelectedService
              .getList()
              .pipe(take(1))
              .subscribe({
                next: (sizes: Size[]) => {
                  const usable = sizes.filter(
                    s => s.isExists === true && (s.productSizeId ?? 0) > 0,
                  );
                  this.sizeOptions.set(usable);
                  this.loadingSizes.set(false);
                },
                error: () => this.loadingSizes.set(false),
              });
          },
          error: () => this.loadingSizes.set(false),
        });
      },
      error: () => this.loadingSizes.set(false),
    });
  }

  private loadColorsForSize(productId: number, catalogSizeId: number): void {
    this.productSizeColorsService
      .getColors(productId, catalogSizeId)
      .subscribe({
        next: (rows: unknown) => {
          const list = Array.isArray(rows) ? rows : [];
          const options: { label: string; value: number | null }[] = [
            { label: 'Maestro (sin color)', value: null },
          ];
          for (const raw of list) {
            const c = raw as KardexColorOption;
            if (c && typeof c.id === 'number') {
              options.push({
                label: c.description ?? `Color #${c.id}`,
                value: c.id,
              });
            }
          }
          this.colorSelectItems.set(options);
        },
        error: () => {
          this.colorSelectItems.set([
            { label: 'Maestro (sin color)', value: null },
          ]);
        },
      });
  }

  private buildCurrentMonthRange(): Date[] {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const end = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );
    return [start, end];
  }

  private resolveDateRange(): { start: string; end: string } | null {
    const r = this.dateRange;
    if (!r || r.length < 2 || !r[0] || !r[1]) {
      return null;
    }
    const a = r[0];
    const b = r[1];
    const start = a <= b ? a : b;
    const end = a <= b ? b : a;
    return {
      start: this.toYmd(start),
      end: this.toYmd(end),
    };
  }

  private toYmd(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
