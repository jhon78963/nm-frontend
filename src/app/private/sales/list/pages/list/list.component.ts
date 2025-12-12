import { Component, OnDestroy, OnInit } from '@angular/core';
import { Sale } from '../../models/sales.model';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import {
  CallToAction,
  Column,
} from '../../../../../interfaces/table.interface';
import { LoadingService } from '../../../../../services/loading.service';
import { SalesService } from '../../services/sales.service';
import { debounceTime, Observable } from 'rxjs';
import { PaginatorState } from 'primeng/paginator';
import { showSuccess, showToastWarn } from '../../../../../utils/notifications';
import { SharedModule } from '../../../../../shared/shared.module';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

@Component({
  selector: 'app-list',
  standalone: true,
  imports: [CommonModule, SharedModule, ToastModule, ConfirmDialogModule],
  templateUrl: './list.component.html',
  styleUrl: './list.component.scss',
  providers: [ConfirmationService, MessageService, DialogService],
})
export class SaleListComponent implements OnInit, OnDestroy {
  userModal: DynamicDialogRef | undefined;
  columns: Column[] = [];
  cellToAction: any;
  limit: number = 10;
  page: number = 1;
  search: string = '';
  callToAction: CallToAction<Sale>[] = [
    // {
    //   type: 'button',
    //   size: 'small',
    //   icon: 'pi pi-pencil',
    //   outlined: true,
    //   pTooltip: 'Editar',
    //   tooltipPosition: 'bottom',
    //   click: (rowData: Sale) => this.buttonEditSale(rowData.id),
    // },
    {
      type: 'button',
      size: 'small',
      icon: 'pi pi-trash',
      outlined: true,
      pTooltip: 'Eliminar',
      tooltipPosition: 'bottom',
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
  ) {}

  ngOnInit(): void {
    this.columns = [
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
        money: false,
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

    this.getSales(this.limit, this.page, this.search);
    this.formGroup
      .get('search')
      ?.valueChanges.pipe(debounceTime(600))
      .subscribe((value: any) => {
        this.search = value ? value : '';
        this.loadingService.sendLoadingState(true);
        this.getSales(this.limit, this.page, this.search);
      });
  }

  ngOnDestroy(): void {
    if (this.userModal) {
      this.userModal.close();
    }
  }

  clearFilter(): void {
    this.search = '';
    this.loadingService.sendLoadingState(true);
    this.formGroup.get('search')?.setValue('');
  }

  async getSales(
    limit = this.limit,
    page = this.page,
    name = this.search,
  ): Promise<void> {
    this.updatePage(page);
    this.salesService.callGetList(limit, page, name).subscribe();
    setTimeout(() => {
      this.loadingService.sendLoadingState(false);
    }, 600);
  }

  async onPageSelected(paginate: PaginatorState): Promise<void> {
    this.updatePage((paginate.page ?? 0) + 1);
    this.getSales(paginate.rows, this.page);
  }

  get sales(): Observable<Sale[]> {
    return this.salesService.getList();
  }

  get total(): Observable<number> {
    return this.salesService.getTotal();
  }

  // buttonAddUser(): void {
  //   this.userModal = this.dialogService.open(UserFormComponent, {
  //     data: {},
  //     header: 'Crear usuario',
  //     styleClass: 'dialog-custom-form',
  //   });

  //   this.userModal.onClose.subscribe({
  //     next: value => {
  //       value && value?.success
  //         ? showSuccess(this.messageService, 'Usuario Creado.')
  //         : value?.error
  //           ? showError(this.messageService, value?.error)
  //           : null;
  //     },
  //   });
  // }

  // buttonEditUSer(id: number): void {
  //   this.userModal = this.dialogService.open(UserFormComponent, {
  //     data: { id },
  //     header: 'Editar usuario',
  //     styleClass: 'dialog-custom-form',
  //   });

  //   this.userModal.onClose.subscribe({
  //     next: value => {
  //       value && value?.success
  //         ? showSuccess(this.messageService, 'Usuario actualizado.')
  //         : value?.error
  //           ? showError(this.messageService, value?.error)
  //           : null;
  //     },
  //   });
  // }

  buttonDeleteSale(id: number, event: Event): void {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Deseas cancelar esta venta?',
      header: 'Eliminar usuario',
      icon: 'pi pi-info-circle',
      acceptButtonStyleClass: 'p-button-danger p-button-text',
      rejectButtonStyleClass: 'p-button-text p-button-text',
      acceptIcon: 'none',
      rejectIcon: 'none',
      acceptLabel: 'Sí',
      rejectLabel: 'No',
      accept: () => {
        this.salesService.delete(id).subscribe(() => {
          showSuccess(this.messageService, 'La venta ha sido cancelada');
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
