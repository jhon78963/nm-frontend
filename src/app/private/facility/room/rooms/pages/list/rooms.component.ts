import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { debounceTime, Observable, Subject } from 'rxjs';

import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { PaginatorState } from 'primeng/paginator';
import { ToastModule } from 'primeng/toast';

import { ChangeStatusComponent } from '../../components/change-status/change-status.component';
import { LoadingService } from '../../../../../../services/loading.service';
import { RoomsFormComponent } from '../form/rooms-form.component';
import { RoomsService } from '../../services/rooms.service';
import { SharedModule } from '../../../../../../shared/shared.module';

import {
  CallToAction,
  Column,
} from '../../../../../../interfaces/table.interface';
import { AddImagesComponent } from '../../components/add/images/images.component';
import { AddReviewsComponent } from '../../components/add/reviews/reviews.component';

import { Image } from '../../../images/models/images.model';
import { Review } from '../../../reviews/models/reviews.model';
import { Room } from '../../models/rooms.model';

@Component({
  selector: 'app-rooms',
  standalone: true,
  imports: [CommonModule, ConfirmDialogModule, ToastModule, SharedModule],
  templateUrl: './rooms.component.html',
  styleUrl: './rooms.component.scss',
  providers: [ConfirmationService, DialogService, MessageService],
})
export class RoomsComponent implements OnInit, OnDestroy {
  roomModal: DynamicDialogRef | undefined;
  columns: Column[] = [];
  cellToAction: any;
  data: any[] = [];
  limit: number = 10;
  page: number = 1;
  description: string = '';
  callToAction: CallToAction<Room>[] = [
    {
      type: 'button',
      size: 'small',
      icon: 'pi pi-pencil',
      outlined: true,
      pTooltip: 'Editar',
      tooltipPosition: 'bottom',
      click: (rowData: Room) => this.roomEditButton(rowData.id),
    },
    {
      type: 'button',
      size: 'small',
      icon: 'pi pi-sync',
      outlined: true,
      pTooltip: 'Cambiar estado',
      tooltipPosition: 'bottom',
      click: (rowData: Room) => this.roomChangeStatusButton(rowData.id),
    },
    {
      type: 'button',
      size: 'small',
      icon: 'pi pi-images',
      outlined: true,
      pTooltip: 'Agregar imagenes',
      tooltipPosition: 'bottom',
      click: (rowData: Room) =>
        this.addRoomImageButton(rowData.id, rowData.images),
    },
    {
      type: 'button',
      size: 'small',
      icon: 'pi pi-comments',
      outlined: true,
      pTooltip: 'Agregar reseñas',
      tooltipPosition: 'bottom',
      click: (rowData: Room) =>
        this.addRoomReviewButton(rowData.id, rowData.reviews),
    },
    {
      type: 'button',
      size: 'small',
      icon: 'pi pi-trash',
      outlined: true,
      pTooltip: 'Eliminar',
      tooltipPosition: 'bottom',
      click: (rowData: Room, event?: Event) =>
        this.roomDeleteButton(rowData.id, event!),
    },
  ];

  private searchTermSubject = new Subject<string>();

  constructor(
    private readonly dialogService: DialogService,
    private readonly roomsService: RoomsService,
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
        header: 'Tipo de Habitación',
        field: 'roomType',
        clickable: false,
        image: false,
        money: false,
      },
      {
        header: 'Número de Habitación',
        field: 'roomName',
        clickable: false,
        image: false,
        money: false,
      },
      {
        header: 'Estado',
        field: 'roomStatus',
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

    this.getRooms(this.limit, this.page, this.description);
    this.searchTermSubject.pipe(debounceTime(600)).subscribe(() => {
      this.loadingService.sendLoadingState(true);
      this.getRooms(this.limit, this.page, this.description);
    });
  }

  ngOnDestroy(): void {
    if (this.roomModal) {
      this.roomModal.close();
    }
  }

  clearFilter(): void {
    this.description = '';
    this.onSearchTermChange('');
  }

  onSearchTermChange(term: any): void {
    this.searchTermSubject.next(term);
  }

  async getRooms(
    limit = this.limit,
    page = this.page,
    description = this.description,
  ): Promise<void> {
    this.updatePage(page);
    this.roomsService.callGetList(limit, page, description).subscribe();
    setTimeout(() => {
      this.loadingService.sendLoadingState(false);
    }, 600);
  }

  get rooms(): Observable<Room[]> {
    return this.roomsService.getList();
  }

  get total(): Observable<number> {
    return this.roomsService.getTotal();
  }

  async onPageSelected(event: PaginatorState) {
    this.updatePage((event.page ?? 0) + 1);
    this.getRooms(event.rows, this.page);
  }

  roomCreateButton(): void {
    this.roomModal = this.dialogService.open(RoomsFormComponent, {
      data: {},
      header: 'Crear',
    });

    this.roomModal.onClose.subscribe({
      next: value => {
        value && value?.success
          ? this.showSuccess('Habitación creada.')
          : value?.error
            ? this.showError(value?.error)
            : null;
      },
    });
  }

  roomEditButton(id: number): void {
    this.roomModal = this.dialogService.open(RoomsFormComponent, {
      data: { id },
      header: 'Editar',
    });

    this.roomModal.onClose.subscribe({
      next: value => {
        value && value?.success
          ? this.showSuccess('Habitación actualizada.')
          : value?.error
            ? this.showError(value?.error)
            : null;
      },
    });
  }

  roomChangeStatusButton(id: number): void {
    this.roomModal = this.dialogService.open(ChangeStatusComponent, {
      data: { id },
      header: 'Cambiar estado',
    });

    this.roomModal.onClose.subscribe({
      next: value => {
        value && value?.success
          ? this.showSuccess('Habitación actualizada.')
          : value?.error
            ? this.showError(value?.error)
            : null;
      },
    });
  }

  addRoomImageButton(id: number, images: Image[]) {
    this.roomModal = this.dialogService.open(AddImagesComponent, {
      data: { id, images },
      header: 'Agregar imágenes',
    });

    this.roomModal.onClose.subscribe({
      next: value => {
        value && value?.success
          ? this.showSuccess('Imágen agregada.')
          : value?.error
            ? this.showError(value?.error)
            : null;
      },
    });
  }

  addRoomReviewButton(id: number, reviews: Review[]) {
    this.roomModal = this.dialogService.open(AddReviewsComponent, {
      data: { id, reviews },
      header: 'Reseñas',
    });

    this.roomModal.onClose.subscribe({
      next: value => {
        value && value?.success
          ? this.showSuccess('Comodidad agregada.')
          : value?.error
            ? this.showError(value?.error)
            : null;
      },
    });
  }

  roomDeleteButton(id: number, event: Event) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Deseas eliminar esta reseña?',
      header: 'Eliminar reseña',
      icon: 'pi pi-info-circle',
      acceptButtonStyleClass: 'p-button-danger p-button-text',
      rejectButtonStyleClass: 'p-button-text p-button-text',
      acceptIcon: 'none',
      rejectIcon: 'none',

      accept: () => {
        this.roomsService.delete(id).subscribe(() => {
          this.showSuccess('La habitación ha sido eliminado');
        });
      },
      reject: () => {
        this.showError('No se eleminó la habitación, intenteló nuevamente');
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
