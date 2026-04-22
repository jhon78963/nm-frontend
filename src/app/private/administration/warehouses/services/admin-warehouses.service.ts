import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  debounceTime,
  map,
  Observable,
  switchMap,
} from 'rxjs';
import { ApiService } from '../../../../services/api.service';
import {
  WarehouseListResponse,
  WarehouseRow,
} from '../models/warehouses.model';

/** CRUD de tiendas (warehouses) filtradas por tenant en listados. */
@Injectable({ providedIn: 'root' })
export class AdminWarehousesService {
  list: WarehouseRow[] = [];
  total = 0;
  list$ = new BehaviorSubject<WarehouseRow[]>(this.list);
  total$ = new BehaviorSubject<number>(this.total);

  constructor(private readonly apiService: ApiService) {}

  callGetList(
    limit: number = 10,
    page: number = 1,
    name: string = '',
    tenantId?: number,
  ): Observable<void> {
    let url = `warehouses?limit=${limit}&page=${page}`;
    if (name) {
      url += `&search=${encodeURIComponent(name)}`;
    }
    if (tenantId != null) {
      url += `&tenant_id=${tenantId}`;
    }
    return this.apiService.get<WarehouseListResponse>(url).pipe(
      debounceTime(400),
      map(res => {
        this.list = res.data;
        this.total = res.paginate.total;
        this.list$.next(this.list);
        this.total$.next(this.total);
      }),
    );
  }

  getList(): Observable<WarehouseRow[]> {
    return this.list$.asObservable();
  }

  getTotal(): Observable<number> {
    return this.total$.asObservable();
  }

  getOne(id: number): Observable<WarehouseRow> {
    return this.apiService.get<WarehouseRow>(`warehouses/${id}`);
  }

  create(data: { name: string; tenantId: number }): Observable<void> {
    return this.apiService.post('warehouses', data).pipe(switchMap(() => this.callGetList()));
  }

  edit(
    id: number,
    data: { name?: string; tenantId?: number },
  ): Observable<void> {
    return this.apiService
      .patch(`warehouses/${id}`, data)
      .pipe(switchMap(() => this.callGetList()));
  }

  delete(id: number): Observable<void> {
    return this.apiService
      .delete(`warehouses/${id}`)
      .pipe(switchMap(() => this.callGetList()));
  }
}
