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
  Tenant,
  TenantListResponse,
  TenantSetting,
} from '../models/tenants.model';

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

  /** Crea el tenant y devuelve la entidad creada (para luego guardar settings). */
  createAndReturn(data: Pick<Tenant, 'name'>): Observable<Tenant> {
    return this.apiService.post<Tenant>('tenants', data).pipe(
      switchMap((tenant: Tenant) =>
        this.callGetList().pipe(map(() => tenant)),
      ),
    );
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

  // ── Settings ────────────────────────────────────────────────────────────────

  getSettings(tenantId: number): Observable<TenantSetting> {
    return this.apiService.get<TenantSetting>(`tenants/${tenantId}/settings`);
  }

  saveSettings(tenantId: number, data: TenantSetting): Observable<TenantSetting> {
    return this.apiService.put<TenantSetting>(
      `tenants/${tenantId}/settings`,
      data,
    );
  }

  // ── Internos ────────────────────────────────────────────────────────────────

  private updateList(v: Tenant[]): void {
    this.tenants = v;
    this.tenants$.next(this.tenants);
  }

  private updateTotal(v: number): void {
    this.total = v;
    this.total$.next(this.total);
  }
}
