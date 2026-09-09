import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';

import { environment } from '../../../../../environments/environment';
import {
  EcommerceOrder,
  EcommerceOrdersListResponse,
  EcommerceOrderStatus,
} from '../models/ecommerce-order.model';
import {
  adaptEcommerceOrder,
  adaptEcommerceOrdersListResponse,
} from './ecommerce-orders.adapter';

@Injectable({ providedIn: 'root' })
export class EcommerceOrdersService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/ecommerce/orders/admin`;

  list(params: {
    page?: number;
    perPage?: number;
    search?: string;
    status?: EcommerceOrderStatus;
  }): Observable<EcommerceOrdersListResponse> {
    let httpParams = new HttpParams();

    if (params.page) httpParams = httpParams.set('page', String(params.page));
    if (params.perPage) httpParams = httpParams.set('perPage', String(params.perPage));
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.status) httpParams = httpParams.set('status', params.status);

    return this.http
      .get<unknown>(this.base, { params: httpParams })
      .pipe(map(adaptEcommerceOrdersListResponse));
  }

  getById(id: string): Observable<EcommerceOrder> {
    return this.http.get<unknown>(`${this.base}/${id}`).pipe(map(adaptEcommerceOrder));
  }

  update(
    id: string,
    payload: {
      status?: EcommerceOrderStatus;
      paymentStatus?: 'pending' | 'paid';
      orderNotes?: string;
    },
  ): Observable<EcommerceOrder> {
    return this.http
      .patch<unknown>(`${this.base}/${id}`, payload)
      .pipe(map(adaptEcommerceOrder));
  }
}
