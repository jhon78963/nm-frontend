import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { debounceTime, Observable, Subject } from 'rxjs';

import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { PaginatorState } from 'primeng/paginator';
import { ToastModule } from 'primeng/toast';

import {
  CallToAction,
  Column,
} from '../../../../../../../interfaces/table.interface';
import { Hour } from '../../models/hours.model';

import { HoursService } from '../../services/hours.service';
import { LoadingService } from '../../../../../../../services/loading.service';

import { HoursFormComponent } from '../form/hours-form.component';
import { SharedModule } from '../../../../../../../shared/shared.module';

@Component({
  selector: 'app-hours',
  standalone: true,
  imports: [CommonModule, ConfirmDialogModule, ToastModule, SharedModule],
  templateUrl: './hours.component.html',
  styleUrl: './hours.component.scss',
  providers: [ConfirmationService, MessageService],
})
export class HoursComponent implements OnInit, OnDestroy {
  hourModal: DynamicDialogRef | undefined;
  columns: Column[] = [];
  cellToAction: any;
  data: any[] = [];
  limit: number = 10;
  page: number = 1;
  duration: string = '';
  callToAction: CallToAction<Hour>[] = [
    {
      type: 'button',
      size: 'small',
      icon: 'pi pi-pencil',
      outlined: true,
      pTooltip: 'Editar',
      tooltipPosition: 'bottom',
      click: (rowData: Hour) => this.buttonEditHour(rowData.id),
    },
    {
      type: 'button',
      size: 'small',
      icon: 'pi pi-trash',
      outlined: true,
      pTooltip: 'Eliminar',
      tooltipPosition: 'bottom',
      click: (rowData: Hour, event?: Event) =>
        this.buttonDeleteHour(rowData.id, event!),
    },
  ];

  private searchTermSubject = new Subject<string>();

  constructor(
    private readonly dialogService: DialogService,
    private readonly hoursService: HoursService,
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
        header: 'Duración',
        field: 'duration',
        clickable: false,
        image: false,
        money: false,
      },
      {
        header: 'Duración (Horas)',
        field: 'durationString',
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

    this.getHours(this.limit, this.page, this.duration);
    this.searchTermSubject.pipe(debounceTime(600)).subscribe(() => {
      this.loadingService.sendLoadingState(true);
      this.getHours(this.limit, this.page, this.duration);
    });
  }

  ngOnDestroy(): void {
    if (this.hourModal) {
      this.hourModal.close();
    }
  }

  clearFilter(): void {
    this.duration = '';
    this.onSearchTermChange('');
  }

  private updatePage(value: number): void {
    this.page = value;
  }

  onSearchTermChange(term: any): void {
    this.searchTermSubject.next(term);
  }

  async getHours(
    limit = this.limit,
    page = this.page,
    duration = this.duration,
  ): Promise<void> {
    this.updatePage(page);
    this.hoursService.callGetList(limit, page, duration).subscribe();
    setTimeout(() => {
      this.loadingService.sendLoadingState(false);
    }, 600);
  }

  get hours(): Observable<Hour[]> {
    return this.hoursService.getList();
  }

  get total(): Observable<number> {
    return this.hoursService.getTotal();
  }

  async onPageSelected(event: PaginatorState) {
    this.updatePage((event.page ?? 0) + 1);
    this.getHours(event.rows, this.page);
  }

  buttonAddHour(): void {
    this.hourModal = this.dialogService.open(HoursFormComponent, {
      data: {},
      header: 'Crear',
    });

    this.hourModal.onClose.subscribe({
      next: value => {
        value && value?.success
          ? this.showSuccess('Hora Creada.')
          : value?.error
            ? this.showError(value?.error)
            : null;
      },
    });
  }

  buttonEditHour(id: number): void {
    this.hourModal = this.dialogService.open(HoursFormComponent, {
      data: {
        id,
      },
      header: 'Editar',
    });

    this.hourModal.onClose.subscribe({
      next: value => {
        value && value?.success
          ? this.showSuccess('Hora editada.')
          : value?.error
            ? this.showError(value?.error)
            : null;
      },
    });
  }

  buttonDeleteHour(id: number, event: Event) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Deseas eliminar esta hora?',
      header: 'Eliminar hora',
      icon: 'pi pi-info-circle',
      acceptButtonStyleClass: 'p-button-danger p-button-text',
      rejectButtonStyleClass: 'p-button-text p-button-text',
      acceptIcon: 'none',
      rejectIcon: 'none',

      accept: () => {
        this.hoursService.delete(id).subscribe(() => {
          this.showSuccess('La hora ha sido eliminada');
        });
      },
      reject: () => {
        this.showError('No se eleminó la hora, intenteló nuevamente');
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
}
