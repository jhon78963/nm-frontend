import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { map, Observable } from 'rxjs';
import {
  Warehouse,
  WarehouseListResponse,
} from '../models/warehouse.interface';

@Injectable({
  providedIn: 'root',
})
export class WarehousesService {
  constructor(private apiService: ApiService) {}
  getAll(): Observable<Warehouse[]> {
    return this.apiService
      .get<WarehouseListResponse>('warehouses')
      .pipe(map(response => response.data));
  }
  getOne(id: number): Observable<Warehouse> {
    return this.apiService.get(`warehouses/${id}`);
  }
}
