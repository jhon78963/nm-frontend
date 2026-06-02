import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BASE_URL, BASE_WEB_URL } from '../utils/constants';

export type ApiGetOptions = {
  headers?: Record<string, string>;
  params?: HttpParams;
};

@Injectable({ providedIn: 'root' })
export class ApiService {
  BASE_URL = BASE_URL;
  BASE_WEB_URL = BASE_WEB_URL;
  constructor(private readonly http: HttpClient) {}

  get<T>(path: string, options?: ApiGetOptions) {
    return this.http.get<T>(`${this.BASE_URL}/${path}`, {
      headers: options?.headers,
      params: options?.params,
    });
  }

  post<T>(path: string, body: any, headers?: any) {
    return this.http.post<T>(`${this.BASE_URL}/${path}`, body, { headers });
  }

  put<T>(path: string, body: any, headers?: any) {
    return this.http.put<T>(`${this.BASE_URL}/${path}`, body, { headers });
  }

  patch<T>(path: string, body: any, headers?: any) {
    return this.http.patch<T>(`${this.BASE_URL}/${path}`, body, { headers });
  }

  delete<T>(path: string, headers?: any) {
    return this.http.delete<T>(`${this.BASE_URL}/${path}`, { headers });
  }

  getBlob(
    path: string,
    options?: { headers?: Record<string, string>; params?: HttpParams },
  ) {
    return this.http.get(`${this.BASE_URL}/${path}`, {
      responseType: 'blob',
      headers: options?.headers,
      params: options?.params,
    });
  }

  /** HTML autenticado (p. ej. ticket POS); pasa por interceptores con withCredentials. */
  getHtml(path: string, options?: ApiGetOptions) {
    return this.http.get(`${this.BASE_URL}/${path}`, {
      responseType: 'text',
      headers: {
        Accept: 'text/html',
        ...options?.headers,
      },
      params: options?.params,
    });
  }
}
