import { CommonModule, DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';

import {
  ReportsService,
  SalesDailyReportApi,
  SalesMonthlyReportApi,
} from '../../services/reports-service.service';

type ReportMode = 'daily' | 'monthly';

@Component({
  selector: 'app-sales-report',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    CardModule,
    TableModule,
    ChartModule,
    ButtonModule,
    SkeletonModule,
    CalendarModule,
    SelectButtonModule,
    TagModule,
    TooltipModule,
  ],
  providers: [DatePipe],
  templateUrl: './sales-report.component.html',
  styleUrl: './sales-report.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SalesReportComponent implements OnInit {
  private readonly reportsService = inject(ReportsService);
  private readonly datePipe = inject(DatePipe);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly modeOptions = [
    { label: 'Diario', value: 'daily' as ReportMode, icon: 'pi pi-calendar' },
    { label: 'Mensual', value: 'monthly' as ReportMode, icon: 'pi pi-chart-bar' },
  ];

  mode = signal<ReportMode>('daily');
  filterDate = signal<Date>(new Date());
  loading = signal(true);

  dailyReport = signal<SalesDailyReportApi | null>(null);
  monthlyReport = signal<SalesMonthlyReportApi | null>(null);

  mainChartData: unknown = null;
  mainChartOptions: unknown = null;
  paymentChartData: unknown = null;
  paymentChartOptions: unknown = null;

  periodLabel = computed(() => {
    if (this.mode() === 'daily') {
      return this.dailyReport()?.date ?? '—';
    }
    return this.monthlyReport()?.month_label ?? '—';
  });

  summary = computed(() => {
    if (this.mode() === 'daily') {
      return this.dailyReport()?.summary ?? null;
    }
    return this.monthlyReport()?.summary ?? null;
  });

  paymentBreakdown = computed(() => {
    if (this.mode() === 'daily') {
      return this.dailyReport()?.payment_breakdown ?? [];
    }
    return this.monthlyReport()?.payment_breakdown ?? [];
  });

  cashSharePercent = computed(() => {
    const summary = this.summary();
    if (!summary || summary.total_amount <= 0) {
      return 0;
    }
    return Math.round((summary.cash / summary.total_amount) * 100);
  });

  ngOnInit(): void {
    this.initChartOptions();
    this.loadData();
  }

  onModeChange(): void {
    this.loadData();
  }

  onFilterChange(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);

    if (this.mode() === 'daily') {
      const dateStr = this.datePipe.transform(this.filterDate(), 'yyyy-MM-dd')!;
      this.reportsService.getDailySalesReport(dateStr).subscribe({
        next: res => {
          if (res.success) {
            this.dailyReport.set(res.data);
            this.setupDailyCharts(res.data);
          }
          this.loading.set(false);
          this.cdr.markForCheck();
        },
        error: () => {
          this.dailyReport.set(null);
          this.loading.set(false);
          this.cdr.markForCheck();
        },
      });
      return;
    }

    const monthStr = this.datePipe.transform(this.filterDate(), 'yyyy-MM')!;
    this.reportsService.getMonthlySalesReport(monthStr).subscribe({
      next: res => {
        if (res.success) {
          this.monthlyReport.set(res.data);
          this.setupMonthlyCharts(res.data);
        }
        this.loading.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.monthlyReport.set(null);
        this.loading.set(false);
        this.cdr.markForCheck();
      },
    });
  }

  goToToday(): void {
    this.filterDate.set(new Date());
    this.loadData();
  }

  paymentTagSeverity(method: string): 'success' | 'info' | 'warning' | 'danger' | undefined {
    switch (method?.toUpperCase()) {
      case 'CASH':
        return 'success';
      case 'YAPE':
      case 'PLIN':
        return 'info';
      case 'CARD':
        return 'warning';
      case 'MIXTO':
        return 'danger';
      default:
        return undefined;
    }
  }

  private setupDailyCharts(data: SalesDailyReportApi): void {
    this.mainChartData = {
      labels: data.hourly_chart.labels,
      datasets: [
        {
          label: 'Ventas por hora (S/)',
          data: data.hourly_chart.amounts,
          backgroundColor: 'rgba(99, 102, 241, 0.65)',
          borderColor: '#6366f1',
          borderWidth: 1,
          borderRadius: 6,
        },
      ],
    };
    this.setupPaymentChart(data.payment_breakdown);
  }

  private setupMonthlyCharts(data: SalesMonthlyReportApi): void {
    this.mainChartData = {
      labels: data.daily_chart.labels,
      datasets: [
        {
          label: 'Ventas diarias (S/)',
          data: data.daily_chart.amounts,
          fill: true,
          backgroundColor: 'rgba(34, 197, 94, 0.15)',
          borderColor: '#22c55e',
          tension: 0.35,
          pointRadius: 2,
          pointHoverRadius: 5,
        },
      ],
    };
    this.setupPaymentChart(data.payment_breakdown);
  }

  private setupPaymentChart(
    breakdown: SalesDailyReportApi['payment_breakdown'],
  ): void {
    const colors = ['#22c55e', '#3b82f6', '#a855f7', '#f59e0b', '#ef4444', '#64748b'];

    this.paymentChartData = {
      labels: breakdown.map(item => item.label),
      datasets: [
        {
          data: breakdown.map(item => item.amount),
          backgroundColor: breakdown.map((_, index) => colors[index % colors.length]),
          borderWidth: 0,
          hoverOffset: 8,
        },
      ],
    };
  }

  private initChartOptions(): void {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--text-color');
    const textColorSecondary = documentStyle.getPropertyValue(
      '--text-color-secondary',
    );
    const surfaceBorder = documentStyle.getPropertyValue('--surface-border');

    this.mainChartOptions = {
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx: { parsed: { y: number } }) =>
              `S/ ${ctx.parsed.y.toLocaleString('es-PE', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`,
          },
        },
      },
      scales: {
        x: {
          ticks: {
            color: textColorSecondary,
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: this.mode() === 'monthly' ? 15 : 12,
          },
          grid: { color: surfaceBorder, drawBorder: false },
        },
        y: {
          ticks: { color: textColorSecondary },
          grid: { color: surfaceBorder, drawBorder: false },
        },
      },
    };

    this.paymentChartOptions = {
      maintainAspectRatio: false,
      cutout: '62%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: textColor, usePointStyle: true, padding: 16 },
        },
        tooltip: {
          callbacks: {
            label: (ctx: { label: string; parsed: number }) =>
              `${ctx.label}: S/ ${ctx.parsed.toLocaleString('es-PE', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`,
          },
        },
      },
    };
  }
}
