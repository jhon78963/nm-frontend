import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  debounceTime,
  map,
  Observable,
  switchMap,
} from 'rxjs';
import { ApiService } from '../../../../services/api.service';
import { Tenant, TenantListResponse } from '../models/tenants.model';

@Injectable({ providedIn: 'root' })
export class TenantsService {
  tenants: Tenant[] = [];
  total = 0;
  tenants$ = new BehaviorSubject<Tenant[]>(this.tenants);
  total$ = new BehaviorSubject<number>(this.total);

  constructor(private readonly apiService: ApiService) {}

  callGetList(
    limit: number = 10,
    page: number = 1,
    name: string = '',
  ): Observable<void> {
    let url = `tenants?limit=${limit}&page=${page}`;
    if (name) {
      url += `&search=${encodeURIComponent(name)}`;
    }
    return this.apiService.get<TenantListResponse>(url).pipe(
      debounceTime(600),
      map(res => {
        this.updateList(res.data);
        this.updateTotal(res.paginate.total);
      }),
    );
  }

  getList(): Observable<Tenant[]> {
    return this.tenants$.asObservable();
  }

  getTotal(): Observable<number> {
    return this.total$.asObservable();
  }

  getOne(id: number): Observable<Tenant> {
    return this.apiService.get<Tenant>(`tenants/${id}`);
  }

  create(data: Pick<Tenant, 'name'>): Observable<void> {
    return this.apiService
      .post('tenants', data)
      .pipe(switchMap(() => this.callGetList()));
  }

  edit(id: number, data: Pick<Tenant, 'name'>): Observable<void> {
    return this.apiService
      .patch(`tenants/${id}`, data)
      .pipe(switchMap(() => this.callGetList()));
  }

  delete(id: number): Observable<void> {
    return this.apiService
      .delete(`tenants/${id}`)
      .pipe(switchMap(() => this.callGetList()));
  }

  private updateList(v: Tenant[]): void {
    this.tenants = v;
    this.tenants$.next(this.tenants);
  }

  private updateTotal(v: number): void {
    this.total = v;
    this.total$.next(this.total);
  }
}
