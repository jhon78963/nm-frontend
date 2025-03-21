import { Injectable } from '@angular/core';
import { ApiService } from '../../../../../services/api.service';
import { Observable } from 'rxjs';
import { Amenity } from '../../amenities/models/amenities.model';

@Injectable({
  providedIn: 'root',
})
export class RoomAmenitiesService {
  constructor(private readonly apiService: ApiService) {}

  add(roomId: number, amenityId: number): Observable<void> {
    return this.apiService.post(`amenities/${roomId}/add/${amenityId}`, {});
  }

  findAll(id: number): Observable<Amenity[]> {
    return this.apiService.get(`amenities/${id}/all`);
  }

  findLeft(id: number): Observable<Amenity[]> {
    return this.apiService.get(`amenities/${id}/left`);
  }

  remove(roomId: number, amenityId: number): Observable<void> {
    return this.apiService.delete(`amenities/${roomId}/remove/${amenityId}`);
  }
}
