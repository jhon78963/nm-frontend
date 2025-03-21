import { Injectable } from '@angular/core';

import {
  BehaviorSubject,
  debounceTime,
  map,
  Observable,
  switchMap,
} from 'rxjs';

import { ApiService } from '../../../../../services/api.service';

import { CRoom, Room, RoomListResponse } from '../models/rooms.model';

@Injectable({
  providedIn: 'root',
})
export class RoomsService {
  rooms: Room[] = [];
  rooms$: BehaviorSubject<Room[]> = new BehaviorSubject<Room[]>(this.rooms);

  roomsToChange: CRoom[] = [];
  roomsToChange$: BehaviorSubject<CRoom[]> = new BehaviorSubject<CRoom[]>(
    this.roomsToChange,
  );

  total: number = 0;
  total$: BehaviorSubject<number> = new BehaviorSubject<number>(this.total);

  constructor(private readonly apiService: ApiService) {}

  callGetList(
    limit: number = 10,
    page: number = 1,
    number: string = '',
    status: string = '',
  ): Observable<void> {
    let url = `rooms?limit=${limit}&page=${page}`;
    if (status) {
      url += `&status=${status}`;
    }
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

  changeStatus(id: number, data: any) {
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

  getRoomsAvailable(): Observable<void> {
    return this.apiService.get<any>(`rooms/available`).pipe(
      debounceTime(600),
      map((response: any) => {
        this.updateRoomsToChange(response);
      }),
    );
  }

  getAvailableList(): Observable<CRoom[]> {
    return this.roomsToChange$.asObservable();
  }

  change(
    reservationId: number,
    roomId: number,
    newRoomId: number,
  ): Observable<void> {
    return this.apiService.post(
      `reservations/${reservationId}/rooms/${roomId}/new-rooms/${newRoomId}`,
      {},
    );
  }

  changeToLocker(
    reservationId: number,
    roomId: number,
    newLockerId: number,
    newPrice: number,
    oldPrice: number,
  ): Observable<void> {
    return this.apiService.post(
      `reservations/${reservationId}/rooms/${roomId}/new-lockers/${newLockerId}/new-price/${newPrice}/old-price/${oldPrice}`,
      {},
    );
  }

  private updateRooms(value: Room[]): void {
    this.rooms = value;
    this.rooms$.next(this.rooms);
  }

  private updateRoomsToChange(room: CRoom[]): void {
    this.roomsToChange = room;
    this.roomsToChange$.next(this.roomsToChange);
  }

  private updateTotalRooms(value: number): void {
    this.total = value;
    this.total$.next(this.total);
  }
}
