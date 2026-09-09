import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';

import { environment } from '../../../../../environments/environment';
import {
  NewsletterCampaignsResponse,
  NewsletterSubscribersListResponse,
  SendNewsletterCampaignPayload,
} from '../models/ecommerce-newsletter.model';
import {
  adaptNewsletterCampaignsResponse,
  adaptNewsletterSubscribersListResponse,
  adaptNewsletterUnsubscribeResponse,
  adaptSendNewsletterCampaignResponse,
} from './ecommerce-newsletter.adapter';

@Injectable({ providedIn: 'root' })
export class EcommerceNewsletterService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/ecommerce/newsletter/admin`;

  listSubscribers(params: {
    page?: number;
    perPage?: number;
    search?: string;
    status?: 'active' | 'unsubscribed' | 'all';
  }): Observable<NewsletterSubscribersListResponse> {
    let httpParams = new HttpParams();

    if (params.page) httpParams = httpParams.set('page', String(params.page));
    if (params.perPage) httpParams = httpParams.set('perPage', String(params.perPage));
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.status && params.status !== 'all') {
      httpParams = httpParams.set('status', params.status);
    }

    return this.http
      .get<unknown>(`${this.base}/subscribers`, { params: httpParams })
      .pipe(map(adaptNewsletterSubscribersListResponse));
  }

  unsubscribeSubscriber(id: string): Observable<{ success: boolean }> {
    return this.http
      .patch<unknown>(`${this.base}/subscribers/${id}/unsubscribe`, {})
      .pipe(map(adaptNewsletterUnsubscribeResponse));
  }

  listCampaigns(): Observable<NewsletterCampaignsResponse> {
    return this.http
      .get<unknown>(`${this.base}/campaigns`)
      .pipe(map(adaptNewsletterCampaignsResponse));
  }

  sendCampaign(payload: SendNewsletterCampaignPayload): Observable<{
    success: boolean;
    recipientCount: number;
    campaign: NewsletterCampaignsResponse['campaigns'][number];
  }> {
    return this.http
      .post<unknown>(`${this.base}/campaigns/send`, payload)
      .pipe(map(adaptSendNewsletterCampaignResponse));
  }
}
