import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastModule } from 'primeng/toast';
import { SharedModule } from '../../../../../shared/shared.module';
import { DialogService } from 'primeng/dynamicdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import {
  CallToAction,
  Column,
} from '../../../../../interfaces/table.interface';
import { Inventory } from '../../models/inventory.model';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { InventoriesService } from '../../services/inventories.service';
import { LoadingService } from '../../../../../services/loading.service';
import { PaginatorState } from 'primeng/paginator';
import { debounceTime, Observable } from 'rxjs';
import { TooltipModule } from 'primeng/tooltip';
import { InventoryFormComponent } from '../form/inventory-form.component';
import { showError, showSuccess } from '../../../../../utils/notifications';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SharedModule,
    ToastModule,
    TooltipModule,
    ConfirmDialogModule,
  ],
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.scss',
  providers: [DialogService, ConfirmationService, MessageService],
})
export class InventoryListComponent implements OnInit {
  columns: Column[] = [
    {
      header: 'Descripción',
      field: 'description',
      clickable: false,
      image: false,
      money: false,
    },
    {
      header: 'Cantidad',
      field: 'stock',
      clickable: false,
      image: false,
      money: false,
    },
    {
      header: 'Cantidad en uso',
      field: 'stockInUse',
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
  cellToAction: any;
  data: any[] = [];
  limit: number = 10;
  page: number = 1;
  callToAction: CallToAction<Inventory>[] = [
    {
      type: 'button',
      size: 'small',
      icon: 'pi pi-pencil',
      outlined: true,
      pTooltip: 'Editar',
      tooltipPosition: 'bottom',
      click: (rowData: Inventory) => this.updateInventoryButton(rowData.id),
    },
    {
      type: 'button',
      size: 'small',
      icon: 'pi pi-trash',
      outlined: true,
      pTooltip: 'Eliminar',
      tooltipPosition: 'bottom',
      click: (rowData: Inventory, event?: Event) =>
        this.deleteInventoryButton(rowData.id!, event!),
    },
  ];

  formGroup = new FormGroup({
    description: new FormControl(),
  });

  constructor(
    private readonly dialogService: DialogService,
    private readonly inventoriesService: InventoriesService,
    private readonly loadingService: LoadingService,
    private readonly confirmationService: ConfirmationService,
    private readonly messageService: MessageService,
  ) {}

  ngOnInit(): void {
    this.getInventories(this.limit, this.page, this.description);
    this.formGroup
      .get('description')
      ?.valueChanges.pipe(debounceTime(400))
      .subscribe(() => {
        this.getInventories(this.limit, this.page, this.description);
      });
  }

  async getInventories(
    limit = this.limit,
    page = this.page,
    description = this.description,
  ): Promise<void> {
    this.updatePage(page);
    this.inventoriesService.callGetList(limit, page, description).subscribe();
    setTimeout(() => {
      this.loadingService.sendLoadingState(false);
    }, 600);
  }

  async onPageSelected(event: PaginatorState) {
    this.updatePage((event.page ?? 0) + 1);
    this.getInventories(event.rows, this.page);
  }

  get description(): string {
    return this.formGroup.get('description')?.value;
  }

  get inventories(): Observable<Inventory[]> {
    return this.inventoriesService.getList();
  }

  get total(): Observable<number> {
    return this.inventoriesService.getTotal();
  }

  clearFilter(): void {
    this.formGroup.get('description')?.setValue(null);
  }

  createInventoryButton() {
    const modal = this.dialogService.open(InventoryFormComponent, {
      header: 'Registrar',
      data: {},
    });

    modal.onClose.subscribe({
      next: (response: any) => {
        if (response.success) {
          this.getInventories(this.limit, this.page, this.description);
        }
      },
    });
  }

  updateInventoryButton(id?: number) {
    const modal = this.dialogService.open(InventoryFormComponent, {
      header: 'Registrar',
      data: { id },
    });

    modal.onClose.subscribe({
      next: (response: any) => {
        if (response.success) {
          this.getInventories(this.limit, this.page, this.description);
        }
      },
    });
  }

  deleteInventoryButton(id: number, event: Event) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Deseas eliminar este item?',
      header: 'Eliminar del inventario',
      icon: 'pi pi-info-circle',
      acceptButtonStyleClass: 'p-button-danger p-button-text',
      rejectButtonStyleClass: 'p-button-text p-button-text',
      acceptIcon: 'none',
      rejectIcon: 'none',

      accept: () => {
        this.inventoriesService.delete(id).subscribe(() => {
          showSuccess(this.messageService, 'El item ha sido eliminado!');
        });
      },
      reject: () => {
        showError(this.messageService, 'No se eleminó el item!');
      },
    });
  }

  private updatePage(value: number): void {
    this.page = value;
  }
}
