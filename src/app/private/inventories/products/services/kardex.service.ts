import { HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../services/api.service';
import {
  KardexReportParams,
  KardexReportResponse,
} from '../models/kardex.model';

@Injectable({ providedIn: 'root' })
export class KardexService {
  private readonly apiService = inject(ApiService);

  getReport(params: KardexReportParams): Observable<KardexReportResponse> {
    let httpParams = new HttpParams()
      .set('warehouse_id', String(params.warehouseId))
      .set('product_id', String(params.productId))
      .set('product_size_id', String(params.productSizeId))
      .set('fecha_inicio', params.fechaInicio)
      .set('fecha_fin', params.fechaFin);

    if (
      params.colorId !== null &&
      params.colorId !== undefined &&
      !Number.isNaN(params.colorId)
    ) {
      httpParams = httpParams.set('color_id', String(params.colorId));
    }

    return this.apiService.get<KardexReportResponse>('inventory/kardex', {
      params: httpParams,
    });
  }
}
