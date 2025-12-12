import { Injectable } from '@angular/core';
import { Sale, SaleListResponse } from '../models/sales.model';
import {
  BehaviorSubject,
  debounceTime,
  map,
  Observable,
  switchMap,
} from 'rxjs';
import { ApiService } from '../../../../services/api.service';

@Injectable({
  providedIn: 'root',
})
export class SalesService {
  sales: Sale[] = [];
  sales$: BehaviorSubject<Sale[]> = new BehaviorSubject<Sale[]>(this.sales);

  total: number = 0;
  total$: BehaviorSubject<number> = new BehaviorSubject<number>(this.total);

  constructor(private apiService: ApiService) {}

  callGetList(
    limit: number = 10,
    page: number = 1,
    name: string = '',
  ): Observable<void> {
    let url = `sales?limit=${limit}&page=${page}`;
    if (name) {
      url += `&search=${name}`;
    }
    return this.apiService.get<SaleListResponse>(url).pipe(
      debounceTime(600),
      map((response: SaleListResponse) => {
        this.updateSales(response.data);
        this.updateTotalSales(response.paginate.total);
      }),
    );
  }

  getList(): Observable<Sale[]> {
    return this.sales$.asObservable();
  }

  getTotal(): Observable<number> {
    return this.total$.asObservable();
  }

  create(data: Sale): Observable<void> {
    return this.apiService
      .post('sales', data)
      .pipe(switchMap(() => this.callGetList()));
  }

  delete(id: number): Observable<void> {
    return this.apiService
      .delete(`sales/${id}`)
      .pipe(switchMap(() => this.callGetList()));
  }

  edit(id: number, data: Sale): Observable<void> {
    return this.apiService
      .patch(`sales/${id}`, data)
      .pipe(switchMap(() => this.callGetList()));
  }

  getOne(id: number): Observable<Sale> {
    return this.apiService.get(`sales/${id}`);
  }

  private updateSales(value: Sale[]): void {
    this.sales = value;
    this.sales$.next(this.sales);
  }

  private updateTotalSales(value: number): void {
    this.total = value;
    this.total$.next(this.total);
  }
}
