import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BASE_FILE_URL } from '../utils/constants';

@Injectable({ providedIn: 'root' })
export class FileApiService {
  BASE_FILE_URL = BASE_FILE_URL;
  constructor(private readonly http: HttpClient) {}

  post<T>(path: string, body: any, headers?: any) {
    return this.http.post<T>(`${this.BASE_FILE_URL}/${path}`, body, {
      headers,
    });
  }

  delete<T>(path: string, headers?: any) {
    return this.http.delete<T>(`${this.BASE_FILE_URL}/${path}`, { headers });
  }
}
