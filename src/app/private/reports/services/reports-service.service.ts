import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../services/api.service';

export interface ProductInventoryColorApi {
  color_id: number;
  color: string;
  stock: number;
}

export interface ProductInventorySizeApi {
  product_size_id: number;
  size_id: number;
  size: string;
  barcode: string | null;
  purchase_price: number | null;
  sale_price: number | null;
  min_sale_price: number | null;
  stock: number;
  colors: ProductInventoryColorApi[];
}

export interface ProductInventoryReportApi {
  id: number;
  name: string;
  sizes: ProductInventorySizeApi[];
}

export interface SalesPaymentBreakdownApi {
  method: string;
  label: string;
  amount: number;
  count: number;
}

export interface SalesDailyReportApi {
  date: string;
  date_iso: string;
  summary: {
    total_amount: number;
    transaction_count: number;
    items_sold: number;
    average_ticket: number;
    cash: number;
    digital: number;
  };
  payment_breakdown: SalesPaymentBreakdownApi[];
  hourly_chart: {
    labels: string[];
    amounts: number[];
    counts: number[];
  };
  sales: Array<{
    id: number;
    code: string;
    time: string;
    customer: string;
    items_count: number;
    total_amount: number;
    payment_method: string;
    payment_label: string;
  }>;
}

export interface SalesMonthlyReportApi {
  month: string;
  month_label: string;
  month_iso: string;
  summary: {
    total_amount: number;
    transaction_count: number;
    items_sold: number;
    average_ticket: number;
    average_daily: number;
    days_with_sales: number;
    cash: number;
    digital: number;
  };
  payment_breakdown: SalesPaymentBreakdownApi[];
  daily_breakdown: SalesDailyBreakdownRowApi[];
  daily_chart: {
    labels: string[];
    amounts: number[];
  };
}

export interface SalesDailyBreakdownRowApi {
  date: string;
  day_of_week: string;
  transactions: number;
  total: number;
  cash: number;
  digital: number;
}

export interface SalesDailyPeriodReportApi {
  period_label: string;
  start_date: string;
  end_date: string;
  summary: {
    total_amount: number;
    transaction_count: number;
    items_sold: number;
    average_ticket: number;
    average_daily: number;
    days_with_sales: number;
    days_in_range: number;
    cash: number;
    digital: number;
  };
  daily_breakdown: SalesDailyBreakdownRowApi[];
}

@Injectable({
  providedIn: 'root',
})
export class ReportsService {
  constructor(private apiService: ApiService) {}

  getDashboardData(startDate?: string, endDate?: string) {
    let url = 'reports/dashboard';
    if (startDate && endDate) {
      url += `?start_date=${startDate}&end_date=${endDate}`;
    }
    return this.apiService.get(url);
  }

  getProductsInventoryReport(): Observable<{
    success: boolean;
    data: ProductInventoryReportApi[];
  }> {
    return this.apiService.get('reports/products');
  }

  downloadProductsInventoryPdf(): Observable<Blob> {
    return this.apiService.getBlob('reports/products/export/pdf');
  }

  getDailySalesReport(date: string): Observable<{
    success: boolean;
    data: SalesDailyReportApi;
  }> {
    return this.apiService.get(`reports/sales/daily?date=${date}`);
  }

  getMonthlySalesReport(month: string): Observable<{
    success: boolean;
    data: SalesMonthlyReportApi;
  }> {
    return this.apiService.get(`reports/sales/monthly?month=${month}`);
  }

  getDailySalesPeriodReport(
    startDate: string,
    endDate: string,
  ): Observable<{
    success: boolean;
    data: SalesDailyPeriodReportApi;
    message?: string;
  }> {
    return this.apiService.get(
      `reports/sales/daily-period?start_date=${startDate}&end_date=${endDate}`,
    );
  }
}
