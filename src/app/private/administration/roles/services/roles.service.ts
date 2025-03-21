import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  debounceTime,
  map,
  Observable,
  switchMap,
} from 'rxjs';
import { ApiService } from '../../../../services/api.service';
import { Role, RoleListResponse } from '../models/roles.model';

@Injectable({
  providedIn: 'root',
})
export class RolesService {
  roles: Role[] = [];
  total: number = 0;
  roles$: BehaviorSubject<Role[]> = new BehaviorSubject<Role[]>(this.roles);
  total$: BehaviorSubject<number> = new BehaviorSubject<number>(this.total);

  constructor(private readonly apiService: ApiService) {}

  callGetList(
    limit: number = 10,
    page: number = 1,
    name: string = '',
  ): Observable<void> {
    let url = `roles?limit=${limit}&page=${page}`;
    if (name) {
      url += `&search=${name}`;
    }
    return this.apiService.get<RoleListResponse>(url).pipe(
      debounceTime(600),
      map((response: RoleListResponse) => {
        this.updateRoles(response.data);
        this.updateTotalRoles(response.paginate.total);
      }),
    );
  }

  getList(): Observable<Role[]> {
    return this.roles$.asObservable();
  }

  getTotal(): Observable<number> {
    return this.total$.asObservable();
  }

  getOne(id: number): Observable<Role> {
    return this.apiService.get(`roles/${id}`);
  }

  create(data: Role): Observable<void> {
    return this.apiService
      .post('roles', data)
      .pipe(switchMap(() => this.callGetList()));
  }

  edit(id: number, data: Role): Observable<void> {
    return this.apiService
      .patch(`roles/${id}`, data)
      .pipe(switchMap(() => this.callGetList()));
  }

  delete(id: number): Observable<void> {
    return this.apiService
      .delete(`roles/${id}`)
      .pipe(switchMap(() => this.callGetList()));
  }

  private updateRoles(value: Role[]): void {
    this.roles = value;
    this.roles$.next(this.roles);
  }

  private updateTotalRoles(value: number): void {
    this.total = value;
    this.total$.next(this.total);
  }
}
