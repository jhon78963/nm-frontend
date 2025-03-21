import { Injectable } from '@angular/core';

import {
  BehaviorSubject,
  debounceTime,
  map,
  Observable,
  switchMap,
} from 'rxjs';

import { ApiService } from '../../../../../services/api.service';

import { Amenity, AmenityListResponse } from '../models/amenities.model';

@Injectable({
  providedIn: 'root',
})
export class AmenitiesService {
  amenities: Amenity[] = [];
  amenities$: BehaviorSubject<Amenity[]> = new BehaviorSubject<Amenity[]>(
    this.amenities,
  );

  total: number = 0;
  total$: BehaviorSubject<number> = new BehaviorSubject<number>(this.total);

  constructor(private readonly apiService: ApiService) {}

  callGetList(
    limit: number = 10,
    page: number = 1,
    name: string = '',
  ): Observable<void> {
    let url = `amenities?limit=${limit}&page=${page}`;
    if (name) {
      url += `&search=${name}`;
    }
    return this.apiService.get<AmenityListResponse>(url).pipe(
      debounceTime(600),
      map((response: AmenityListResponse) => {
        this.updateAmenities(response.data);
        this.updateTotalAmenities(response.paginate.total);
      }),
    );
  }

  getList(): Observable<Amenity[]> {
    return this.amenities$.asObservable();
  }

  getTotal(): Observable<number> {
    return this.total$.asObservable();
  }

  getOne(id: number): Observable<Amenity> {
    return this.apiService.get(`amenities/${id}`);
  }

  create(data: Amenity): Observable<void> {
    return this.apiService
      .post('amenities', data)
      .pipe(switchMap(() => this.callGetList()));
  }

  edit(id: number, data: Amenity): Observable<void> {
    return this.apiService
      .patch(`amenities/${id}`, data)
      .pipe(switchMap(() => this.callGetList()));
  }

  delete(id: number): Observable<void> {
    return this.apiService
      .delete(`amenities/${id}`)
      .pipe(switchMap(() => this.callGetList()));
  }

  private updateAmenities(value: Amenity[]): void {
    this.amenities = value;
    this.amenities$.next(this.amenities);
  }

  private updateTotalAmenities(value: number): void {
    this.total = value;
    this.total$.next(this.total);
  }
}
