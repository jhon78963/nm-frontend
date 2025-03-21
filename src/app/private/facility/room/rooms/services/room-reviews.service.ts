import { Injectable } from '@angular/core';
import { ApiService } from '../../../../../services/api.service';
import { Observable } from 'rxjs';
import { Review } from '../../reviews/models/reviews.model';

@Injectable({
  providedIn: 'root',
})
export class RoomReviewsService {
  constructor(private readonly apiService: ApiService) {}

  findAll(id: number): Observable<Review[]> {
    return this.apiService.get(`reviews/${id}/all`);
  }

  remove(id: number): Observable<void> {
    return this.apiService.delete(`reviews/${id}`);
  }
}
