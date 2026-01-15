import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { SharedModule } from '../../../../../shared/shared.module';
import { RouterModule } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import {
  CallToAction,
  Column,
} from '../../../../../interfaces/table.interface';
import { Color } from '../../models/colors.model';
import { FormControl, FormGroup } from '@angular/forms';
import { LoadingService } from '../../../../../services/loading.service';
import { ColorsService } from '../../services/colors.service';
import { debounceTime, Observable } from 'rxjs';
import { PaginatorState } from 'primeng/paginator';
import {
  showError,
  showSuccess,
  showToastWarn,
} from '../../../../../utils/notifications';
import { ColorsCreateFormComponent } from '../form/colors.component';

@Component({
  selector: 'app-colors',
  standalone: true,
  imports: [
    CommonModule,
    ToastModule,
    ConfirmDialogModule,
    SharedModule,
    RouterModule,
  ],
  templateUrl: './colors.component.html',
  styleUrl: './colors.component.scss',
  providers: [ConfirmationService, DialogService, MessageService],
})
export class ColorListComponent implements OnInit, OnDestroy {
  colorModal: DynamicDialogRef | undefined;
  columns: Column[] = [
    {
      header: '#',
      field: 'id',
      clickable: false,
      image: false,
      money: false,
      color: false,
    },
    {
      header: 'Color',
      field: 'description',
      clickable: false,
      image: false,
      money: false,
      color: false,
    },
    {
      header: 'Hash',
      field: 'hash',
      clickable: false,
      image: false,
      money: false,
      color: true,
    },
    {
      header: 'Acción',
      field: 'button',
      clickable: false,
      image: false,
      money: false,
      color: false,
    },
  ];
  cellToAction: any;
  limit: number = 10;
  page: number = 1;
  search: string = '';
  callToAction: CallToAction<Color>[] = [
    {
      type: 'button',
      size: 'small',
      icon: 'pi pi-pencil',
      outlined: true,
      pTooltip: 'Editar',
      tooltipPosition: 'bottom',
      click: (rowData: Color) => this.editColorButton(rowData.id),
    },
    {
      type: 'button',
      size: 'small',
      icon: 'pi pi-trash',
      outlined: true,
      pTooltip: 'Eliminar',
      tooltipPosition: 'bottom',
      click: (rowData: Color, event?: Event) =>
        this.deleteColorButton(rowData.id, event!),
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
    private readonly colorsService: ColorsService,
  ) {}

  ngOnInit(): void {
    this.restoreFilters();
    this.getColors(this.limit, this.page, this.search);
    this.formGroup
      .get('search')
      ?.valueChanges.pipe(debounceTime(600))
      .subscribe((value: any) => {
        this.search = value ? value : '';
        this.loadingService.sendLoadingState(true);
        // Reset a pagina 1 al buscar
        this.getColors(this.limit, 1, this.search);
      });
  }

  ngOnDestroy(): void {
    if (this.colorModal) {
      this.colorModal.close();
    }
  }

  restoreFilters() {
    const savedState = this.colorsService.getFilterState();
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
    this.colorsService.clearFilterState();
    this.getColors(this.limit, 1, '');
  }

  async getColors(
    limit = this.limit,
    page = this.page,
    search = this.search,
  ): Promise<void> {
    this.updatePage(page);
    this.colorsService.callGetList(limit, page, search).subscribe();
    setTimeout(() => {
      this.loadingService.sendLoadingState(false);
    }, 600);
  }

  async onPageSelected(paginate: PaginatorState): Promise<void> {
    this.limit = paginate.rows ?? 10;
    this.updatePage((paginate.page ?? 0) + 1);
    this.getColors(this.limit, this.page, this.search);
  }

  get colors(): Observable<Color[]> {
    return this.colorsService.getList();
  }

  get total(): Observable<number> {
    return this.colorsService.getTotal();
  }

  addColorButton() {
    this.colorModal = this.dialogService.open(ColorsCreateFormComponent, {
      data: {},
      header: 'Crear Color',
      styleClass: 'dialog-custom-form',
    });

    this.colorModal.onClose.subscribe({
      next: value => {
        value && value?.success
          ? showSuccess(this.messageService, 'Color Creado.')
          : value?.error
            ? showError(this.messageService, value?.error)
            : null;
      },
    });
  }

  editColorButton(id: number) {
    this.colorModal = this.dialogService.open(ColorsCreateFormComponent, {
      data: { id },
      header: 'Editar Color',
      styleClass: 'dialog-custom-form',
    });

    this.colorModal.onClose.subscribe({
      next: value => {
        value && value?.success
          ? showSuccess(this.messageService, 'Color actualizado.')
          : value?.error
            ? showError(this.messageService, value?.error)
            : null;
      },
    });
  }

  deleteColorButton(id: number, event: Event) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Deseas eliminar este color?',
      header: 'Eliminar Color',
      icon: 'pi pi-info-circle',
      acceptButtonStyleClass: 'p-button-danger p-button-text',
      rejectButtonStyleClass: 'p-button-text p-button-text',
      acceptIcon: 'none',
      rejectIcon: 'none',
      acceptLabel: 'Sí',
      rejectLabel: 'No',
      accept: () => {
        this.colorsService.delete(id).subscribe(() => {
          showSuccess(this.messageService, 'El color ha sido eliminada');
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
