import { Injectable } from '@angular/core';
import { BehaviorSubject, debounceTime, map, Observable } from 'rxjs';
import { Cash, CashListResponse } from '../models/cash.model';
import { ApiService } from '../../../services/api.service';
import { CashOperation } from '../../reservation/models/cash.model';

@Injectable({
  providedIn: 'root',
})
export class CashesService {
  cashes: Cash[] = [];
  cashes$: BehaviorSubject<Cash[]> = new BehaviorSubject<Cash[]>(this.cashes);

  total: number = 0;
  total$: BehaviorSubject<number> = new BehaviorSubject<number>(this.total);

  constructor(private apiService: ApiService) {}

  callGetList(
    limit: number = 50,
    page: number = 1,
    schedule: number = 0,
    startDate: string | null = null,
    endDate: string | null = null,
  ): Observable<void> {
    let url = `cashes?limit=${limit}&page=${page}`;
    if (schedule != 0) {
      url += `&schedule=${schedule}`;
    }
    if (startDate) {
      url += `&startDate=${startDate}`;
    }
    if (endDate) {
      url += `&endDate=${endDate}`;
    }
    return this.apiService.get<CashListResponse>(url).pipe(
      debounceTime(600),
      map((response: CashListResponse) => {
        this.updateCashes(response.data);
        this.updateTotalCashes(response.paginate.total);
      }),
    );
  }

  getList(): Observable<Cash[]> {
    return this.cashes$.asObservable();
  }

  getTotal(): Observable<number> {
    return this.total$.asObservable();
  }

  create(cashOperation: CashOperation): Observable<void> {
    return this.apiService.post(`cash-operations`, cashOperation);
  }

  public updateCashes(cash: Cash[]): void {
    this.cashes = cash;
    this.cashes$.next(this.cashes);
  }

  public updateTotalCashes(total: number): void {
    this.total = total;
    this.total$.next(this.total);
  }
}
