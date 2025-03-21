import { Injectable } from '@angular/core';

import {
  BehaviorSubject,
  debounceTime,
  map,
  Observable,
  switchMap,
} from 'rxjs';

import { ApiService } from '../../../../../services/api.service';

import { RoomType, RoomTypeListResponse } from '../models/room-types.model';

@Injectable({
  providedIn: 'root',
})
export class RoomTypesService {
  roomTypes: RoomType[] = [];
  roomTypes$: BehaviorSubject<RoomType[]> = new BehaviorSubject<RoomType[]>(
    this.roomTypes,
  );

  total: number = 0;
  total$: BehaviorSubject<number> = new BehaviorSubject<number>(this.total);

  constructor(private readonly apiService: ApiService) {}

  callGetList(
    limit: number = 10,
    page: number = 1,
    name: string = '',
  ): Observable<void> {
    let url = `room-types?limit=${limit}&page=${page}`;
    if (name) {
      url += `&search=${name}`;
    }
    return this.apiService.get<RoomTypeListResponse>(url).pipe(
      debounceTime(600),
      map((response: RoomTypeListResponse) => {
        this.updateRoomTypes(response.data);
        this.updateTotalRoomTypes(response.paginate.total);
      }),
    );
  }

  getList(): Observable<RoomType[]> {
    return this.roomTypes$.asObservable();
  }

  getTotal(): Observable<number> {
    return this.total$.asObservable();
  }

  getOne(id: number): Observable<RoomType> {
    return this.apiService.get(`room-types/${id}`);
  }

  create(data: RoomType): Observable<void> {
    return this.apiService
      .post('room-types', data)
      .pipe(switchMap(() => this.callGetList()));
  }

  edit(id: number, data: RoomType): Observable<void> {
    return this.apiService
      .patch(`room-types/${id}`, data)
      .pipe(switchMap(() => this.callGetList()));
  }

  delete(id: number): Observable<void> {
    return this.apiService
      .delete(`room-types/${id}`)
      .pipe(switchMap(() => this.callGetList()));
  }

  private updateRoomTypes(value: RoomType[]): void {
    this.roomTypes = value;
    this.roomTypes$.next(this.roomTypes);
  }

  private updateTotalRoomTypes(value: number): void {
    this.total = value;
    this.total$.next(this.total);
  }
}
