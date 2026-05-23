import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DropdownModule } from 'primeng/dropdown';
import { PaginatorState } from 'primeng/paginator';
import { ToastModule } from 'primeng/toast';
import { debounceTime } from 'rxjs';
import {
  CallToAction,
  Column,
} from '../../../../../interfaces/table.interface';
import { Warehouse } from '../../../../../models/warehouse.interface';
import { LoadingService } from '../../../../../services/loading.service';
import { WarehousesService } from '../../../../../services/warehouse.service';
import { SharedModule } from '../../../../../shared/shared.module';
import { showError, showSuccess } from '../../../../../utils/notifications';
import { PurchaseRow } from '../../models/purchases-list.model';
import { PurchaseService } from '../../services/purchase.service';

@Component({
  selector: 'app-purchase-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    SharedModule,
    ToastModule,
    ConfirmDialogModule,
    ButtonModule,
    DropdownModule,
  ],
  templateUrl: './purchase-list.component.html',
  styleUrl: './purchase-list.component.scss',
  providers: [ConfirmationService, MessageService],
})
export class PurchaseListComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  columns: Column[] = [
    { header: 'ID', field: 'id', clickable: false, image: false, money: false },
    {
      header: 'Fecha doc.',
      field: 'registeredAt',
      clickable: false,
      image: false,
      money: false,
    },
    {
      header: 'Proveedor',
      field: 'supplierName',
      clickable: false,
      image: false,
      money: false,
    },
    {
      header: 'Almacén',
      field: 'warehouseName',
      clickable: false,
      image: false,
      money: false,
    },
    {
      header: 'Total',
      field: 'totalSubtotal',
      clickable: false,
      image: false,
      money: true,
    },
    {
      header: 'Estado',
      field: 'status',
      clickable: false,
      image: false,
      money: false,
    },
    {
      header: 'Acción',
      field: 'button',
      clickable: false,
      image: false,
      money: false,
    },
  ];
  limit = 10;
  page = 1;
  search = '';
  purchases: PurchaseRow[] = [];
  total = 0;
  warehouses: Warehouse[] = [];
  statusOptions = [
    { label: 'Todos', value: null as string | null },
    { label: 'Activas', value: 'ACTIVE' },
    { label: 'Anuladas', value: 'CANCELLED' },
  ];

  formGroup = new FormGroup({
    search: new FormControl<string | null>(null),
    warehouseId: new FormControl<number | null>(null),
    status: new FormControl<string | null>(null),
  });

  callToAction: CallToAction<PurchaseRow>[] = [
    {
      type: 'button',
      size: 'small',
      icon: 'pi pi-eye',
      outlined: true,
      pTooltip: 'Ver detalle',
      tooltipPosition: 'bottom',
      click: (row: PurchaseRow) => {
        void this.router.navigate(['/inventories/purchase', row.id]);
      },
    },
    {
      type: 'button',
      size: 'small',
      icon: 'pi pi-times-circle',
      outlined: true,
      pTooltip: 'Anular compra (revierte stock)',
      tooltipPosition: 'bottom',
      visible: (row: PurchaseRow) => row.status === 'ACTIVE',
      click: (row: PurchaseRow, event?: Event) =>
        this.confirmCancel(row, event),
    },
  ];

  constructor(
    private readonly router: Router,
    private readonly purchaseApi: PurchaseService,
    private readonly messageService: MessageService,
    private readonly confirmationService: ConfirmationService,
    private readonly loadingService: LoadingService,
    private readonly warehousesService: WarehousesService,
  ) {}

  ngOnInit(): void {
    this.warehousesService
      .getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: rows => {
          this.warehouses = rows ?? [];
        },
      });
    this.load();
    this.formGroup
      .get('search')
      ?.valueChanges.pipe(
        debounceTime(500),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(v => {
        this.search = (v ?? '').trim();
        this.page = 1;
        this.load();
      });
    this.formGroup
      .get('warehouseId')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.page = 1;
        this.load();
      });
    this.formGroup
      .get('status')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.page = 1;
        this.load();
      });
  }

  load(): void {
    this.loadingService.sendLoadingState(true);
    const wid = this.formGroup.get('warehouseId')?.value;
    const st = this.formGroup.get('status')?.value;
    this.purchaseApi
      .getList(this.limit, this.page, this.search, wid ?? null, st)
      .subscribe({
        next: res => {
          this.purchases = res.data ?? [];
          this.total = res.paginate?.total ?? 0;
          this.loadingService.sendLoadingState(false);
        },
        error: () => {
          this.loadingService.sendLoadingState(false);
          showError(
            this.messageService,
            'No se pudo cargar el listado de compras.',
          );
        },
      });
  }

  onPageSelected(paginate: PaginatorState): void {
    this.limit = paginate.rows ?? 10;
    this.page = (paginate.page ?? 0) + 1;
    this.load();
  }

  clearFilter(): void {
    this.search = '';
    this.page = 1;
    this.formGroup.patchValue(
      { search: '', warehouseId: null, status: null },
      { emitEvent: false },
    );
    this.load();
  }

  goRegister(): void {
    void this.router.navigate(['/inventories/purchase/register']);
  }

  private confirmCancel(row: PurchaseRow, event?: Event): void {
    this.confirmationService.confirm({
      target: event?.target as HTMLElement,
      message: `¿Anular la compra #${row.id}? Se revertirá el stock ingresado en inventario.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, anular',
      rejectLabel: 'No',
      accept: () => {
        this.purchaseApi
          .cancel(row.id, 'Anulación desde listado de compras')
          .subscribe({
            next: () => {
              showSuccess(this.messageService, 'Compra anulada.');
              this.load();
            },
            error: err => {
              const msg =
                err?.error?.message ??
                err?.error?.errors?.stock?.[0] ??
                'No se pudo anular (revisá stock o permisos).';
              showError(this.messageService, String(msg));
            },
          });
      },
    });
  }
}
