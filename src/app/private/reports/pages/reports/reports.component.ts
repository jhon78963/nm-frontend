import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

// PrimeNG
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ChartModule } from 'primeng/chart';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { ReportsService } from '../../services/reports-service.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    TableModule,
    ChartModule,
    ButtonModule,
    SkeletonModule,
  ],
  templateUrl: './reports.component.html',
})
export class ReportsComponent implements OnInit {
  reportsService = inject(ReportsService);

  loading = signal(true);

  // Datos
  totals = signal<any>({});
  topProducts = signal<any[]>([]);
  financials = signal<any>({});

  // Configuración Gráfico
  chartData: any;
  chartOptions: any;

  ngOnInit() {
    this.loadData();
    this.initChartOptions();
  }

  loadData() {
    this.loading.set(true);
    this.reportsService.getDashboardData().subscribe({
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
          data: data.sales,
          fill: false,
          borderColor: '#4ade80', // green-400
          tension: 0.4,
        },
        {
          label: 'Gastos',
          data: data.expenses,
          fill: false,
          borderColor: '#f87171', // red-400
          tension: 0.4,
        },
      ],
    };
  }

  initChartOptions() {
    this.chartOptions = {
      maintainAspectRatio: false,
      aspectRatio: 0.6,
      plugins: {
        legend: { labels: { color: '#495057' } },
      },
      scales: {
        x: { ticks: { color: '#495057' }, grid: { color: '#ebedef' } },
        y: { ticks: { color: '#495057' }, grid: { color: '#ebedef' } },
      },
    };
  }
}
