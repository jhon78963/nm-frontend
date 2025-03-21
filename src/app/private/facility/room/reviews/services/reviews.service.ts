import { Injectable } from '@angular/core';

import {
  BehaviorSubject,
  debounceTime,
  map,
  Observable,
  switchMap,
} from 'rxjs';

import { ApiService } from '../../../../../services/api.service';

import { Review, ReviewListResponse } from '../models/reviews.model';

@Injectable({
  providedIn: 'root',
})
export class ReviewsService {
  reviews: Review[] = [];
  reviews$: BehaviorSubject<Review[]> = new BehaviorSubject<Review[]>(
    this.reviews,
  );

  total: number = 0;
  total$: BehaviorSubject<number> = new BehaviorSubject<number>(this.total);

  constructor(private readonly apiService: ApiService) {}

  callGetList(
    limit: number = 10,
    page: number = 1,
    name: string = '',
  ): Observable<void> {
    let url = `reviews?limit=${limit}&page=${page}`;
    if (name) {
      url += `&search=${name}`;
    }
    return this.apiService.get<ReviewListResponse>(url).pipe(
      debounceTime(600),
      map((response: ReviewListResponse) => {
        this.updateReviews(response.data);
        this.updateTotalReviews(response.paginate.total);
      }),
    );
  }

  getList(): Observable<Review[]> {
    return this.reviews$.asObservable();
  }

  getTotal(): Observable<number> {
    return this.total$.asObservable();
  }

  getOne(id: number): Observable<Review> {
    return this.apiService.get(`reviews/${id}`);
  }

  create(data: Review): Observable<void> {
    return this.apiService
      .post('reviews', data)
      .pipe(switchMap(() => this.callGetList()));
  }

  edit(id: number, data: Review): Observable<void> {
    return this.apiService
      .patch(`reviews/${id}`, data)
      .pipe(switchMap(() => this.callGetList()));
  }

  delete(id: number): Observable<void> {
    return this.apiService
      .delete(`reviews/${id}`)
      .pipe(switchMap(() => this.callGetList()));
  }

  private updateReviews(value: Review[]): void {
    this.reviews = value;
    this.reviews$.next(this.reviews);
  }

  private updateTotalReviews(value: number): void {
    this.total = value;
    this.total$.next(this.total);
  }
}
