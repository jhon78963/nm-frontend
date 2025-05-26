import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BASE_FILE_URL, FILE_TOKEN } from '../utils/constants';

@Injectable({ providedIn: 'root' })
export class FileApiService {
  BASE_FILE_URL = BASE_FILE_URL;
  FILE_TOKEN = FILE_TOKEN;
  constructor(private readonly http: HttpClient) {}

  post<T>(path: string, body: any, headers?: any) {
    const httpHeaders = {
      ...headers,
      Authorization: `Bearer ${FILE_TOKEN}`,
      'X-Use-Custom-Token': 'true',
    };

    return this.http.post<T>(`${this.BASE_FILE_URL}/${path}`, body, {
      headers: httpHeaders,
    });
  }

  delete<T>(path: string, headers?: any) {
    const httpHeaders = { ...headers, Authorization: `Bearer ${FILE_TOKEN}` };
    return this.http.delete<T>(`${this.BASE_FILE_URL}/${path}`, {
      headers: httpHeaders,
    });
  }
}
