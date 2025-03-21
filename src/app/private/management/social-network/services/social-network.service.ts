import { Injectable } from '@angular/core';
import { ApiService } from '../../../../services/api.service';
import {
  SocialNetwork,
  SocialNetworkistResponse,
} from '../models/social-network.model';
import {
  BehaviorSubject,
  debounceTime,
  map,
  Observable,
  switchMap,
} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SocialNetworkService {
  socialNetworks: SocialNetwork[] = [];
  socialNetworks$: BehaviorSubject<SocialNetwork[]> = new BehaviorSubject<
    SocialNetwork[]
  >(this.socialNetworks);

  total: number = 0;
  total$: BehaviorSubject<number> = new BehaviorSubject<number>(this.total);

  constructor(private apiService: ApiService) {}

  callGetList(
    limit: number = 10,
    page: number = 1,
    name: string = '',
  ): Observable<void> {
    let url = `companies/getAll/social-network?limit=${limit}&page=${page}`;
    if (name) {
      url += `&search=${name}`;
    }
    return this.apiService.get<SocialNetworkistResponse>(url).pipe(
      debounceTime(600),
      map((response: SocialNetworkistResponse) => {
        this.updatSocialNetworks(response.data);
        this.updateTotalSocialNetworks(response.paginate.total);
      }),
    );
  }

  getList(): Observable<SocialNetwork[]> {
    return this.socialNetworks$.asObservable();
  }

  getTotal(): Observable<number> {
    return this.total$.asObservable();
  }

  create(data: SocialNetwork): Observable<void> {
    return this.apiService
      .post('companies/add/social-network', data)
      .pipe(switchMap(() => this.callGetList()));
  }

  delete(id: number): Observable<void> {
    return this.apiService
      .delete(`companies/remove/social-network/${id}`)
      .pipe(switchMap(() => this.callGetList()));
  }

  edit(id: number, data: SocialNetwork): Observable<void> {
    return this.apiService
      .patch(`companies/edit/social-network/${id}`, data)
      .pipe(switchMap(() => this.callGetList()));
  }

  getOne(id: number): Observable<SocialNetwork> {
    return this.apiService.get(`companies/get/social-network/${id}`);
  }

  private updatSocialNetworks(value: SocialNetwork[]): void {
    this.socialNetworks = value;
    this.socialNetworks$.next(this.socialNetworks);
  }

  private updateTotalSocialNetworks(value: number): void {
    this.total = value;
    this.total$.next(this.total);
  }
}
