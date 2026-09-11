import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { isSuperAdmin } from '../auth/permission.util';
import { AuthService } from '../../features/auth/data-access/auth.service';
import { extractApiList } from '../../features/inventories/products/data-access/product.adapter';

export interface SelectableWarehouse {
  id: string;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class ActiveWarehouseLookupService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  loadSelectableWarehouses(): Observable<SelectableWarehouse[]> {
    let url = `${environment.apiUrl}/warehouses?limit=200&page=1`;
    const tenantId = this.actorTenantIdForWarehouseLookup();

    if (tenantId != null) {
      url += `&tenant_id=${encodeURIComponent(tenantId)}`;
    }

    return this.http.get<unknown>(url).pipe(
      map((raw) =>
        extractApiList(raw)
          .map((item) => {
            const row = item as Record<string, unknown>;
            return {
              id: String(row['id'] ?? ''),
              name: String(row['name'] ?? '').trim() || 'Sin nombre',
            };
          })
          .filter((warehouse) => warehouse.id.length > 0),
      ),
    );
  }

  private actorTenantIdForWarehouseLookup(): string | null {
    const user = this.authService.currentUser();

    if (isSuperAdmin(user) && this.authService.hasPermission('tenant.getAll')) {
      return null;
    }

    const tenantId = user?.tenantId;
    return tenantId ? String(tenantId) : null;
  }
}
