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

  create(data: any): Observable<void> {
    return this.apiService.post('attendance', data);
  }
}
