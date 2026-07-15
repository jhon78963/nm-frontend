import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, of, switchMap } from 'rxjs';
import { ApiService } from '../../../services/api.service';
import { Color, ColorListResponse } from '../colors/models/colors.model';
import { AutocompleteResponse } from '../../../shared/models/autocomplete.interface';
import { ProductSizeColorSave } from '../products/models/colors.interface';
import { ProductSizeSave } from '../products/models/sizes.interface';
import {
  ReconciliationPosSalesSummary,
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
      .get<{ products: unknown }>(`inventory/reconciliation/search?q=${query}`)
      .pipe(
        map(
          (res): ReconciliationSearchResponse => ({
            products: this.normalizeProductList(res.products),
          }),
        ),
      );
  }

  /** Unidades vendidas por POS desde el inicio del inventario físico. */
  getPosSalesSince(productId: number): Observable<ReconciliationPosSalesSummary> {
    return this.api.get<ReconciliationPosSalesSummary>(
      `inventory/reconciliation/${productId}/pos-sales`,
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

  /** Lista completa del catálogo de colores (pagina en bloques de 200). */
  loadColorsCatalog(pageSize = 200): Observable<Color[]> {
    return this.api
      .get<ColorListResponse>(`colors?limit=${pageSize}&page=1`)
      .pipe(
        switchMap(first => {
          const totalPages = Math.max(1, first.paginate?.pages ?? 1);
          if (totalPages <= 1) {
            return of(first.data ?? []);
          }

          const pageRequests = Array.from({ length: totalPages - 1 }, (_, i) =>
            this.api
              .get<ColorListResponse>(
                `colors?limit=${pageSize}&page=${i + 2}`,
              )
              .pipe(map(res => res?.data ?? [])),
          );

          return forkJoin(pageRequests).pipe(
            map(restPages => [
              ...(first.data ?? []),
              ...restPages.flat(),
            ]),
          );
        }),
      );
  }

  addSizeToProduct(
    productId: number,
    sizeId: number,
    data: Partial<ProductSizeSave>,
  ): Observable<{ message: string }> {
    const payload: ProductSizeSave = {
      barcode: data.barcode ?? 0,
      stock: data.stock ?? 0,
      purchasePrice: data.purchasePrice ?? 0,
      salePrice: data.salePrice ?? 0,
      minSalePrice: data.minSalePrice ?? 0,
    };
    return this.api.post(`products/${productId}/size/${sizeId}`, payload);
  }

  addColorToProductSize(
    productSizeId: number,
    colorId: number,
    data: ProductSizeColorSave = { stock: 0 },
  ): Observable<{ message: string }> {
    return this.api.post(
      `product-size/${productSizeId}/color/${colorId}`,
      data,
    );
  }

  /** Crea color en catálogo si no existe y devuelve su id. */
  resolveOrCreateColorId(description: string): Observable<number> {
    const term = description.trim();
    return this.searchColorAutocomplete(term).pipe(
      switchMap(existing => {
        const match = existing.find(
          c => c.value.trim().toLowerCase() === term.toLowerCase(),
        );
        if (match) {
          return of(match.id);
        }
        return this.api.post<{ message: string }>('colors', { description: term }).pipe(
          switchMap(() => this.searchColorAutocomplete(term)),
          map(list => {
            const created = list.find(
              c => c.value.trim().toLowerCase() === term.toLowerCase(),
            );
            if (!created) {
              throw new Error(`No se pudo registrar el color "${term}".`);
            }
            return created.id;
          }),
        );
      }),
    );
  }

  searchSizeAutocomplete(search: string): Observable<AutocompleteResponse[]> {
    const q = encodeURIComponent(search.trim());
    return this.api.get<AutocompleteResponse[]>(
      `sizes/autocomplete?search=${q}&limit=20`,
    );
  }

  searchColorAutocomplete(search: string): Observable<AutocompleteResponse[]> {
    const q = encodeURIComponent(search.trim());
    return this.api.get<AutocompleteResponse[]>(
      `colors/autocomplete?search=${q}&limit=20`,
    );
  }

  removeColorVariant(
    productSizeId: number,
    colorId: number,
  ): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(
      `product-size/${productSizeId}/color/${colorId}`,
    );
  }

  removeSize(
    productId: number,
    sizeId: number,
  ): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(
      `products/${productId}/size/${sizeId}`,
    );
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
