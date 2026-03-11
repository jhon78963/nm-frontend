import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { ReportsService } from '../../services/reports-service.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    TableModule,
    ChartModule,
    ButtonModule,
    SkeletonModule,
    CalendarModule,
    TooltipModule,
  ],
  providers: [DatePipe],
  templateUrl: './reports.component.html',
})
export class ReportsComponent implements OnInit {
  reportsService = inject(ReportsService);
  datePipe = inject(DatePipe);

  loading = signal(true);

  // Filtro de fecha (Por defecto mes actual)
  filterDate: Date = new Date();

  // Datos
  totals = signal<any>({});
  topProducts = signal<any[]>([]);
  leastProducts = signal<any[]>([]);
  financials = signal<any>({});
  // --- NUEVO SIGNAL PARA EL REPORTE HISTÓRICO ---
  allTimeMonthlyReport = signal<any[]>([]);

  // Configuración Gráfico
  chartData: any;
  chartOptions: any;

  totalEfectivo = computed(() =>
    this.allTimeMonthlyReport().reduce(
      (acc, row) => acc + (row.efectivo || 0),
      0,
    ),
  );

  totalYape = computed(() =>
    this.allTimeMonthlyReport().reduce((acc, row) => acc + (row.yape || 0), 0),
  );

  totalTarjeta = computed(() =>
    this.allTimeMonthlyReport().reduce(
      (acc, row) => acc + (row.tarjeta_transferencia || 0),
      0,
    ),
  );

  totalGeneral = computed(() =>
    this.allTimeMonthlyReport().reduce(
      (acc, row) => acc + (row.total_mensual || 0),
      0,
    ),
  );

  ngOnInit() {
    this.initChartOptions();
    this.loadData();
  }

  loadData() {
    this.loading.set(true);

    const year = this.filterDate.getFullYear();
    const month = this.filterDate.getMonth();

    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);

    const startDateStr = this.datePipe.transform(start, 'yyyy-MM-dd');
    const endDateStr = this.datePipe.transform(end, 'yyyy-MM-dd');

    this.reportsService.getDashboardData(startDateStr!, endDateStr!).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.totals.set(res.data.totals);
          this.topProducts.set(res.data.top_products);
          this.leastProducts.set(res.data.least_products || []);
          this.financials.set(res.data.financials);

          // --- CARGAMOS EL REPORTE HISTÓRICO AQUÍ ---
          this.allTimeMonthlyReport.set(res.data.all_time_monthly_report || []);

          this.setupChart(res.data.financials.chart_data);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  setupChart(data: any) {
    this.chartData = {
      labels: data.labels,
      datasets: [
        {
          label: 'Ventas',
          data: data.sales.map((val: any) => parseFloat(val) || 0),
          fill: false,
          borderColor: '#4ade80',
          tension: 0.4,
        },
        {
          label: 'Gastos',
          data: data.expenses.map((val: any) => parseFloat(val) || 0),
          fill: false,
          borderColor: '#f87171',
          tension: 0.4,
        },
      ],
    };
  }

  initChartOptions() {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--text-color');
    const textColorSecondary = documentStyle.getPropertyValue(
      '--text-color-secondary',
    );
    const surfaceBorder = documentStyle.getPropertyValue('--surface-border');

    this.chartOptions = {
      maintainAspectRatio: false,
      aspectRatio: 0.6,
      plugins: {
        legend: { labels: { color: textColor } },
      },
      scales: {
        x: {
          ticks: { color: textColorSecondary },
          grid: { color: surfaceBorder, drawBorder: false },
        },
        y: {
          ticks: { color: textColorSecondary },
          grid: { color: surfaceBorder, drawBorder: false },
        },
      },
    };
  }
}
