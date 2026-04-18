import { Injectable } from '@angular/core';
import { ApiService } from '../../../../services/api.service';
import { Observable } from 'rxjs';
import type { PurchaseBulkPayload } from '../models/purchase.models';

@Injectable({
  providedIn: 'root',
})
export class PurchaseService {
  /** Ajustar si el endpoint final difiere (ej. prefijo `inventory/`). */
  private readonly bulkPath = 'purchases/bulk';

  constructor(private readonly api: ApiService) {}

  registerBulk(payload: PurchaseBulkPayload): Observable<unknown> {
    return this.api.post<unknown>(this.bulkPath, payload);
  }
}
