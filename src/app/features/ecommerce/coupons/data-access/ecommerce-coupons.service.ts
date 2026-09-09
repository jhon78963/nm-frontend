import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

import { environment } from '../../../../../environments/environment';
import {
  CreateEcommerceCouponPayload,
  EcommerceCoupon,
  EcommerceCouponsResponse,
  UpdateEcommerceCouponPayload,
} from '../models/ecommerce-coupon.model';
import {
  adaptEcommerceCouponResponse,
  adaptEcommerceCouponsResponse,
} from './ecommerce-coupons.adapter';

@Injectable({ providedIn: 'root' })
export class EcommerceCouponsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/ecommerce/coupons/admin`;

  list(): Observable<EcommerceCouponsResponse> {
    return this.http.get<unknown>(this.base).pipe(map(adaptEcommerceCouponsResponse));
  }

  create(payload: CreateEcommerceCouponPayload): Observable<{ coupon: EcommerceCoupon }> {
    return this.http
      .post<unknown>(this.base, payload)
      .pipe(map(adaptEcommerceCouponResponse));
  }

  update(id: string, payload: UpdateEcommerceCouponPayload): Observable<{ coupon: EcommerceCoupon }> {
    return this.http
      .patch<unknown>(`${this.base}/${id}`, payload)
      .pipe(map(adaptEcommerceCouponResponse));
  }
}
