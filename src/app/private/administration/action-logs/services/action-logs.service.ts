import { Injectable } from '@angular/core';
import { BehaviorSubject, debounceTime, map, Observable } from 'rxjs';
import { ApiService } from '../../../../services/api.service';
import {
  ActionLogListResponse,
  UserActionLog,
} from '../models/action-logs.model';

@Injectable({ providedIn: 'root' })
export class ActionLogsService {
  logs: UserActionLog[] = [];
  total = 0;
  logs$ = new BehaviorSubject<UserActionLog[]>(this.logs);
  total$ = new BehaviorSubject<number>(this.total);

  constructor(private readonly apiService: ApiService) {}

  callGetList(
    limit: number = 10,
    page: number = 1,
    search: string = '',
  ): Observable<void> {
    let url = `user-action-logs?limit=${limit}&page=${page}`;
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    return this.apiService.get<ActionLogListResponse>(url).pipe(
      debounceTime(400),
      map(res => {
        this.logs = res.data;
        this.total = res.paginate.total;
        this.logs$.next(this.logs);
        this.total$.next(this.total);
      }),
    );
  }

  getList(): Observable<UserActionLog[]> {
    return this.logs$.asObservable();
  }

  getTotal(): Observable<number> {
    return this.total$.asObservable();
  }
}
