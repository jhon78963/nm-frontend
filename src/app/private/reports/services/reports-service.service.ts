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
}
