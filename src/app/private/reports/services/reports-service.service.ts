import { Injectable } from '@angular/core';
import { ApiService } from '../../../services/api.service';

@Injectable({
  providedIn: 'root',
})
export class ReportsService {
  constructor(private apiService: ApiService) {}

  getDashboardData(startDate?: string, endDate?: string) {
    let url = 'reports/dashboard';
    if (startDate && endDate) {
      url += `?start_date=${startDate}&end_date=${endDate}`;
    }
    return this.apiService.get(url);
  }
}
