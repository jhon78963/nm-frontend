import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Gender, GenderListResponse } from '../models/gender.interface';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GendersService {
  constructor(private apiService: ApiService) {}
  getAll(): Observable<Gender[]> {
    return this.apiService
      .get<GenderListResponse>('genders')
      .pipe(map(response => response.data));
  }
  getOne(id: number): Observable<Gender> {
    return this.apiService.get(`genders/${id}`);
  }
}
