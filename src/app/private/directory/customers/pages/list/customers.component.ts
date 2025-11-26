import { Component, OnDestroy, OnInit } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { PaginatorState } from 'primeng/paginator';
import { debounceTime, Observable } from 'rxjs';
import {
  CallToAction,
  Column,
} from '../../../../../interfaces/table.interface';
import { LoadingService } from '../../../../../services/loading.service';
import {
  showError,
  showSuccess,
  showToastWarn,
} from '../../../../../utils/notifications';
import { Customer } from '../../models/customers.model';
import { CustomersService } from '../../services/customers.service';
import { CustomerFormComponent } from '../form/customers-form.component';
import { FormControl, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-customer-list',
  templateUrl: './customers.component.html',
  styleUrl: './customers.component.scss',
  providers: [ConfirmationService, MessageService],
})
export class CustomerListComponent implements OnInit, OnDestroy {
  customerModal: DynamicDialogRef | undefined;
  columns: Column[] = [];
  cellToAction: any;
  limit: number = 10;
  page: number = 1;
  name: string = '';
  callToAction: CallToAction<Customer>[] = [
    {
      type: 'button',
      size: 'small',
      icon: 'pi pi-pencil',
      outlined: true,
      pTooltip: 'Editar',
      tooltipPosition: 'bottom',
      click: (rowData: Customer) => this.buttonEditCustomer(rowData.id),
    },
    {
      type: 'button',
      size: 'small',
      icon: 'pi pi-trash',
      outlined: true,
      pTooltip: 'Eliminar',
      tooltipPosition: 'bottom',
      click: (rowData: Customer, event?: Event) =>
        this.buttonDeleteCustomer(rowData.id, event!),
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
    private readonly customersService: CustomersService,
  ) {}

  ngOnInit(): void {
    this.columns = [
      {
        header: 'DNI',
        field: 'dni',
        clickable: false,
        image: false,
        money: false,
      },
      {
        header: 'Nombres',
        field: 'name',
        clickable: false,
        image: false,
        money: false,
      },
      {
        header: 'Apellidos',
        field: 'surname',
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

    this.getCustomers(this.limit, this.page, this.name);
    this.formGroup
      .get('search')
      ?.valueChanges.pipe(debounceTime(600))
      .subscribe((value: any) => {
        this.name = value ? value : '';
        this.loadingService.sendLoadingState(true);
        this.getCustomers(this.limit, this.page, this.name);
      });
  }

  ngOnDestroy(): void {
    if (this.customerModal) {
      this.customerModal.close();
    }
  }

  clearFilter(): void {
    this.name = '';
    this.loadingService.sendLoadingState(true);
    this.formGroup.get('search')?.setValue('');
  }

  async getCustomers(
    limit = this.limit,
    page = this.page,
    name = this.name,
  ): Promise<void> {
    this.updatePage(page);
    this.customersService.callGetList(limit, page, name).subscribe();
    setTimeout(() => {
      this.loadingService.sendLoadingState(false);
    }, 600);
  }

  async onPageSelected(paginate: PaginatorState): Promise<void> {
    this.updatePage((paginate.page ?? 0) + 1);
    this.getCustomers(paginate.rows, this.page);
  }

  get customers(): Observable<Customer[]> {
    return this.customersService.getList();
  }

  get total(): Observable<number> {
    return this.customersService.getTotal();
  }

  buttonAddCustomer(): void {
    this.customerModal = this.dialogService.open(CustomerFormComponent, {
      data: {},
      header: 'Crear cliente',
      styleClass: 'dialog-custom-form',
    });

    this.customerModal.onClose.subscribe({
      next: value => {
        value && value?.success
          ? showSuccess(this.messageService, 'Cliente Creado.')
          : value?.error
            ? showError(this.messageService, value?.error)
            : null;
      },
    });
  }

  buttonEditCustomer(id: number): void {
    this.customerModal = this.dialogService.open(CustomerFormComponent, {
      data: { id },
      header: 'Editar cliente',
      styleClass: 'dialog-custom-form',
    });

    this.customerModal.onClose.subscribe({
      next: value => {
        value && value?.success
          ? showSuccess(this.messageService, 'Cliente actualizado.')
          : value?.error
            ? showError(this.messageService, value?.error)
            : null;
      },
    });
  }

  buttonDeleteCustomer(id: number, event: Event): void {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Deseas eliminar este cliente?',
      header: 'Eliminar cliente',
      icon: 'pi pi-info-circle',
      acceptButtonStyleClass: 'p-button-danger p-button-text',
      rejectButtonStyleClass: 'p-button-text p-button-text',
      acceptIcon: 'none',
      rejectIcon: 'none',
      acceptLabel: 'Sí',
      rejectLabel: 'No',
      accept: () => {
        this.customersService.delete(id).subscribe(() => {
          showSuccess(this.messageService, 'El cliente ha sido eliminado');
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
