import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { PaginatorState } from 'primeng/paginator';
import { ToastModule } from 'primeng/toast';
import { debounceTime, Observable } from 'rxjs';
import {
  CallToAction,
  Column,
} from '../../../../../interfaces/table.interface';
import { LoadingService } from '../../../../../services/loading.service';
import { SharedModule } from '../../../../../shared/shared.module';
import { showSuccess, showToastWarn } from '../../../../../utils/notifications';
import { Order } from '../../models/orders.model';
import { OrdersService } from '../../services/orders.service';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [CommonModule, SharedModule, ToastModule, ConfirmDialogModule],
  templateUrl: './list.component.html',
  styleUrl: './list.component.scss',
  providers: [ConfirmationService, MessageService],
})
export class OrderListComponent implements OnInit {
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
      header: 'Tipo',
      field: 'type',
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
  callToAction: CallToAction<Order>[] = [
    {
      type: 'button',
      size: 'small',
      icon: 'pi pi-pencil',
      outlined: true,
      pTooltip: 'Editar',
      tooltipPosition: 'bottom',
      click: (rowData: Order) => this.buttonEditOrder(rowData.id),
    },
    {
      type: 'button',
      size: 'small',
      icon: 'pi pi-trash',
      outlined: true,
      pTooltip: 'Eliminar',
      tooltipPosition: 'bottom',
      click: (rowData: Order, event?: Event) =>
        this.buttonDeleteOrder(rowData.id, event!),
    },
  ];

  formGroup: FormGroup = new FormGroup({
    search: new FormControl<string | null>(null),
  });

  constructor(
    private readonly messageService: MessageService,
    private readonly confirmationService: ConfirmationService,
    private readonly loadingService: LoadingService,
    private readonly ordersService: OrdersService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.restoreFilters();
    this.getOrders(this.limit, this.page, this.search);
    this.formGroup
      .get('search')
      ?.valueChanges.pipe(debounceTime(600))
      .subscribe((value: any) => {
        this.search = value ? value : '';
        this.loadingService.sendLoadingState(true);
        this.getOrders(this.limit, 1, this.search);
      });
  }

  restoreFilters() {
    const savedState = this.ordersService.getFilterState();
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
    this.ordersService.clearFilterState();
    this.getOrders(this.limit, 1, '');
  }

  async getOrders(
    limit = this.limit,
    page = this.page,
    name = this.search,
  ): Promise<void> {
    this.updatePage(page);
    this.ordersService.callGetList(limit, page, name).subscribe();
    setTimeout(() => {
      this.loadingService.sendLoadingState(false);
    }, 600);
  }

  async onPageSelected(paginate: PaginatorState): Promise<void> {
    this.limit = paginate.rows ?? 10;
    this.updatePage((paginate.page ?? 0) + 1);
    this.getOrders(this.limit, this.page, this.search);
  }

  get orders(): Observable<Order[]> {
    return this.ordersService.getList();
  }

  get total(): Observable<number> {
    return this.ordersService.getTotal();
  }

  buttonCreateOrder(): void {
    this.router.navigate(['/finance/orders/register']);
  }

  buttonEditOrder(id: number): void {
    this.router.navigate(['/finance/orders/edit', id]);
  }

  buttonDeleteOrder(id: number, event: Event): void {
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
        this.ordersService.delete(id).subscribe(() => {
          showSuccess(this.messageService, 'La orden ha sido cancelada');
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
