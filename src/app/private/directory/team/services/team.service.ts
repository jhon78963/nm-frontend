import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  debounceTime,
  map,
  Observable,
  switchMap,
} from 'rxjs';
import { ApiService } from '../../../../services/api.service';
import { Team, TeamListResponse } from '../models/team.model';

@Injectable({
  providedIn: 'root',
})
export class TeamService {
  team: Team[] = [];
  total: number = 0;
  team$: BehaviorSubject<Team[]> = new BehaviorSubject<Team[]>(this.team);
  total$: BehaviorSubject<number> = new BehaviorSubject<number>(this.total);

  constructor(private readonly apiService: ApiService) {}

  callGetList(
    limit: number = 10,
    page: number = 1,
    name: string = '',
  ): Observable<void> {
    let url = `teams?limit=${limit}&page=${page}`;
    if (name) {
      url += `&search=${name}`;
    }
    return this.apiService.get<TeamListResponse>(url).pipe(
      debounceTime(600),
      map((response: TeamListResponse) => {
        this.updateTeam(response.data);
        this.updateTotalTeam(response.paginate.total);
      }),
    );
  }

  getList(): Observable<Team[]> {
    return this.team$.asObservable();
  }

  getTotal(): Observable<number> {
    return this.total$.asObservable();
  }

  getOne(id: number): Observable<Team> {
    return this.apiService.get(`teams/${id}`);
  }

  create(data: Team): Observable<void> {
    return this.apiService
      .post('teams', data)
      .pipe(switchMap(() => this.callGetList()));
  }

  edit(id: number, data: Team): Observable<void> {
    return this.apiService
      .patch(`teams/${id}`, data)
      .pipe(switchMap(() => this.callGetList()));
  }

  delete(id: number): Observable<void> {
    return this.apiService
      .delete(`teams/${id}`)
      .pipe(switchMap(() => this.callGetList()));
  }

  private updateTeam(value: Team[]): void {
    this.team = value;
    this.team$.next(this.team);
  }

  private updateTotalTeam(value: number): void {
    this.total = value;
    this.total$.next(this.total);
  }
}
