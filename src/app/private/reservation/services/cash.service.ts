import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { ApiService } from '../../../services/api.service';
import {
  Cash,
  CashOperation,
  CashTotal,
  CashType,
  CashUpdate,
  CurrentCash,
} from '../models/cash.model';
import { Schedule } from '../models/schedule.model';

@Injectable({
  providedIn: 'root',
})
export class CashService {
  employee: string = '';
  employee$: BehaviorSubject<string> = new BehaviorSubject<string>(
    this.employee,
  );

  pettyCash: number = 0;
  pettyCash$: BehaviorSubject<number> = new BehaviorSubject<number>(
    this.pettyCash,
  );

  amount: number = 0;
  amount$: BehaviorSubject<number> = new BehaviorSubject<number>(this.amount);

  cashAmount: number = 0;
  cashAmount$: BehaviorSubject<number> = new BehaviorSubject<number>(
    this.cashAmount,
  );

  cardAmount: number = 0;
  cardAmount$: BehaviorSubject<number> = new BehaviorSubject<number>(
    this.cardAmount,
  );

  total: number = 0;
  total$: BehaviorSubject<number> = new BehaviorSubject<number>(this.total);

  cashType: CashType = { id: 0, key: '', label: '' };
  cashType$: BehaviorSubject<CashType> = new BehaviorSubject<CashType>(
    this.cashType,
  );

  constructor(private apiService: ApiService) {}

  getCashTotal(): Observable<void> {
    return this.apiService.get<CashTotal>(`cash-operations/total`).pipe(
      map((cash: CashTotal) => {
        this.updateEmployee(cash.employee);
        this.updatePettyCash(cash.pettyCash);
        this.updateAmount(cash.amount);
        this.updateCashAmount(cash.cashAmount);
        this.updateCardAmount(cash.cardAmount);
        this.updateTotal(cash.total);
      }),
    );
  }

  getmployee(): Observable<string> {
    return this.employee$.asObservable();
  }

  getPettyCash(): Observable<number> {
    return this.pettyCash$.asObservable();
  }

  getAmount(): Observable<number> {
    return this.amount$.asObservable();
  }

  getCashAmount(): Observable<number> {
    return this.cashAmount$.asObservable();
  }

  getCardAmount(): Observable<number> {
    return this.cardAmount$.asObservable();
  }

  getTotal(): Observable<number> {
    return this.total$.asObservable();
  }

  getCashValidate(): Observable<void> {
    return this.apiService.get<CashType>(`cash-types/get`).pipe(
      map((cash: CashType) => {
        this.updateCashType(cash);
      }),
    );
  }

  getCashType(): Observable<CashType> {
    return this.cashType$.asObservable();
  }

  updateEmployee(employee: string): void {
    this.employee = employee;
    this.employee$.next(employee);
  }

  updatePettyCash(pettyCash: number): void {
    this.pettyCash = pettyCash;
    this.pettyCash$.next(pettyCash);
  }

  updateAmount(amount: number): void {
    this.amount = amount;
    this.amount$.next(amount);
  }

  updateCashAmount(cashAmount: number): void {
    this.cashAmount = cashAmount;
    this.cashAmount$.next(cashAmount);
  }

  updateCardAmount(cardAmount: number): void {
    this.cardAmount = cardAmount;
    this.cardAmount$.next(cardAmount);
  }

  updateTotal(total: number): void {
    this.total = total;
    this.total$.next(total);
  }

  updateCashType(cashType: CashType): void {
    this.cashType = cashType;
    this.cashType$.next(cashType);
  }

  createOperation(body: CashOperation): Observable<void> {
    return this.apiService.post('cash-operations', body);
  }

  createCash(body: Cash): Observable<void> {
    return this.apiService.post('cashes', body);
  }

  updateCash(id: number, body: CashUpdate): Observable<void> {
    return this.apiService.put(`cashes/${id}`, body);
  }

  currentCash(): Observable<CurrentCash> {
    return this.apiService.get('cashes/current');
  }

  currentSchedule(): Observable<Schedule> {
    return this.apiService.get('schedules/current');
  }
}
