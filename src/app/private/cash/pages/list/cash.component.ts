import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { SharedModule } from '../../../../shared/shared.module';
import { DialogService } from 'primeng/dynamicdialog';
import { CallToAction, Column } from '../../../../interfaces/table.interface';
import { Cash } from '../../models/cash.model';
import { CashesService } from '../../services/cashes.service';
import { LoadingService } from '../../../../services/loading.service';
import { formatDate } from '../../../../utils/dates';
import { Observable } from 'rxjs';
import { PaginatorState } from 'primeng/paginator';
import { Schedule } from '../../../reservation/models/schedule.model';
import { ReservationSchedulesService } from '../../../reservation/services/reservations/reservation-schedules.service';
import { CashService } from '../../../reservation/services/cash.service';
import { CashFormComponent } from '../form/cash-form.component';
import { showSuccess } from '../../../../utils/notifications';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-cash',
  standalone: true,
  imports: [CommonModule, SharedModule],
  templateUrl: './cash.component.html',
  styleUrl: './cash.component.scss',
  providers: [DatePipe, DialogService, MessageService],
})
export class CashListComponent implements OnInit {
  columns: Column[] = [
    {
      header: 'Fecha',
      field: 'date',
      clickable: false,
      image: false,
      money: false,
    },
    {
      header: 'Turno',
      field: 'schedule',
      clickable: false,
      image: false,
      money: false,
    },
    {
      header: 'Movimiento',
      field: 'cash',
      clickable: false,
      image: false,
      money: false,
    },

    {
      header: 'Monto',
      field: 'amount',
      clickable: false,
      image: false,
      money: true,
    },
    // {
    //   field: 'button',
    //   header: 'Acción',
    //   clickable: false,
    //   image: false,
    //   money: false,
    // },
  ];
  cellToAction: any;
  data: any[] = [];
  limit: number = 50;
  page: number = 1;
  startDate: Date = new Date();
  endDate: Date = new Date();
  callToAction: CallToAction<Cash>[] = [];

  schedules: Schedule[] = [{ id: 0, description: 'Todos' }];
  selectedSchedule: Schedule = this.schedules[0];

  constructor(
    private loadingService: LoadingService,
    private readonly cashesService: CashesService,
    private readonly dialogService: DialogService,
    private readonly cashService: CashService,
    private readonly datePipe: DatePipe,
    private readonly reservationSchedulesService: ReservationSchedulesService,
    private readonly messageService: MessageService,
  ) {}

  getCashesData(): void {
    this.getCashes(
      this.limit,
      this.page,
      this.selectedSchedule.id,
      formatDate(this.startDate, this.datePipe),
      formatDate(this.endDate, this.datePipe),
    );
  }

  ngOnInit(): void {
    this.getSchedules();
    this.getCashesData();
  }

  getSchedules() {
    this.reservationSchedulesService.getSchedules().subscribe({
      next: (schedules: Schedule[]) => {
        this.schedules = schedules;
        if (schedules.length > 1) {
          this.cashService.currentSchedule().subscribe({
            next: (schedule: Schedule) => {
              this.selectedSchedule = schedule;
              this.getCashesData();
            },
          });
        }
      },
    });
  }

  filterSchedule(schedule: Schedule) {
    this.selectedSchedule = schedule;
    this.getCashesData();
  }

  filterStartDate(startDate: Date) {
    this.startDate = startDate;
    this.getCashesData();
  }

  filterEndDate(endDate: Date) {
    this.endDate = endDate;
    this.getCashesData();
  }

  async getCashes(
    limit = this.limit,
    page = this.page,
    schedule = this.selectedSchedule.id,
    startDate = formatDate(this.startDate, this.datePipe),
    endDate = formatDate(this.endDate, this.datePipe),
  ): Promise<void> {
    this.updatePage(page);
    this.cashesService
      .callGetList(limit, page, schedule, startDate, endDate)
      .subscribe();
    setTimeout(() => {
      this.loadingService.sendLoadingState(false);
    }, 600);
  }

  async onPageSelected(event: PaginatorState) {
    this.updatePage((event.page ?? 0) + 1);
    this.getCashes(event.rows, this.page);
  }

  get cashes(): Observable<Cash[]> {
    return this.cashesService.getList();
  }

  get total(): Observable<number> {
    return this.cashesService.getTotal();
  }

  private updatePage(value: number): void {
    this.page = value;
  }

  incomeCashCreate() {
    const modal = this.dialogService.open(CashFormComponent, {
      header: 'Registrar ingreso',
      data: {
        type: 2,
      },
    });

    modal.onClose.subscribe({
      next: value => {
        if (value && value?.success) {
          showSuccess(this.messageService, 'Ingreso registrado.');
          this.cashService.getCashTotal().subscribe();
          this.getCashesData();
        }
      },
    });
  }

  expenseCashCreate() {
    const modal = this.dialogService.open(CashFormComponent, {
      header: 'Registrar salida',
      data: {
        type: 3,
      },
    });

    modal.onClose.subscribe({
      next: value => {
        if (value && value?.success) {
          showSuccess(this.messageService, 'Salida registrada.');
          this.cashService.getCashTotal().subscribe();
          this.getCashesData();
        }
      },
    });
  }
}
