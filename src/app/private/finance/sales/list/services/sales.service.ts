import { Injectable } from '@angular/core';
import { Sale, SaleListResponse } from '../models/sales.model';
import {
  BehaviorSubject,
  debounceTime,
  map,
  Observable,
  switchMap,
} from 'rxjs';
import { ApiService } from '../../../../../services/api.service';

// 1. Interfaz del estado
export interface SaleFilterState {
  limit: number;
  page: number;
  search: string;
}

@Injectable({
  providedIn: 'root',
})
export class SalesService {
  sales: Sale[] = [];
  sales$: BehaviorSubject<Sale[]> = new BehaviorSubject<Sale[]>(this.sales);

  total: number = 0;
  total$: BehaviorSubject<number> = new BehaviorSubject<number>(this.total);

  // 2. Variables de persistencia
  private filterState: SaleFilterState | null = null;
  private readonly STORAGE_KEY = 'sales_filter_state';

  constructor(private apiService: ApiService) {}

  // Métodos de Estado
  private setFilterState(limit: number, page: number, search: string) {
    this.filterState = { limit, page, search };
    sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.filterState));
  }

  getFilterState(): SaleFilterState | null {
    if (!this.filterState) {
      const saved = sessionStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        try {
          this.filterState = JSON.parse(saved);
        } catch (e) {
          console.error('Error parsing sales filter state', e);
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

  // 4. Helper para recargar manteniendo filtros
  private reloadWithCurrentState(): Observable<void> {
    const s = this.getFilterState();
    return this.callGetList(s?.limit ?? 10, s?.page ?? 1, s?.search ?? '');
  }

  create(data: Sale): Observable<void> {
    return this.apiService
      .post('sales', data)
      .pipe(switchMap(() => this.reloadWithCurrentState()));
  }

  delete(id: number): Observable<void> {
    return this.apiService
      .delete(`sales/${id}`)
      .pipe(switchMap(() => this.reloadWithCurrentState()));
  }

  edit(id: number, data: Sale): Observable<void> {
    return this.apiService
      .patch(`sales/${id}`, data)
      .pipe(switchMap(() => this.reloadWithCurrentState()));
  }

  getOne(id: number): Observable<Sale> {
    return this.apiService.get(`sales/${id}`);
  }

  // --- NUEVAS FUNCIONES PARA CAMBIO DE MERCADERÍA ---

  searchByCode(code: string): Observable<SaleListResponse> {
    return this.apiService.get<SaleListResponse>(
      `sales?page=1&limit=1&search=${code}`,
    );
  }

  processExchange(payload: any): Observable<void> {
    return (
      this.apiService
        .post('sales/exchange', payload)
        // Usamos el reload inteligente aquí también
        .pipe(switchMap(() => this.reloadWithCurrentState()))
    );
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
