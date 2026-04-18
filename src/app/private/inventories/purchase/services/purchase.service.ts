import { Injectable } from '@angular/core';
import { ApiService } from '../../../../services/api.service';
import { Observable } from 'rxjs';
import type { PurchaseBulkPayload } from '../models/purchase.models';
import type {
  PurchaseDetail,
  PurchaseListResponse,
  PurchaseRegisterBulkResponse,
} from '../models/purchases-list.model';

@Injectable({
  providedIn: 'root',
})
export class PurchaseService {
  private readonly basePath = 'purchases';

  constructor(private readonly api: ApiService) {}

  registerBulk(payload: PurchaseBulkPayload): Observable<PurchaseRegisterBulkResponse> {
    return this.api.post<PurchaseRegisterBulkResponse>(`${this.basePath}/bulk`, payload);
  }

  getList(
    limit = 10,
    page = 1,
    search = '',
    warehouseId: number | null = null,
    status: string | null = null,
  ): Observable<PurchaseListResponse> {
    let url = `${this.basePath}?limit=${limit}&page=${page}`;
    if (search.trim()) {
      url += `&search=${encodeURIComponent(search.trim())}`;
    }
    if (warehouseId != null && warehouseId > 0) {
      url += `&warehouseId=${warehouseId}`;
    }
    if (status) {
      url += `&status=${encodeURIComponent(status)}`;
    }
    return this.api.get<PurchaseListResponse>(url);
  }

  getOne(id: number): Observable<PurchaseDetail> {
    return this.api.get<PurchaseDetail>(`${this.basePath}/${id}`);
  }

  cancel(id: number, reason?: string | null): Observable<{ message: string }> {
    return this.api.post<{ message: string }>(`${this.basePath}/${id}/cancel`, {
      reason: reason?.trim() || null,
    });
  }

  patchHeader(
    id: number,
    body: { documentNote?: string | null; registeredAt?: string | null },
  ): Observable<{ message: string }> {
    return this.api.patch<{ message: string }>(`${this.basePath}/${id}`, body);
  }
}
