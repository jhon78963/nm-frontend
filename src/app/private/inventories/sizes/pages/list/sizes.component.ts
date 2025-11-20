import { Component, OnDestroy, OnInit } from '@angular/core';
import { SharedModule } from '../../../../../shared/shared.module';
import { CommonModule } from '@angular/common';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import {
  CallToAction,
  Column,
} from '../../../../../interfaces/table.interface';
import { Size } from '../../models/sizes.model';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { LoadingService } from '../../../../../services/loading.service';
import { SizesService } from '../../services/sizes.service';
import { PaginatorState } from 'primeng/paginator';
import { debounceTime, Observable } from 'rxjs';
import { RouterModule } from '@angular/router';
import { SizesSelectedService } from '../../services/sizes-selected.service';
import { FormControl, FormGroup } from '@angular/forms';
import { SizesCreateFormComponent } from '../form/sizes-form.component';
import {
  showError,
  showSuccess,
  showToastWarn,
} from '../../../../../utils/notifications';

@Component({
  selector: 'app-sizes',
  standalone: true,
  imports: [
    CommonModule,
    ToastModule,
    ConfirmDialogModule,
    SharedModule,
    RouterModule,
  ],
  templateUrl: './sizes.component.html',
  styleUrl: './sizes.component.scss',
  providers: [ConfirmationService, DialogService, MessageService],
})
export class SizeListComponent implements OnInit, OnDestroy {
  sizeModal: DynamicDialogRef | undefined;
  columns: Column[] = [
    {
      header: '#',
      field: 'id',
      clickable: false,
      image: false,
      money: false,
    },
    {
      header: 'Talla',
      field: 'description',
      clickable: false,
      image: false,
      money: false,
    },
    {
      header: 'Tipo de Talla',
      field: 'sizeType',
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
  sizeTypes: Size[] = [];
  selectedSizeTypeId: number = 1;
  callToAction: CallToAction<Size>[] = [
    {
      type: 'button',
      size: 'small',
      icon: 'pi pi-pencil',
      outlined: true,
      pTooltip: 'Editar',
      tooltipPosition: 'bottom',
      click: (rowData: Size) => this.editSizeButton(rowData.id),
    },
    {
      type: 'button',
      size: 'small',
      icon: 'pi pi-trash',
      outlined: true,
      pTooltip: 'Eliminar',
      tooltipPosition: 'bottom',
      click: (rowData: Size, event?: Event) =>
        this.deleteSizeButton(rowData.id, event!),
    },
  ];

  selectedSizes: any[] = [];
  selectedSizeTypeIds: number[] = [];

  formGroup: FormGroup = new FormGroup({
    search: new FormControl<string | null>(null),
  });

  constructor(
    private readonly dialogService: DialogService,
    private readonly messageService: MessageService,
    private readonly confirmationService: ConfirmationService,
    private readonly loadingService: LoadingService,
    private readonly sizesSelectedService: SizesSelectedService,
    private readonly sizesService: SizesService,
  ) {}

  ngOnInit(): void {
    this.getSizes(this.limit, this.page, this.search);
    this.formGroup
      .get('search')
      ?.valueChanges.pipe(debounceTime(600))
      .subscribe((value: any) => {
        this.search = value ? value : '';
        this.loadingService.sendLoadingState(true);
        this.getSizes(this.limit, this.page, this.search);
      });
    this.getSizeTypes();
  }

  ngOnDestroy(): void {
    if (this.sizeModal) {
      this.sizeModal.close();
    }
  }

  clearFilter(): void {
    this.search = '';
    this.loadingService.sendLoadingState(true);
    this.formGroup.get('search')?.setValue('');
  }

  handleSizeTypeSelection(ids: number[]) {
    this.selectedSizeTypeIds = ids;
    this.getSizes(this.limit, this.page, this.search, this.selectedSizeTypeIds);
  }

  async getSizes(
    limit = this.limit,
    page = this.page,
    name = this.search,
    sizeTypeIds = this.selectedSizeTypeIds,
  ): Promise<void> {
    this.updatePage(page);
    this.sizesService.callGetList(limit, page, name, sizeTypeIds).subscribe();
    setTimeout(() => {
      this.loadingService.sendLoadingState(false);
    }, 600);
  }

  getSizeTypes() {
    this.sizesSelectedService.getSizeTypes().subscribe({
      next: (sizeTypes: Size[]) => {
        this.sizeTypes = sizeTypes;
      },
    });
  }

  selectFilter(sizeTypeId: number) {
    this.selectedSizeTypeId = sizeTypeId;
  }

  async onPageSelected(paginate: PaginatorState): Promise<void> {
    this.updatePage((paginate.page ?? 0) + 1);
    this.getSizes(paginate.rows, this.page);
  }

  get sizes(): Observable<Size[]> {
    return this.sizesService.getList();
  }

  get total(): Observable<number> {
    return this.sizesService.getTotal();
  }

  addSizeButton() {
    this.sizeModal = this.dialogService.open(SizesCreateFormComponent, {
      data: {},
      header: 'Crear Talla',
      styleClass: 'dialog-custom-form',
    });

    this.sizeModal.onClose.subscribe({
      next: value => {
        value && value?.success
          ? showSuccess(this.messageService, 'Talla Creada.')
          : value?.error
            ? showError(this.messageService, value?.error)
            : null;
      },
    });
  }

  editSizeButton(id: number) {
    this.sizeModal = this.dialogService.open(SizesCreateFormComponent, {
      data: { id },
      header: 'Editar Talla',
      styleClass: 'dialog-custom-form',
    });

    this.sizeModal.onClose.subscribe({
      next: value => {
        value && value?.success
          ? showSuccess(this.messageService, 'Talla actualizada.')
          : value?.error
            ? showError(this.messageService, value?.error)
            : null;
      },
    });
  }

  deleteSizeButton(id: number, event: Event) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Deseas eliminar esta talla?',
      header: 'Eliminar Talla',
      icon: 'pi pi-info-circle',
      acceptButtonStyleClass: 'p-button-danger p-button-text',
      rejectButtonStyleClass: 'p-button-text p-button-text',
      acceptIcon: 'none',
      rejectIcon: 'none',
      acceptLabel: 'Sí',
      rejectLabel: 'No',
      accept: () => {
        this.sizesService.delete(id).subscribe(() => {
          showSuccess(this.messageService, 'La talla ha sido eliminada');
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
