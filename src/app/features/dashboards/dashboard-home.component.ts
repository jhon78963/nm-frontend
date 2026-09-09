import { Component, computed, inject } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { of, switchMap } from 'rxjs';
import {
  isAdminOrSuperAdmin,
  userHasAnyPermission,
} from '../../core/auth/permission.util';
import { AuthService } from '../auth/data-access/auth.service';
import { MetricCardComponent } from './components/metric-card/metric-card.component';
import { QuickAccessGridComponent } from './components/quick-access-grid/quick-access-grid.component';
import { DashboardHomeService } from './data-access/dashboard-home.service';
import {
  EMPTY_DASHBOARD_METRICS,
  MetricColorVariant,
  MetricValueFormat,
  SELLER_DASHBOARD_PERMISSIONS,
} from './models/dashboard-home.model';

interface MetricCardView {
  label: string;
  value: number;
  icon: string;
  colorVariant: MetricColorVariant;
  format: MetricValueFormat;
}

@Component({
  selector: 'app-dashboard-home',
  imports: [MetricCardComponent, QuickAccessGridComponent],
  templateUrl: './dashboard-home.component.html',
})
export class DashboardHomeComponent {
  private readonly dashboardService = inject(DashboardHomeService);
  private readonly authService = inject(AuthService);
  private readonly now = new Date();

  protected readonly canViewMetrics = computed(() =>
    isAdminOrSuperAdmin(this.authService.currentUser()),
  );

  protected readonly canViewSellerMetrics = computed(() => {
    const user = this.authService.currentUser();
    if (isAdminOrSuperAdmin(user)) {
      return false;
    }

    return userHasAnyPermission(user, SELLER_DASHBOARD_PERMISSIONS);
  });

  protected readonly shouldLoadMetrics = computed(
    () => this.canViewMetrics() || this.canViewSellerMetrics(),
  );

  protected readonly metrics = toSignal(
    toObservable(this.shouldLoadMetrics).pipe(
      switchMap((shouldLoad) =>
        shouldLoad
          ? this.dashboardService.getMetrics()
          : of(EMPTY_DASHBOARD_METRICS),
      ),
    ),
  );

  protected readonly isLoading = computed(
    () => this.shouldLoadMetrics() && this.metrics() === undefined,
  );

  protected readonly greeting = computed(() => {
    const hour = this.now.getHours();
    const name = this.displayName();

    if (hour < 12) {
      return `Buenos días, ${name}`;
    }

    if (hour < 19) {
      return `Buenas tardes, ${name}`;
    }

    return `Buenas noches, ${name}`;
  });

  protected readonly formattedDate = this.formatToday(this.now);

  protected readonly displayName = computed(() => {
    const user = this.authService.currentUser();
    if (!user) {
      return 'usuario';
    }

    return `${user.name} ${user.surname}`.trim() || user.username;
  });

  protected readonly userRole = computed(
    () => this.authService.currentUser()?.role ?? '',
  );

  protected readonly warehouseLabel = computed(() => {
    const warehouseId = this.authService.currentUser()?.warehouseId;
    return warehouseId ? `Tienda #${warehouseId}` : 'Sin tienda asignada';
  });

  protected readonly metricCards = computed<MetricCardView[]>(() => {
    const metrics = this.metrics() ?? EMPTY_DASHBOARD_METRICS;

    return [
      {
        label: 'Ventas hoy',
        value: metrics.todaySales,
        icon: 'cart',
        colorVariant: 'blue',
        format: 'integer',
      },
      {
        label: 'Monto de ventas',
        value: metrics.todaySalesAmount,
        icon: 'cash',
        colorVariant: 'green',
        format: 'currency',
      },
      {
        label: 'Gastos hoy',
        value: metrics.todayExpenses,
        icon: 'expense',
        colorVariant: 'red',
        format: 'currency',
      },
      {
        label: 'Stock bajo',
        value: metrics.lowStockProducts,
        icon: 'warning',
        colorVariant: 'yellow',
        format: 'integer',
      },
      {
        label: 'Compras pendientes',
        value: metrics.pendingPurchases,
        icon: 'truck',
        colorVariant: 'purple',
        format: 'integer',
      },
      {
        label: 'Clientes activos',
        value: metrics.activeCustomers,
        icon: 'users',
        colorVariant: 'gray',
        format: 'integer',
      },
    ];
  });

  protected readonly sellerMetricCards = computed<MetricCardView[]>(() => {
    const metrics = this.metrics() ?? EMPTY_DASHBOARD_METRICS;

    return [
      {
        label: 'Ventas hoy',
        value: metrics.todaySales,
        icon: 'cart',
        colorVariant: 'blue',
        format: 'integer',
      },
      {
        label: 'Monto de ventas',
        value: metrics.todaySalesAmount,
        icon: 'cash',
        colorVariant: 'green',
        format: 'currency',
      },
      {
        label: 'Tareas pendientes',
        value: metrics.pendingTasks,
        icon: 'warning',
        colorVariant: 'yellow',
        format: 'integer',
      },
    ];
  });

  protected readonly visibleMetricCards = computed(() => {
    if (this.canViewMetrics()) {
      return this.metricCards();
    }

    if (this.canViewSellerMetrics()) {
      return this.sellerMetricCards();
    }

    return [];
  });

  private formatToday(date: Date): string {
    const formatted = new Intl.DateTimeFormat('es-PE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);

    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }
}
