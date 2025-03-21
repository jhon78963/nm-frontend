import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../services/api.service';
import { DniConsultation, RucConsultation } from '../models/sunat.model';

@Injectable({
  providedIn: 'root',
})
export class SunatService {
  constructor(private apiService: ApiService) {}

  getPerson(dni: string): Observable<DniConsultation> {
    return this.apiService.get(`consultation-dni/${dni}`);
  }

  getCompany(ruc: string): Observable<RucConsultation> {
    return this.apiService.get(`consultation-ruc/${ruc}`);
  }
}
