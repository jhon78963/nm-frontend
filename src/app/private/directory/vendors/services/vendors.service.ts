import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  debounceTime,
  map,
  Observable,
  switchMap,
} from 'rxjs';
import { ApiService } from '../../../../services/api.service';
import { Vendor, VendorListResponse } from '../models/vendors.model';

@Injectable({
  providedIn: 'root',
})
export class VendorsService {
  vendors: Vendor[] = [];
  total: number = 0;
  vendors$: BehaviorSubject<Vendor[]> = new BehaviorSubject<Vendor[]>(
    this.vendors,
  );
  total$: BehaviorSubject<number> = new BehaviorSubject<number>(this.total);

  constructor(private readonly apiService: ApiService) {}

  callGetList(
    limit: number = 10,
    page: number = 1,
    name: string = '',
  ): Observable<void> {
    let url = `vendors?limit=${limit}&page=${page}`;
    if (name) {
      url += `&search=${name}`;
    }
    return this.apiService.get<VendorListResponse>(url).pipe(
      debounceTime(600),
      map((response: VendorListResponse) => {
        this.updateVendors(response.data);
        this.updateTotalVendors(response.paginate.total);
      }),
    );
  }

  getList(): Observable<Vendor[]> {
    return this.vendors$.asObservable();
  }

  getTotal(): Observable<number> {
    return this.total$.asObservable();
  }

  getOne(id: number): Observable<Vendor> {
    return this.apiService.get(`vendors/${id}`);
  }

  create(data: Vendor): Observable<void> {
    return this.apiService
      .post('vendors', data)
      .pipe(switchMap(() => this.callGetList()));
  }

  edit(id: number, data: Vendor): Observable<void> {
    return this.apiService
      .patch(`vendors/${id}`, data)
      .pipe(switchMap(() => this.callGetList()));
  }

  delete(id: number): Observable<void> {
    return this.apiService
      .delete(`vendors/${id}`)
      .pipe(switchMap(() => this.callGetList()));
  }

  private updateVendors(value: Vendor[]): void {
    this.vendors = value;
    this.vendors$.next(this.vendors);
  }

  private updateTotalVendors(value: number): void {
    this.total = value;
    this.total$.next(this.total);
  }
}
