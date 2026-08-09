import { CommonModule, DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { CardModule } from 'primeng/card';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';

import {
  ReportsService,
  SalesDailyPeriodReportApi,
} from '../../services/reports-service.service';

@Component({
  selector: 'app-sales-period-report',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    CardModule,
    TableModule,
    ButtonModule,
    SkeletonModule,
    CalendarModule,
    ToastModule,
    TooltipModule,
  ],
  providers: [DatePipe, MessageService],
  templateUrl: './sales-period-report.component.html',
  styleUrl: './sales-period-report.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SalesPeriodReportComponent implements OnInit {
  private readonly reportsService = inject(ReportsService);
  private readonly datePipe = inject(DatePipe);
  private readonly messageService = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);

  startDate = signal<Date>(this.startOfCurrentMonth());
  endDate = signal<Date>(new Date());
  loading = signal(false);
  report = signal<SalesDailyPeriodReportApi | null>(null);

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    const start = this.startDate();
    const end = this.endDate();

    if (start > end) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Rango inválido',
        detail: 'La fecha inicial no puede ser mayor que la fecha final.',
      });
      return;
    }

    const startStr = this.datePipe.transform(start, 'yyyy-MM-dd')!;
    const endStr = this.datePipe.transform(end, 'yyyy-MM-dd')!;

    this.loading.set(true);
    this.reportsService.getDailySalesPeriodReport(startStr, endStr).subscribe({
      next: res => {
        if (res.success) {
          this.report.set(res.data);
        } else {
          this.report.set(null);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: res.message ?? 'No se pudo cargar el reporte.',
          });
        }
        this.loading.set(false);
        this.cdr.markForCheck();
      },
      error: err => {
        this.report.set(null);
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail:
            err?.error?.message ??
            'No se pudo cargar el reporte del periodo seleccionado.',
        });
        this.cdr.markForCheck();
      },
    });
  }

  setCurrentMonth(): void {
    this.startDate.set(this.startOfCurrentMonth());
    this.endDate.set(new Date());
    this.loadData();
  }

  private startOfCurrentMonth(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
}
