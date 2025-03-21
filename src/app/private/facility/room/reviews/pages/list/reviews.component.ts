import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { debounceTime, Observable, Subject } from 'rxjs';

import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { PaginatorState } from 'primeng/paginator';
import { ToastModule } from 'primeng/toast';

import { ReviewsService } from '../../services/reviews.service';
import { LoadingService } from '../../../../../../services/loading.service';
import { ReviewsFormComponent } from '../form/reviews-form.component';

import { Review } from '../../models/reviews.model';
import {
  CallToAction,
  Column,
} from '../../../../../../interfaces/table.interface';
import { SharedModule } from '../../../../../../shared/shared.module';

@Component({
  selector: 'app-reviews',
  standalone: true,
  imports: [CommonModule, ConfirmDialogModule, ToastModule, SharedModule],
  templateUrl: './reviews.component.html',
  styleUrl: './reviews.component.scss',
  providers: [ConfirmationService, DialogService, MessageService],
})
export class ReviewsComponent implements OnInit, OnDestroy {
  reviewModal: DynamicDialogRef | undefined;
  columns: Column[] = [];
  cellToAction: any;
  data: any[] = [];
  limit: number = 10;
  page: number = 1;
  description: string = '';
  callToAction: CallToAction<Review>[] = [
    {
      type: 'button',
      size: 'small',
      icon: 'pi pi-pencil',
      outlined: true,
      pTooltip: 'Editar',
      tooltipPosition: 'bottom',
      click: (rowData: Review) => this.reviewEditButton(rowData.id),
    },
    {
      type: 'button',
      size: 'small',
      icon: 'pi pi-trash',
      outlined: true,
      pTooltip: 'Eliminar',
      tooltipPosition: 'bottom',
      click: (rowData: Review, event?: Event) =>
        this.reviewDeleteButton(rowData.id, event!),
    },
  ];

  private searchTermSubject = new Subject<string>();

  constructor(
    private readonly dialogService: DialogService,
    private readonly reviewsService: ReviewsService,
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
        header: 'Cliente',
        field: 'customerName',
        clickable: false,
        image: false,
        money: false,
      },
      {
        header: 'Reseña',
        field: 'description',
        clickable: false,
        image: false,
        money: false,
      },
      {
        header: 'Calificación',
        field: 'rating',
        clickable: false,
        image: false,
        money: false,
      },
      {
        header: 'Habitación',
        field: 'room',
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

    this.getReviews(this.limit, this.page, this.description);
    this.searchTermSubject.pipe(debounceTime(600)).subscribe(() => {
      this.loadingService.sendLoadingState(true);
      this.getReviews(this.limit, this.page, this.description);
    });
  }

  ngOnDestroy(): void {
    if (this.reviewModal) {
      this.reviewModal.close();
    }
  }

  clearFilter(): void {
    this.description = '';
    this.onSearchTermChange('');
  }

  onSearchTermChange(term: any): void {
    this.searchTermSubject.next(term);
  }

  async getReviews(
    limit = this.limit,
    page = this.page,
    description = this.description,
  ): Promise<void> {
    this.updatePage(page);
    this.reviewsService.callGetList(limit, page, description).subscribe();
    setTimeout(() => {
      this.loadingService.sendLoadingState(false);
    }, 600);
  }

  get reviews(): Observable<Review[]> {
    return this.reviewsService.getList();
  }

  get total(): Observable<number> {
    return this.reviewsService.getTotal();
  }

  async onPageSelected(event: PaginatorState) {
    this.updatePage((event.page ?? 0) + 1);
    this.getReviews(event.rows, this.page);
  }

  reviewCreateButton(): void {
    this.reviewModal = this.dialogService.open(ReviewsFormComponent, {
      data: {},
      header: 'Crear',
    });

    this.reviewModal.onClose.subscribe({
      next: value => {
        value && value?.success
          ? this.showSuccess('Reseña Creada.')
          : value?.error
            ? this.showError(value?.error)
            : null;
      },
    });
  }

  reviewEditButton(id: number): void {
    this.reviewModal = this.dialogService.open(ReviewsFormComponent, {
      data: {
        id,
      },
      header: 'Editar',
    });

    this.reviewModal.onClose.subscribe({
      next: value => {
        value && value?.success
          ? this.showSuccess('Reseña actualizada.')
          : value?.error
            ? this.showError(value?.error)
            : null;
      },
    });
  }

  reviewDeleteButton(id: number, event: Event) {
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
        this.reviewsService.delete(id).subscribe(() => {
          this.showSuccess('La reseña ha sido eliminado');
        });
      },
      reject: () => {
        this.showError('No se eleminó la reseña, intenteló nuevamente');
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
