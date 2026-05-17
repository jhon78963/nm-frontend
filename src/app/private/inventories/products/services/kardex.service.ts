import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BASE_URL } from '../../../../utils/constants';
import {
  KardexReportParams,
  KardexReportResponse,
} from '../models/kardex.model';

@Injectable({ providedIn: 'root' })
export class KardexService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = BASE_URL;

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

    return this.http.get<KardexReportResponse>(
      `${this.baseUrl}/inventory/kardex`,
      { params: httpParams },
    );
  }
}
