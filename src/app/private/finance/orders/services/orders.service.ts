import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  debounceTime,
  map,
  Observable,
  switchMap,
} from 'rxjs';
import { ApiService } from '../../../../services/api.service';
import { Order, OrderListResponse } from '../models/orders.model';

// 1. Interfaz del estado
export interface OrderFilterState {
  limit: number;
  page: number;
  search: string;
}

@Injectable({
  providedIn: 'root',
})
export class OrdersService {
  orders: Order[] = [];
  orders$: BehaviorSubject<Order[]> = new BehaviorSubject<Order[]>(this.orders);

  total: number = 0;
  total$: BehaviorSubject<number> = new BehaviorSubject<number>(this.total);

  // 2. Variables de persistencia
  private filterState: OrderFilterState | null = null;
  private readonly STORAGE_KEY = 'orders_filter_state';

  constructor(private apiService: ApiService) {}

  // Métodos de Estado
  private setFilterState(limit: number, page: number, search: string) {
    this.filterState = { limit, page, search };
    sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.filterState));
  }

  getFilterState(): OrderFilterState | null {
    if (!this.filterState) {
      const saved = sessionStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        try {
          this.filterState = JSON.parse(saved);
        } catch (e) {
          console.error('Error parsing orders filter state', e);
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
    // 3. Guardar estado
    this.setFilterState(limit, page, name);

    let url = `orders?limit=${limit}&page=${page}`;
    if (name) {
      url += `&search=${name}`;
    }
    return this.apiService.get<OrderListResponse>(url).pipe(
      debounceTime(600),
      map((response: OrderListResponse) => {
        this.updateOrders(response.data);
        this.updateTotalOrders(response.paginate.total);
      }),
    );
  }

  getList(): Observable<Order[]> {
    return this.orders$.asObservable();
  }

  getTotal(): Observable<number> {
    return this.total$.asObservable();
  }

  // 4. Helper para recargar manteniendo filtros
  private reloadWithCurrentState(): Observable<void> {
    const s = this.getFilterState();
    return this.callGetList(s?.limit ?? 10, s?.page ?? 1, s?.search ?? '');
  }

  create(data: Order): Observable<void> {
    return this.apiService
      .post('orders', data)
      .pipe(switchMap(() => this.reloadWithCurrentState()));
  }

  delete(id: number): Observable<void> {
    return this.apiService
      .delete(`orders/${id}`)
      .pipe(switchMap(() => this.reloadWithCurrentState()));
  }

  edit(id: number, data: Order): Observable<void> {
    return this.apiService
      .patch(`orders/${id}`, data)
      .pipe(switchMap(() => this.reloadWithCurrentState()));
  }

  getOne(id: number): Observable<Order> {
    return this.apiService.get(`orders/${id}`);
  }

  private updateOrders(value: Order[]): void {
    this.orders = value;
    this.orders$.next(this.orders);
  }

  private updateTotalOrders(value: number): void {
    this.total = value;
    this.total$.next(this.total);
  }
}
