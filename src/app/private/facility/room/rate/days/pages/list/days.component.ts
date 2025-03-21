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
import { Day } from '../../models/days.model';

import { DaysService } from '../../services/days.service';
import { LoadingService } from '../../../../../../../services/loading.service';

import { DaysFormComponent } from '../form/days-form.component';
import { SharedModule } from '../../../../../../../shared/shared.module';

@Component({
  selector: 'app-days',
  standalone: true,
  imports: [CommonModule, ConfirmDialogModule, ToastModule, SharedModule],
  templateUrl: './days.component.html',
  styleUrl: './days.component.scss',
  providers: [ConfirmationService, MessageService],
})
export class DaysComponent implements OnInit, OnDestroy {
  dayModal: DynamicDialogRef | undefined;
  columns: Column[] = [];
  cellToAction: any;
  data: any[] = [];
  limit: number = 10;
  page: number = 1;
  duration: string = '';
  callToAction: CallToAction<Day>[] = [
    {
      type: 'button',
      size: 'small',
      icon: 'pi pi-pencil',
      outlined: true,
      pTooltip: 'Editar',
      tooltipPosition: 'bottom',
      click: (rowData: Day) => this.buttonEditDay(rowData.id),
    },
    {
      type: 'button',
      size: 'small',
      icon: 'pi pi-trash',
      outlined: true,
      pTooltip: 'Eliminar',
      tooltipPosition: 'bottom',
      click: (rowData: Day, event?: Event) =>
        this.buttonDeleteDay(rowData.id, event!),
    },
  ];

  private searchTermSubject = new Subject<string>();

  constructor(
    private readonly dialogService: DialogService,
    private readonly daysService: DaysService,
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
        header: 'Abreviación',
        field: 'abbreviation',
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

    this.getDays(this.limit, this.page, this.duration);
    this.searchTermSubject.pipe(debounceTime(600)).subscribe(() => {
      this.loadingService.sendLoadingState(true);
      this.getDays(this.limit, this.page, this.duration);
    });
  }

  ngOnDestroy(): void {
    if (this.dayModal) {
      this.dayModal.close();
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

  async getDays(
    limit = this.limit,
    page = this.page,
    duration = this.duration,
  ): Promise<void> {
    this.updatePage(page);
    this.daysService.callGetList(limit, page, duration).subscribe();
    setTimeout(() => {
      this.loadingService.sendLoadingState(false);
    }, 600);
  }

  get days(): Observable<Day[]> {
    return this.daysService.getList();
  }

  get total(): Observable<number> {
    return this.daysService.getTotal();
  }

  async onPageSelected(event: PaginatorState) {
    this.updatePage((event.page ?? 0) + 1);
    this.getDays(event.rows, this.page);
  }

  buttonAddDay(): void {
    this.dayModal = this.dialogService.open(DaysFormComponent, {
      data: {},
      header: 'Crear',
    });

    this.dayModal.onClose.subscribe({
      next: value => {
        value && value?.success
          ? this.showSuccess('Día Creadp.')
          : value?.error
            ? this.showError(value?.error)
            : null;
      },
    });
  }

  buttonEditDay(id: number): void {
    this.dayModal = this.dialogService.open(DaysFormComponent, {
      data: {
        id,
      },
      header: 'Editar',
    });

    this.dayModal.onClose.subscribe({
      next: value => {
        value && value?.success
          ? this.showSuccess('Día actualizado.')
          : value?.error
            ? this.showError(value?.error)
            : null;
      },
    });
  }

  buttonDeleteDay(id: number, event: Event) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Deseas eliminar este día?',
      header: 'Eliminar día',
      icon: 'pi pi-info-circle',
      acceptButtonStyleClass: 'p-button-danger p-button-text',
      rejectButtonStyleClass: 'p-button-text p-button-text',
      acceptIcon: 'none',
      rejectIcon: 'none',

      accept: () => {
        this.daysService.delete(id).subscribe(() => {
          this.showSuccess('El día ha sido eliminado');
        });
      },
      reject: () => {
        this.showError('No se eleminó el día, intenteló nuevamente');
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
