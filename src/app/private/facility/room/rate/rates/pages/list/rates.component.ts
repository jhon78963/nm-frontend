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
import { Rate } from '../../models/rates.model';

import { RatesService } from '../../services/rates.service';
import { LoadingService } from '../../../../../../../services/loading.service';

import { SharedModule } from '../../../../../../../shared/shared.module';
import { RatesFormComponent } from '../form/rates-form.component';

@Component({
  selector: 'app-rates',
  standalone: true,
  imports: [CommonModule, ConfirmDialogModule, ToastModule, SharedModule],
  templateUrl: './rates.component.html',
  styleUrl: './rates.component.scss',
  providers: [ConfirmationService, MessageService],
})
export class RatesComponent implements OnInit, OnDestroy {
  hourModal: DynamicDialogRef | undefined;
  columns: Column[] = [];
  cellToAction: any;
  data: any[] = [];
  limit: number = 10;
  page: number = 1;
  duration: string = '';
  callToAction: CallToAction<Rate>[] = [
    {
      type: 'button',
      size: 'small',
      icon: 'pi pi-pencil',
      outlined: true,
      pTooltip: 'Editar',
      tooltipPosition: 'bottom',
      click: (rowData: Rate) => this.buttonEditRate(rowData.id),
    },
    {
      type: 'button',
      size: 'small',
      icon: 'pi pi-trash',
      outlined: true,
      pTooltip: 'Eliminar',
      tooltipPosition: 'bottom',
      click: (rowData: Rate, event?: Event) =>
        this.buttonDeleteRate(rowData.id, event!),
    },
  ];

  private searchTermSubject = new Subject<string>();

  constructor(
    private readonly dialogService: DialogService,
    private readonly ratesService: RatesService,
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
        header: 'Día',
        field: 'day',
        clickable: false,
        image: false,
        money: false,
      },
      {
        header: 'Hora',
        field: 'hour',
        clickable: false,
        image: false,
        money: false,
      },
      {
        header: 'Precio',
        field: 'price',
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

    this.getRates(this.limit, this.page, this.duration);
    this.searchTermSubject.pipe(debounceTime(600)).subscribe(() => {
      this.loadingService.sendLoadingState(true);
      this.getRates(this.limit, this.page, this.duration);
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

  async getRates(
    limit = this.limit,
    page = this.page,
    duration = this.duration,
  ): Promise<void> {
    this.updatePage(page);
    this.ratesService.callGetList(limit, page, duration).subscribe();
    setTimeout(() => {
      this.loadingService.sendLoadingState(false);
    }, 600);
  }

  get rates(): Observable<Rate[]> {
    return this.ratesService.getList();
  }

  get total(): Observable<number> {
    return this.ratesService.getTotal();
  }

  async onPageSelected(event: PaginatorState) {
    this.updatePage((event.page ?? 0) + 1);
    this.getRates(event.rows, this.page);
  }

  buttonAddRate(): void {
    this.hourModal = this.dialogService.open(RatesFormComponent, {
      data: {},
      header: 'Crear',
    });

    this.hourModal.onClose.subscribe({
      next: value => {
        value && value?.success
          ? this.showSuccess('Tarifario Creado.')
          : value?.error
            ? this.showError(value?.error)
            : null;
      },
    });
  }

  buttonEditRate(id: number): void {
    this.hourModal = this.dialogService.open(RatesFormComponent, {
      data: {
        id,
      },
      header: 'Editar',
    });

    this.hourModal.onClose.subscribe({
      next: value => {
        value && value?.success
          ? this.showSuccess('Tarifario actualizado.')
          : value?.error
            ? this.showError(value?.error)
            : null;
      },
    });
  }

  buttonDeleteRate(id: number, event: Event) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Deseas eliminar este tarifario?',
      header: 'Eliminar tarifario',
      icon: 'pi pi-info-circle',
      acceptButtonStyleClass: 'p-button-danger p-button-text',
      rejectButtonStyleClass: 'p-button-text p-button-text',
      acceptIcon: 'none',
      rejectIcon: 'none',

      accept: () => {
        this.ratesService.delete(id).subscribe(() => {
          this.showSuccess('El tarifario ha sido eliminado');
        });
      },
      reject: () => {
        this.showError('No se eleminó el tarifario, intenteló nuevamente');
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
