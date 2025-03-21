import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../services/api.service';
import { Schedule } from '../../models/schedule.model';

@Injectable({
  providedIn: 'root',
})
export class ReservationSchedulesService {
  constructor(private apiService: ApiService) {}

  getSchedules(): Observable<Schedule[]> {
    return this.apiService.get(`schedules`);
  }
}
