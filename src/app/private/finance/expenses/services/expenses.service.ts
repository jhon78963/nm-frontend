import { Injectable } from '@angular/core';
import { ApiService } from '../../../../services/api.service';

import {
  BehaviorSubject,
  debounceTime,
  map,
  Observable,
  switchMap,
} from 'rxjs';
import { Expense, ExpenseListResponse } from '../models/expenses.model';

export interface ExpenseFilterState {
  limit: number;
  page: number;
  search: string;
}

@Injectable({ providedIn: 'root' })
export class ExpensesService {
  expenses: Expense[] = [];
  expenses$: BehaviorSubject<Expense[]> = new BehaviorSubject<Expense[]>(
    this.expenses,
  );

  total: number = 0;
  total$: BehaviorSubject<number> = new BehaviorSubject<number>(this.total);

  private filterState: ExpenseFilterState | null = null;
  private readonly STORAGE_KEY = 'expenses_filter_state';

  constructor(private apiService: ApiService) {}

  private setFilterState(limit: number, page: number, search: string) {
    this.filterState = { limit, page, search };
    sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.filterState));
  }

  getFilterState(): ExpenseFilterState | null {
    if (!this.filterState) {
      const saved = sessionStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        try {
          this.filterState = JSON.parse(saved);
        } catch (e) {
          console.error('Error parsing expenses filter state', e);
          return null;
        }
      }
    }
    return this.filterState;
  }

  clearFilterState() {
    this.filterState = null;
    sessionStorage.removeItem(this.STORAGE_KEY);
  }

  callGetList(
    limit: number = 10,
    page: number = 1,
    name: string = '',
  ): Observable<void> {
    this.setFilterState(limit, page, name);

    let url = `expenses?limit=${limit}&page=${page}`;
    if (name) {
      url += `&search=${name}`;
    }
    return this.apiService.get<ExpenseListResponse>(url).pipe(
      debounceTime(600),
      map((response: ExpenseListResponse) => {
        this.updateExpenses(response.data);
        this.updateTotalExpenses(response.paginate.total);
      }),
    );
  }

  getList(): Observable<Expense[]> {
    return this.expenses$.asObservable();
  }

  getTotal(): Observable<number> {
    return this.total$.asObservable();
  }

  private reloadWithCurrentState(): Observable<void> {
    const s = this.getFilterState();
    return this.callGetList(s?.limit ?? 10, s?.page ?? 1, s?.search ?? '');
  }

  create(data: Expense): Observable<void> {
    return this.apiService
      .post('expenses', data)
      .pipe(switchMap(() => this.reloadWithCurrentState()));
  }

  delete(id: number): Observable<void> {
    return this.apiService
      .delete(`expenses/${id}`)
      .pipe(switchMap(() => this.reloadWithCurrentState()));
  }

  edit(id: number, data: Expense): Observable<void> {
    return this.apiService
      .patch(`expenses/${id}`, data)
      .pipe(switchMap(() => this.reloadWithCurrentState()));
  }

  getOne(id: number): Observable<Expense> {
    return this.apiService.get(`expenses/${id}`);
  }

  private updateExpenses(value: Expense[]): void {
    this.expenses = value;
    this.expenses$.next(this.expenses);
  }

  private updateTotalExpenses(value: number): void {
    this.total = value;
    this.total$.next(this.total);
  }
}
