import { CommonModule } from '@angular/common';
import {
  Component,
  DestroyRef,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { FormControl, FormGroup } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { PaginatorState } from 'primeng/paginator';
import { ToastModule } from 'primeng/toast';
import { debounceTime, Observable, take } from 'rxjs';
import { AuthService } from '../../../../../../auth/services/auth.service';
import {
  CallToAction,
  Column,
} from '../../../../../../interfaces/table.interface';
import { LoadingService } from '../../../../../../services/loading.service';
import { SharedModule } from '../../../../../../shared/shared.module';
import {
  showError,
  showSuccess,
  showToastWarn,
} from '../../../../../../utils/notifications';
import { Sale, SunatStatus } from '../../models/sales.model';
import { SalesService } from '../../services/sales.service';
import { SaleFormComponent } from '../form/form.component';

@Component({
  selector: 'app-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    SharedModule,
    ToastModule,
    ConfirmDialogModule,
  ],
  templateUrl: './list.component.html',
  styleUrl: './list.component.scss',
  providers: [ConfirmationService, MessageService, DialogService],
})
export class SaleListComponent implements OnInit, OnDestroy {
  private readonly destroyRef = inject(DestroyRef);

  saleModal: DynamicDialogRef | undefined;
  columns: Column[] = [
    {
      header: 'Código',
      field: 'code',
      clickable: false,
      image: false,
      money: false,
    },
    {
      header: 'Fecha',
      field: 'date',
      clickable: false,
      image: false,
      money: false,
    },
    {
      header: 'Cliente',
      field: 'customer',
      clickable: false,
      image: false,
      money: false,
    },
    {
      header: 'Total',
      field: 'total',
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
      header: 'Comprobante',
      field: 'full_invoice_number',
      clickable: false,
      image: false,
      money: false,
    },
    {
      header: 'SUNAT',
      field: 'sunat_status',
      clickable: false,
      image: false,
      money: false,
      tag: true,
      tagSeverityFn: (value: string | null | undefined) => {
        switch (value as SunatStatus | null | undefined) {
          case 'ACCEPTED':
            return 'success';
          case 'PENDING':
            return 'warning';
          case 'SENT':
            return 'info';
          case 'REJECTED':
            return 'danger';
          case 'VOIDED':
            return 'secondary';
          default:
            return 'secondary';
        }
      },
    },
    {
      header: 'Acción',
      field: 'button',
      clickable: false,
      image: false,
      money: false,
    },
  ];
  cellToAction: any;
  limit: number = 10;
  page: number = 1;
  search: string = '';
  callToAction: CallToAction<Sale>[] = [
    {
      type: 'button',
      size: 'small',
      icon: 'pi pi-eye',
      outlined: true,
      pTooltip: 'Ver ticket (imprimir o guardar PDF)',
      tooltipPosition: 'bottom',
      visible: () => true,
      click: (rowData: Sale) => this.buttonPreviewTicket(rowData.id),
    },
    {
      type: 'button',
      size: 'small',
      icon: 'pi pi-eye',
      outlined: true,
      pTooltip: 'Ver detalle',
      tooltipPosition: 'bottom',
      visible: (rowData: Sale) =>
        rowData.status === 'CANCELED' &&
        this.authService.hasAnyPermission(['sale.update', 'sale.get']),
      click: (rowData: Sale) => this.buttonEditSale(rowData.id),
    },
    {
      type: 'button',
      size: 'small',
      icon: 'pi pi-pencil',
      outlined: true,
      pTooltip: 'Editar',
      tooltipPosition: 'bottom',
      visible: (rowData: Sale) =>
        rowData.status !== 'CANCELED' &&
        this.authService.hasPermission('sale.update'),
      click: (rowData: Sale) => this.buttonEditSale(rowData.id),
    },
    {
      type: 'button',
      size: 'small',
      icon: 'pi pi-trash',
      outlined: true,
      pTooltip: 'Eliminar',
      tooltipPosition: 'bottom',
      visible: (rowData: Sale) =>
        rowData.status !== 'CANCELED' &&
        this.authService.hasPermission('sale.delete'),
      click: (rowData: Sale, event?: Event) =>
        this.buttonDeleteSale(rowData.id, event!),
    },
  ];

  formGroup: FormGroup = new FormGroup({
    search: new FormControl<string | null>(null),
  });

  constructor(
    private readonly dialogService: DialogService,
    private readonly messageService: MessageService,
    private readonly confirmationService: ConfirmationService,
    private readonly loadingService: LoadingService,
    private readonly salesService: SalesService,
    private readonly authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.restoreFilters();
    this.getSales(this.limit, this.page, this.search);
    this.formGroup
      .get('search')
      ?.valueChanges.pipe(
        debounceTime(600),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((value: any) => {
        this.search = value ? value : '';
        this.loadingService.sendLoadingState(true);
        this.getSales(this.limit, 1, this.search);
      });
  }

  ngOnDestroy(): void {
    if (this.saleModal) {
      this.saleModal.close();
    }
  }

  restoreFilters() {
    const savedState = this.salesService.getFilterState();
    if (savedState) {
      this.limit = savedState.limit;
      this.page = savedState.page;
      this.search = savedState.search;

      if (this.search) {
        this.formGroup
          .get('search')
          ?.setValue(this.search, { emitEvent: false });
      }
    }
  }

  clearFilter(): void {
    this.search = '';
    this.limit = 10;
    this.loadingService.sendLoadingState(true);
    this.formGroup.get('search')?.setValue('');
    this.salesService.clearFilterState();
    this.getSales(this.limit, 1, '');
  }

  async getSales(
    limit = this.limit,
    page = this.page,
    search = this.search,
  ): Promise<void> {
    this.updatePage(page);
    this.salesService.callGetList(limit, page, search).subscribe();
    setTimeout(() => {
      this.loadingService.sendLoadingState(false);
    }, 600);
  }

  async onPageSelected(paginate: PaginatorState): Promise<void> {
    this.limit = paginate.rows ?? 10;
    this.updatePage((paginate.page ?? 0) + 1);
    this.getSales(this.limit, this.page, this.search);
  }

  get sales(): Observable<Sale[]> {
    return this.salesService.getList();
  }

  get total(): Observable<number> {
    return this.salesService.getTotal();
  }

  /** Vendedora/Vendedor ven solo el mes en curso (filtro en backend). */
  get showsCurrentMonthOnlyHint(): boolean {
    const roles = this.authService.currentUser()?.roles ?? [];
    const privileged = roles.some(
      role => role === 'Super Admin' || role === 'Admin',
    );
    const storeSeller = roles.some(
      role => role === 'Vendedora' || role === 'Vendedor',
    );

    return storeSeller && !privileged;
  }

  readonly currentMonthLabel = new Intl.DateTimeFormat('es-PE', {
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  buttonPreviewTicket(id: number): void {
    void this.salesService.openTicketPreview(id).catch(() => {
      showError(
        this.messageService,
        'No se pudo abrir el ticket. Permite ventanas emergentes e intenta de nuevo.',
      );
    });
  }

  buttonEditSale(id: number): void {
    this.saleModal = this.dialogService.open(SaleFormComponent, {
      data: { id },
      header: 'Detalle venta',
      styleClass: 'dialog-custom-form',
    });

    this.saleModal.onClose.pipe(take(1)).subscribe({
      next: value => {
        value && value?.success
          ? showSuccess(this.messageService, 'Detalle actualizado.')
          : value?.error
            ? showError(this.messageService, value?.error)
            : null;
      },
    });
  }

  buttonDeleteSale(id: number, event: Event): void {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Deseas cancelar esta venta?',
      header: 'Eliminar venta',
      icon: 'pi pi-info-circle',
      acceptButtonStyleClass: 'p-button-danger p-button-text',
      rejectButtonStyleClass: 'p-button-text p-button-text',
      acceptIcon: 'none',
      rejectIcon: 'none',
      acceptLabel: 'Sí',
      rejectLabel: 'No',
      accept: () => {
        this.salesService.delete(id).subscribe({
          next: () => {
            showSuccess(this.messageService, 'La venta ha sido cancelada');
          },
          error: (err: unknown) => {
            const raw = (err as { error?: { message?: string | string[] } })
              ?.error?.message;
            const message = Array.isArray(raw)
              ? raw[0]?.trim()
              : typeof raw === 'string'
                ? raw.trim()
                : '';
            showError(
              this.messageService,
              message || 'No se pudo cancelar la venta',
            );
          },
        });
      },
      reject: () => {
        showToastWarn(this.messageService, 'No se realizó ninguna acción.');
      },
    });
  }

  private updatePage(value: number): void {
    this.page = value;
  }
}
