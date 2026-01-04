import { Injectable } from '@angular/core';
import { ApiService } from '../../../services/api.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FinancialSummaryService {
  constructor(private apiService: ApiService) {}

  getSummary(): Observable<any> {
    return this.apiService.get('financial/summary');
  }
}
