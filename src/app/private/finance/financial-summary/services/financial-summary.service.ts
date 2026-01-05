import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../services/api.service';

@Injectable({
  providedIn: 'root',
})
export class FinancialSummaryService {
  constructor(private apiService: ApiService) {}

  getSummary(): Observable<any> {
    return this.apiService.get('financial/summary');
  }
}
