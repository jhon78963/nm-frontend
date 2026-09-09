import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';

import { environment } from '../../../../../environments/environment';
import {
  EcommerceReview,
  EcommerceReviewsListResponse,
  EcommerceReviewStatus,
} from '../models/ecommerce-review.model';
import {
  adaptEcommerceReview,
  adaptEcommerceReviewsListResponse,
} from './ecommerce-reviews.adapter';

@Injectable({ providedIn: 'root' })
export class EcommerceReviewsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/ecommerce/reviews/admin`;

  list(params: {
    page?: number;
    perPage?: number;
    status?: EcommerceReviewStatus;
  }): Observable<EcommerceReviewsListResponse> {
    let httpParams = new HttpParams();

    if (params.page) httpParams = httpParams.set('page', String(params.page));
    if (params.perPage) httpParams = httpParams.set('perPage', String(params.perPage));
    if (params.status) httpParams = httpParams.set('status', params.status);

    return this.http
      .get<unknown>(this.base, { params: httpParams })
      .pipe(map(adaptEcommerceReviewsListResponse));
  }

  moderate(
    id: string,
    payload: { status: 'approved' | 'rejected'; rejectionReason?: string },
  ): Observable<EcommerceReview> {
    return this.http
      .patch<unknown>(`${this.base}/${id}`, payload)
      .pipe(map(adaptEcommerceReview));
  }
}
