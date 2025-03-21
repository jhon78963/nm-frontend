import { Injectable } from '@angular/core';
import { ApiService } from '../../../../../services/api.service';
import { Observable } from 'rxjs';
import { Image } from '../../images/models/images.model';

@Injectable({
  providedIn: 'root',
})
export class RoomImagesService {
  constructor(private readonly apiService: ApiService) {}

  add(roomId: number, imageId: number): Observable<void> {
    return this.apiService.post(`images/${roomId}/add/${imageId}`, {});
  }

  findAll(id: number): Observable<Image[]> {
    return this.apiService.get(`images/${id}/all`);
  }

  findLeft(id: number): Observable<Image[]> {
    return this.apiService.get(`images/${id}/left`);
  }

  remove(roomId: number, imageId: number): Observable<void> {
    return this.apiService.delete(`images/${roomId}/remove/${imageId}`);
  }
}
