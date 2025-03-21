import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../services/api.service';
import { Company } from '../models/company.model';

@Injectable({
  providedIn: 'root',
})
export class CompanyService {
  constructor(private apiService: ApiService) {}

  edit(id: number, data: Company): Observable<void> {
    return this.apiService.patch(`companies/${id}`, data);
  }

  getOne(id: number): Observable<Company> {
    return this.apiService.get(`companies/${id}`);
  }
}
