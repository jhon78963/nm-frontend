import { Injectable } from '@angular/core';
import { ApiService } from '../../../../services/api.service';
import { User, UserListResponse } from '../models/users.model';
import {
  BehaviorSubject,
  debounceTime,
  map,
  Observable,
  switchMap,
} from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UsersService {
  users: User[] = [];
  users$: BehaviorSubject<User[]> = new BehaviorSubject<User[]>(this.users);

  total: number = 0;
  total$: BehaviorSubject<number> = new BehaviorSubject<number>(this.total);

  constructor(private apiService: ApiService) {}

  callGetList(
    limit: number = 10,
    page: number = 1,
    name: string = '',
  ): Observable<void> {
    let url = `users?limit=${limit}&page=${page}`;
    if (name) {
      url += `&search=${name}`;
    }
    return this.apiService.get<UserListResponse>(url).pipe(
      debounceTime(600),
      map((response: UserListResponse) => {
        this.updateUsers(response.data);
        this.updateTotalUsers(response.paginate.total);
      }),
    );
  }

  getList(): Observable<User[]> {
    return this.users$.asObservable();
  }

  getTotal(): Observable<number> {
    return this.total$.asObservable();
  }

  create(data: User): Observable<void> {
    return this.apiService
      .post('users', data)
      .pipe(switchMap(() => this.callGetList()));
  }

  delete(id: number): Observable<void> {
    return this.apiService
      .delete(`users/${id}`)
      .pipe(switchMap(() => this.callGetList()));
  }

  edit(id: number, data: User): Observable<void> {
    return this.apiService
      .patch(`users/${id}`, data)
      .pipe(switchMap(() => this.callGetList()));
  }

  getOne(id: number): Observable<User> {
    return this.apiService.get(`users/${id}`);
  }

  private updateUsers(value: User[]): void {
    this.users = value;
    this.users$.next(this.users);
  }

  private updateTotalUsers(value: number): void {
    this.total = value;
    this.total$.next(this.total);
  }
}
