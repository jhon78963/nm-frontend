import { ConfirmationService, MessageService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { debounceTime, Observable } from 'rxjs';
import { VendorsService } from '../../services/vendors.service';
import { LoadingService } from '../../../../../services/loading.service';
import { SharedModule } from '../../../../../shared/shared.module';
import { CommonModule } from '@angular/common';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { VendorsFormComponent } from '../form/vendors-form.component';
import {
  CallToAction,
  Column,
} from '../../../../../interfaces/table.interface';
import { Vendor } from '../../models/vendors.model';
import { PaginatorState } from 'primeng/paginator';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';

@Component({
  selector: 'app-vendors',
  templateUrl: './vendors.component.html',
  styleUrl: './vendors.component.scss',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ConfirmDialogModule,
    ToastModule,
    SharedModule,
  ],
  providers: [ConfirmationService, MessageService],
})
export class VendorListComponent implements OnInit, OnDestroy {
  vendorModal: DynamicDialogRef | undefined;
  columns: Column[] = [];
  cellToAction: any;
  data: any[] = [];
  limit: number = 10;
  page: number = 1;
  name: string = '';
  callToAction: CallToAction<Vendor>[] = [
    {
      type: 'button',
      size: 'small',
      icon: 'pi pi-pencil',
      outlined: true,
      pTooltip: 'Editar',
      tooltipPosition: 'bottom',
      click: (rowData: Vendor) => this.buttonEditVendor(rowData.id),
    },
    {
      type: 'button',
      size: 'small',
      icon: 'pi pi-trash',
      outlined: true,
      pTooltip: 'Eliminar',
      tooltipPosition: 'bottom',
      click: (rowData: Vendor, event?: Event) =>
        this.buttonDeleteVendor(rowData.id, event!),
    },
  ];

  formGroup: FormGroup = new FormGroup({
    search: new FormControl<string | null>(null),
  });

  constructor(
    private readonly dialogService: DialogService,
    private readonly vendorsService: VendorsService,
    public messageService: MessageService,
    private confirmationService: ConfirmationService,
    private loadingService: LoadingService,
  ) {}

  ngOnInit(): void {
    this.columns = [
      {
        header: '#',
        field: 'id',
        clickable: false,
        image: false,
        money: false,
      },
      {
        header: 'Nombre',
        field: 'name',
        clickable: false,
        image: false,
        money: false,
      },
      {
        header: 'Celular',
        field: 'phone',
        clickable: false,
        image: false,
        money: false,
      },
      {
        header: 'Dirección',
        field: 'address',
        clickable: false,
        image: false,
        money: false,
      },
      {
        header: 'Galería',
        field: 'local',
        clickable: false,
        image: false,
        money: false,
      },
      {
        field: 'button',
        header: 'Acción',
        clickable: false,
        image: false,
        money: false,
      },
    ];

    this.getVendors(this.limit, this.page, this.name);
    this.formGroup
      .get('search')
      ?.valueChanges.pipe(debounceTime(600))
      .subscribe((value: any) => {
        this.name = value ? value : '';
        this.loadingService.sendLoadingState(true);
        this.getVendors(this.limit, this.page, this.name);
      });
  }

  ngOnDestroy(): void {
    if (this.vendorModal) {
      this.vendorModal.close();
    }
  }

  clearFilter(): void {
    this.name = '';
    this.loadingService.sendLoadingState(true);
    this.formGroup.get('search')?.setValue('');
  }

  private updatePage(value: number): void {
    this.page = value;
  }

  async getVendors(
    limit = this.limit,
    page = this.page,
    name = this.name,
  ): Promise<void> {
    this.updatePage(page);
    this.vendorsService.callGetList(limit, page, name).subscribe();
    setTimeout(() => {
      this.loadingService.sendLoadingState(false);
    }, 600);
  }

  get vendors(): Observable<Vendor[]> {
    return this.vendorsService.getList();
  }

  get total(): Observable<number> {
    return this.vendorsService.getTotal();
  }

  async onPageSelected(event: PaginatorState) {
    this.updatePage((event.page ?? 0) + 1);
    this.getVendors(event.rows, this.page);
  }

  buttonAddVendor(): void {
    this.vendorModal = this.dialogService.open(VendorsFormComponent, {
      data: {},
      header: 'Crear',
    });

    this.vendorModal.onClose.subscribe({
      next: value => {
        value && value?.success
          ? this.showSuccess('Role Creado.')
          : value?.error
            ? this.showError(value?.error)
            : null;
      },
    });
  }

  buttonEditVendor(id: number): void {
    this.vendorModal = this.dialogService.open(VendorsFormComponent, {
      data: {
        id,
      },
      header: 'Editar',
    });

    this.vendorModal.onClose.subscribe({
      next: value => {
        value && value?.success
          ? this.showSuccess('Role actualizado.')
          : value?.error
            ? this.showError(value?.error)
            : null;
      },
    });
  }

  buttonDeleteVendor(id: number, event: Event) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Deseas eliminar este proveedor?',
      header: 'Eliminar proveedor',
      icon: 'pi pi-info-circle',
      acceptButtonStyleClass: 'p-button-danger p-button-text',
      rejectButtonStyleClass: 'p-button-text p-button-text',
      acceptIcon: 'none',
      rejectIcon: 'none',
      acceptLabel: 'Si',
      rejectLabel: 'No',
      accept: () => {
        this.vendorsService.delete(id).subscribe(() => {
          this.showSuccess('El rol ha sido eliminado');
        });
      },
      reject: () => {},
    });
  }

  showSuccess(message: string): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Confirmado',
      detail: message,
      life: 3000,
    });
  }

  showError(message: string): void {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: message,
      life: 3000,
    });
  }
}
