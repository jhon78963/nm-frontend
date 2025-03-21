import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { debounceTime, finalize, Observable, Subject } from 'rxjs';

import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { PaginatorState } from 'primeng/paginator';
import { ToastModule } from 'primeng/toast';

import { ImagesService } from '../../services/images.service';
import { LoadingService } from '../../../../../../services/loading.service';

import { Image } from '../../models/images.model';
import {
  CallToAction,
  Column,
} from '../../../../../../interfaces/table.interface';
import { SharedModule } from '../../../../../../shared/shared.module';
import { ImagesShowComponent } from '../show/images-show.component';
import { ProgressSpinnerService } from '../../../../../../services/progress-spinner.service';

@Component({
  selector: 'app-images',
  standalone: true,
  imports: [CommonModule, ConfirmDialogModule, ToastModule, SharedModule],
  templateUrl: './images.component.html',
  styleUrl: './images.component.scss',
  providers: [ConfirmationService, DialogService, MessageService],
})
export class ImagesComponent implements OnInit, OnDestroy {
  imageModal: DynamicDialogRef | undefined;
  columns: Column[] = [];
  cellToAction: any;
  data: any[] = [];
  limit: number = 10;
  page: number = 1;
  description: string = '';
  callToAction: CallToAction<Image>[] = [
    {
      type: 'button',
      size: 'small',
      icon: 'pi pi-search',
      outlined: true,
      pTooltip: 'Mostrar',
      tooltipPosition: 'bottom',
      click: (rowData: Image) => this.showImageButton(rowData),
    },
    {
      type: 'button',
      size: 'small',
      icon: 'pi pi-trash',
      outlined: true,
      pTooltip: 'Eliminar',
      tooltipPosition: 'bottom',
      click: (rowData: Image, event?: Event) =>
        this.deleteImageButton(rowData.id, event!),
    },
  ];

  private searchTermSubject = new Subject<string>();

  constructor(
    private readonly dialogService: DialogService,
    private readonly imagesService: ImagesService,
    public messageService: MessageService,
    private loadingService: LoadingService,
    private confirmationService: ConfirmationService,
    private readonly progressSpinnerService: ProgressSpinnerService,
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
        header: 'Thumbnail',
        field: 'imagePath',
        clickable: false,
        image: true,
        money: false,
      },
      {
        header: 'Imagen',
        field: 'imageName',
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

    this.getImages(this.limit, this.page, this.description);
    this.searchTermSubject.pipe(debounceTime(600)).subscribe(() => {
      this.loadingService.sendLoadingState(true);
      this.getImages(this.limit, this.page, this.description);
    });
  }

  ngOnDestroy(): void {
    if (this.imageModal) {
      this.imageModal.close();
    }
  }

  clearFilter(): void {
    this.description = '';
    this.onSearchTermChange('');
  }

  onSearchTermChange(term: any): void {
    this.searchTermSubject.next(term);
  }

  async getImages(
    limit = this.limit,
    page = this.page,
    description = this.description,
  ): Promise<void> {
    this.updatePage(page);
    this.imagesService.callGetList(limit, page, description).subscribe();
    setTimeout(() => {
      this.loadingService.sendLoadingState(false);
    }, 600);
  }

  get images(): Observable<Image[]> {
    return this.imagesService.getList();
  }

  get total(): Observable<number> {
    return this.imagesService.getTotal();
  }

  showImageButton(image: Image) {
    this.imageModal = this.dialogService.open(ImagesShowComponent, {
      data: { image },
      header: `${image.imageName}`,
    });
  }

  deleteImageButton(id: number, event: Event) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Deseas eliminar esta imagen?',
      header: 'Eliminar imagen',
      icon: 'pi pi-info-circle',
      acceptButtonStyleClass: 'p-button-danger p-button-text',
      rejectButtonStyleClass: 'p-button-text p-button-text',
      acceptIcon: 'none',
      rejectIcon: 'none',

      accept: () => {
        this.progressSpinnerService.show();
        this.imagesService
          .delete(id)
          .pipe(
            finalize(() => {
              this.progressSpinnerService.hidden();
            }),
          )
          .subscribe(() => {
            this.showSuccess('La imagen ha sido eliminado');
          });
      },
      reject: () => {
        this.showError('No se eleminó la imagen, intenteló nuevamente');
        this.progressSpinnerService.hidden();
      },
    });
  }

  async onPageSelected(event: PaginatorState) {
    this.updatePage((event.page ?? 0) + 1);
    this.getImages(event.rows, this.page);
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
