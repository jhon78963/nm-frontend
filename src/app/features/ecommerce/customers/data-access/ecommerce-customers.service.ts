import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';

import { environment } from '../../../../../environments/environment';
import {
  EcommerceCustomerDetail,
  EcommerceCustomerNotification,
  EcommerceCustomerOrdersResponse,
  EcommerceCustomerRefund,
  EcommerceCustomerReview,
  EcommerceCustomersListResponse,
  EcommerceRefundStatus,
} from '../models/ecommerce-customer.model';
import {
  adaptEcommerceCustomerDetail,
  adaptEcommerceCustomerNotificationsResponse,
  adaptEcommerceCustomerOrdersResponse,
  adaptEcommerceCustomerRefundUpdateResponse,
  adaptEcommerceCustomerRefundsResponse,
  adaptEcommerceCustomerReviewsResponse,
  adaptEcommerceCustomerUpdateResponse,
  adaptEcommerceCustomersListResponse,
} from './ecommerce-customers.adapter';

@Injectable({ providedIn: 'root' })
export class EcommerceCustomersService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/ecommerce/customers/admin`;
  private readonly refundsBase = `${environment.apiUrl}/ecommerce/refunds/admin`;

  list(params: {
    page?: number;
    perPage?: number;
    search?: string;
    isEnabled?: boolean;
  }): Observable<EcommerceCustomersListResponse> {
    let httpParams = new HttpParams();

    if (params.page) httpParams = httpParams.set('page', String(params.page));
    if (params.perPage) httpParams = httpParams.set('perPage', String(params.perPage));
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.isEnabled !== undefined) {
      httpParams = httpParams.set('isEnabled', String(params.isEnabled));
    }

    return this.http
      .get<unknown>(this.base, { params: httpParams })
      .pipe(map(adaptEcommerceCustomersListResponse));
  }

  getById(id: string): Observable<EcommerceCustomerDetail> {
    return this.http.get<unknown>(`${this.base}/${id}`).pipe(map(adaptEcommerceCustomerDetail));
  }

  update(
    id: string,
    payload: { name?: string; isEnabled?: boolean },
  ): Observable<{ customer: EcommerceCustomerDetail['customer'] }> {
    return this.http
      .patch<unknown>(`${this.base}/${id}`, payload)
      .pipe(map(adaptEcommerceCustomerUpdateResponse));
  }

  listOrders(
    customerId: string,
    params: { page?: number; perPage?: number; status?: string } = {},
  ): Observable<EcommerceCustomerOrdersResponse> {
    let httpParams = new HttpParams();

    if (params.page) httpParams = httpParams.set('page', String(params.page));
    if (params.perPage) httpParams = httpParams.set('perPage', String(params.perPage));
    if (params.status) httpParams = httpParams.set('status', params.status);

    return this.http
      .get<unknown>(`${this.base}/${customerId}/orders`, { params: httpParams })
      .pipe(map(adaptEcommerceCustomerOrdersResponse));
  }

  listRefunds(customerId: string): Observable<{ refunds: EcommerceCustomerRefund[] }> {
    return this.http
      .get<unknown>(`${this.base}/${customerId}/refunds`)
      .pipe(map(adaptEcommerceCustomerRefundsResponse));
  }

  listReviews(customerId: string): Observable<{ reviews: EcommerceCustomerReview[] }> {
    return this.http
      .get<unknown>(`${this.base}/${customerId}/reviews`)
      .pipe(map(adaptEcommerceCustomerReviewsResponse));
  }

  listNotifications(
    customerId: string,
  ): Observable<{ notifications: EcommerceCustomerNotification[] }> {
    return this.http
      .get<unknown>(`${this.base}/${customerId}/notifications`)
      .pipe(map(adaptEcommerceCustomerNotificationsResponse));
  }

  updateRefund(
    refundId: string,
    payload: {
      status?: EcommerceRefundStatus;
      adminNotes?: string;
      amount?: number;
    },
  ): Observable<{ refund: EcommerceCustomerRefund }> {
    return this.http
      .patch<unknown>(`${this.refundsBase}/${refundId}`, payload)
      .pipe(map(adaptEcommerceCustomerRefundUpdateResponse));
  }
}
