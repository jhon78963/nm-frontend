import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ChartModule } from 'primeng/chart';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { CalendarModule } from 'primeng/calendar';
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
  financials = signal<any>({});

  // Configuración Gráfico
  chartData: any;
  chartOptions: any;

  ngOnInit() {
    this.initChartOptions();
    this.loadData();
  }

  loadData() {
    this.loading.set(true);

    // Calcular el rango del mes seleccionado
    const year = this.filterDate.getFullYear();
    const month = this.filterDate.getMonth(); // 0-11

    // Primer día del mes
    const start = new Date(year, month, 1);
    // Último día del mes
    const end = new Date(year, month + 1, 0);

    const startDateStr = this.datePipe.transform(start, 'yyyy-MM-dd');
    const endDateStr = this.datePipe.transform(end, 'yyyy-MM-dd');

    this.reportsService.getDashboardData(startDateStr!, endDateStr!).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.totals.set(res.data.totals);
          this.topProducts.set(res.data.top_products);
          this.financials.set(res.data.financials);

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
          // CORRECCIÓN: Convertimos los strings a números para que el gráfico funcione
          data: data.sales.map((val: any) => parseFloat(val) || 0),
          fill: false,
          borderColor: '#4ade80', // green-400
          tension: 0.4,
        },
        {
          label: 'Gastos',
          // CORRECCIÓN: Convertimos los strings a números
          data: data.expenses.map((val: any) => parseFloat(val) || 0),
          fill: false,
          borderColor: '#f87171', // red-400
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
