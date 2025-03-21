import { Injectable } from '@angular/core';

import {
  BehaviorSubject,
  debounceTime,
  map,
  Observable,
  switchMap,
} from 'rxjs';

import { ApiService } from '../../../../../services/api.service';

import { Room, RoomListResponse } from '../models/rooms.model';

@Injectable({
  providedIn: 'root',
})
export class InUseRoomsService {
  rooms: Room[] = [];
  rooms$: BehaviorSubject<Room[]> = new BehaviorSubject<Room[]>(this.rooms);

  total: number = 0;
  total$: BehaviorSubject<number> = new BehaviorSubject<number>(this.total);

  constructor(private readonly apiService: ApiService) {}

  callGetList(
    limit: number = 10,
    page: number = 1,
    number: string = '',
    status: string = 'IN_USE',
  ): Observable<void> {
    let url = `rooms?limit=${limit}&page=${page}&status=${status}`;
    if (number) {
      url += `&search=${number}`;
    }
    return this.apiService.get<RoomListResponse>(url).pipe(
      debounceTime(600),
      map((response: RoomListResponse) => {
        this.updateRooms(response.data);
        this.updateTotalRooms(response.paginate.total);
      }),
    );
  }

  getList(): Observable<Room[]> {
    return this.rooms$.asObservable();
  }

  getTotal(): Observable<number> {
    return this.total$.asObservable();
  }

  getOne(id: number): Observable<Room> {
    return this.apiService.get(`rooms/${id}`);
  }

  changeStatus(id: number, data: Room) {
    return this.apiService
      .patch(`rooms/change-status/${id}`, data)
      .pipe(switchMap(() => this.callGetList()));
  }

  create(data: Room): Observable<void> {
    return this.apiService
      .post('rooms', data)
      .pipe(switchMap(() => this.callGetList()));
  }

  edit(id: number, data: Room): Observable<void> {
    return this.apiService
      .patch(`rooms/${id}`, data)
      .pipe(switchMap(() => this.callGetList()));
  }

  delete(id: number): Observable<void> {
    return this.apiService
      .delete(`rooms/${id}`)
      .pipe(switchMap(() => this.callGetList()));
  }

  private updateRooms(value: Room[]): void {
    this.rooms = value;
    this.rooms$.next(this.rooms);
  }

  private updateTotalRooms(value: number): void {
    this.total = value;
    this.total$.next(this.total);
  }
}
