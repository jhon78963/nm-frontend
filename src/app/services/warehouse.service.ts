import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  Warehouse,
  WarehouseListResponse,
} from '../models/warehouse.interface';

@Injectable({
  providedIn: 'root',
})
export class WarehousesService {
  constructor(private apiService: ApiService) {}

  /**
   * @param tenantId Si se indica, filtra tiendas del cliente SaaS.
   */
  getAll(tenantId?: number): Observable<Warehouse[]> {
    let path = 'warehouses';
    if (tenantId != null) {
      path += `?tenant_id=${tenantId}`;
    }
    return this.apiService
      .get<WarehouseListResponse>(path)
      .pipe(map(response => response.data));
  }

  getOne(id: number): Observable<Warehouse> {
    return this.apiService.get<Warehouse>(`warehouses/${id}`);
  }
}
