import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from '../../../services/api.service';
import { Color, ColorListResponse } from '../colors/models/colors.model';
import {
  ReconciliationProductApi,
  ReconciliationSearchResponse,
  ReconciliationUpdateResponse,
} from './models/inventory-reconciliation.model';

export interface ReconciliationUpdatePayload {
  sizes: Array<{
    id: number;
    stock?: number;
    barcode?: string | null;
    purchasePrice?: number | null;
    salePrice?: number | null;
    minSalePrice?: number | null;
    colors?: Array<{ colorId: number; stock: number }>;
  }>;
}

export interface ReplaceVariantColorBody {
  fromColorId: number;
  toColorId: number;
}

@Injectable({ providedIn: 'root' })
export class InventoryReconciliationService {
  private readonly api = inject(ApiService);

  search(q: string): Observable<ReconciliationSearchResponse> {
    const query = encodeURIComponent(q.trim());
    return this.api
      .get<{ products: unknown }>(
        `inventory/reconciliation/search?q=${query}`,
      )
      .pipe(
        map((res): ReconciliationSearchResponse => ({
          products: this.normalizeProductList(res.products),
        })),
      );
  }

  bulkUpdate(
    productId: number,
    body: ReconciliationUpdatePayload,
  ): Observable<ReconciliationUpdateResponse> {
    return this.api.put<ReconciliationUpdateResponse>(
      `inventory/reconciliation/${productId}`,
      body,
    );
  }

  /** Sustituye el pivote color en una talla (stock se traslada al color destino). */
  replaceVariantColor(
    productId: number,
    productSizeId: number,
    body: ReplaceVariantColorBody,
  ): Observable<ReconciliationUpdateResponse> {
    return this.api.post<ReconciliationUpdateResponse>(
      `inventory/reconciliation/${productId}/product-size/${productSizeId}/replace-color`,
      body,
    );
  }

  /** Lista de colores del catálogo (para selector en cuadre). */
  loadColorsCatalog(limit = 2000): Observable<Color[]> {
    return this.api
      .get<ColorListResponse>(`colors?limit=${limit}&page=1`)
      .pipe(map(res => res?.data ?? []));
  }

  private normalizeProductList(raw: unknown): ReconciliationProductApi[] {
    if (raw == null) {
      return [];
    }
    if (Array.isArray(raw)) {
      return raw as ReconciliationProductApi[];
    }
    if (
      typeof raw === 'object' &&
      'data' in raw &&
      Array.isArray((raw as { data: unknown }).data)
    ) {
      return (raw as { data: ReconciliationProductApi[] }).data;
    }
    return [];
  }
}
