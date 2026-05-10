import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../../services/api.service';
import { ProvisionPayload, SystemTenant } from './system-tenant.model';

@Injectable({ providedIn: 'root' })
export class SystemTenantService {
  private readonly base = 'system-admin/tenants';

  constructor(private readonly api: ApiService) {}

  getAllTenants(): Observable<SystemTenant[]> {
    return this.api.get<SystemTenant[]>(this.base);
  }

  createTenantWithAdmin(payload: ProvisionPayload): Observable<SystemTenant> {
    return this.api.post<SystemTenant>(this.base, payload);
  }

  updateTenantFeatures(
    id: number,
    features: string[],
  ): Observable<SystemTenant> {
    return this.api.patch<SystemTenant>(`${this.base}/${id}/features`, {
      features,
    });
  }
}
