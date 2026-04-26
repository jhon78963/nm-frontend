import { Injectable } from '@angular/core';
import { ApiService } from '../../../../services/api.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AttendanceService {
  constructor(private readonly apiService: ApiService) {}

  getAttendance(teamId: number, month: number, year: number): Observable<any> {
    return this.apiService.get(
      `attendance/${teamId}/?month=${month}&year=${year}`,
    );
  }

  getDailySummary(dateYmd: string): Observable<any> {
    return this.apiService.get(
      `attendance/daily-summary?date=${encodeURIComponent(dateYmd)}`,
    );
  }

  create(data: any): Observable<any> {
    return this.apiService.post<any>('attendance', data);
  }
}
