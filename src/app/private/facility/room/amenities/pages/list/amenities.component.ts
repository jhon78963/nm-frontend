import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { debounceTime, Observable, Subject } from 'rxjs';

import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { PaginatorState } from 'primeng/paginator';
import { ToastModule } from 'primeng/toast';

import { AmenitiesService } from '../../services/amenities.service';
import { LoadingService } from '../../../../../../services/loading.service';
import { AmenitiesFormComponent } from '../form/amenities-form.component';

import { Amenity } from '../../models/amenities.model';
import {
  CallToAction,
  Column,
} from '../../../../../../interfaces/table.interface';
import { SharedModule } from '../../../../../../shared/shared.module';

@Component({
  selector: 'app-amenities',
  standalone: true,
  imports: [CommonModule, ConfirmDialogModule, ToastModule, SharedModule],
  templateUrl: './amenities.component.html',
  styleUrl: './amenities.component.scss',
  providers: [ConfirmationService, DialogService, MessageService],
})
export class AmenitiesComponent implements OnInit, OnDestroy {
  amenityModal: DynamicDialogRef | undefined;
  columns: Column[] = [];
  cellToAction: any;
  data: any[] = [];
  limit: number = 10;
  page: number = 1;
  description: string = '';
  callToAction: CallToAction<Amenity>[] = [
    {
      type: 'button',
      size: 'small',
      icon: 'pi pi-pencil',
      outlined: true,
      pTooltip: 'Editar',
      tooltipPosition: 'bottom',
      click: (rowData: Amenity) => this.buttonEditAmenity(rowData.id),
    },
    {
      type: 'button',
      size: 'small',
      icon: 'pi pi-trash',
      outlined: true,
      pTooltip: 'Eliminar',
      tooltipPosition: 'bottom',
      click: (rowData: Amenity, event?: Event) =>
        this.buttonDeleteAmenity(rowData.id, event!),
    },
  ];

  private searchTermSubject = new Subject<string>();

  constructor(
    private readonly dialogService: DialogService,
    private readonly amenitiesService: AmenitiesService,
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
        header: 'Descripción',
        field: 'description',
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

    this.getAmenities(this.limit, this.page, this.description);
    this.searchTermSubject.pipe(debounceTime(600)).subscribe(() => {
      this.loadingService.sendLoadingState(true);
      this.getAmenities(this.limit, this.page, this.description);
    });
  }

  ngOnDestroy(): void {
    if (this.amenityModal) {
      this.amenityModal.close();
    }
  }

  clearFilter(): void {
    this.description = '';
    this.onSearchTermChange('');
  }

  onSearchTermChange(term: any): void {
    this.searchTermSubject.next(term);
  }

  async getAmenities(
    limit = this.limit,
    page = this.page,
    description = this.description,
  ): Promise<void> {
    this.updatePage(page);
    this.amenitiesService.callGetList(limit, page, description).subscribe();
    setTimeout(() => {
      this.loadingService.sendLoadingState(false);
    }, 600);
  }

  get roles(): Observable<Amenity[]> {
    return this.amenitiesService.getList();
  }

  get total(): Observable<number> {
    return this.amenitiesService.getTotal();
  }

  async onPageSelected(event: PaginatorState) {
    this.updatePage((event.page ?? 0) + 1);
    this.getAmenities(event.rows, this.page);
  }

  buttonAddAmenity(): void {
    this.amenityModal = this.dialogService.open(AmenitiesFormComponent, {
      data: {},
      header: 'Crear',
    });

    this.amenityModal.onClose.subscribe({
      next: value => {
        value && value?.success
          ? this.showSuccess('Comodidad Creada.')
          : value?.error
            ? this.showError(value?.error)
            : null;
      },
    });
  }

  buttonEditAmenity(id: number): void {
    this.amenityModal = this.dialogService.open(AmenitiesFormComponent, {
      data: {
        id,
      },
      header: 'Editar',
    });

    this.amenityModal.onClose.subscribe({
      next: value => {
        value && value?.success
          ? this.showSuccess('Comodidad actualizada.')
          : value?.error
            ? this.showError(value?.error)
            : null;
      },
    });
  }

  buttonDeleteAmenity(id: number, event: Event) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Deseas eliminar esta comodidad?',
      header: 'Eliminar comodidad',
      icon: 'pi pi-info-circle',
      acceptButtonStyleClass: 'p-button-danger p-button-text',
      rejectButtonStyleClass: 'p-button-text p-button-text',
      acceptIcon: 'none',
      rejectIcon: 'none',

      accept: () => {
        this.amenitiesService.delete(id).subscribe(() => {
          this.showSuccess('La comodidad ha sido eliminado');
        });
      },
      reject: () => {
        this.showError('No se eleminó la comodidad, intenteló nuevamente');
      },
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

  private updatePage(value: number): void {
    this.page = value;
  }
}
