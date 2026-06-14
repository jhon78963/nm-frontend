import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

import { BASE_URL } from '../../../utils/constants';
import { WooCommerceSyncResult } from '../../inventories/products/models/product-media.model';

export interface ProductWooCommerceSyncResponse {
  message: string;
  wooCommerceSync: WooCommerceSyncResult;
  wooProductId: number | null;
  lastSyncedAt: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class ProductWooCommerceService {
  constructor(private readonly http: HttpClient) {}

  syncProduct(
    productId: number,
  ): Observable<HttpResponse<ProductWooCommerceSyncResponse>> {
    return this.http.post<ProductWooCommerceSyncResponse>(
      `${BASE_URL}/products/${productId}/woocommerce/sync`,
      {},
      { observe: 'response' },
    );
  }
}
