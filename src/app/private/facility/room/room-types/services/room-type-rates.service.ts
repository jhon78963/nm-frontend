import { Injectable } from '@angular/core';
import { ApiService } from '../../../../../services/api.service';
import { Observable } from 'rxjs';
import { Rate } from '../../rate/rates/models/rates.model';

@Injectable({
  providedIn: 'root',
})
export class RoomRatesService {
  constructor(private readonly apiService: ApiService) {}

  add(roomId: number, amenityId: number): Observable<void> {
    return this.apiService.post(`rates/${roomId}/add/${amenityId}`, {});
  }

  findAll(id: number): Observable<Rate[]> {
    return this.apiService.get(`rates/${id}/all`);
  }

  findLeft(id: number): Observable<Rate[]> {
    return this.apiService.get(`rates/${id}/left`);
  }

  remove(roomId: number, amenityId: number): Observable<void> {
    return this.apiService.delete(`rates/${roomId}/remove/${amenityId}`);
  }
}
