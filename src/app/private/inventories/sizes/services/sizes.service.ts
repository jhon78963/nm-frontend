import { Injectable } from '@angular/core';
import { Size, SizeListResponse, SizeSave } from '../models/sizes.model';
import {
  BehaviorSubject,
  debounceTime,
  map,
  Observable,
  switchMap,
} from 'rxjs';
import { ApiService } from '../../../../services/api.service';

// 1. Definimos la interfaz del estado
export interface SizeFilterState {
  limit: number;
  page: number;
  search: string;
  sizeTypeIds: number[];
}

@Injectable({
  providedIn: 'root',
})
export class SizesService {
  sizes: Size[] = [];
  sizes$: BehaviorSubject<Size[]> = new BehaviorSubject<Size[]>(this.sizes);

  total: number = 0;
  total$: BehaviorSubject<number> = new BehaviorSubject<number>(this.total);

  // 2. Variables para persistencia
  private filterState: SizeFilterState | null = null;
  private readonly STORAGE_KEY = 'sizes_filter_state';

  constructor(private apiService: ApiService) {}

  // Métodos para guardar/leer estado
  private setFilterState(
    limit: number,
    page: number,
    search: string,
    sizeTypeIds: number[],
  ) {
    this.filterState = { limit, page, search, sizeTypeIds };
    sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.filterState));
  }

  getFilterState(): SizeFilterState | null {
    if (!this.filterState) {
      const saved = sessionStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        try {
          this.filterState = JSON.parse(saved);
        } catch (e) {
          console.error('Error parsing size filter state', e);
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
    sizeTypeIds: number[] = [],
  ): Observable<void> {
    // 3. Guardamos el estado cada vez que se lista
    this.setFilterState(limit, page, name, sizeTypeIds);

    let url = `sizes?limit=${limit}&page=${page}`;
    if (name) {
      url += `&search=${name}`;
    }
    if (sizeTypeIds instanceof Array && sizeTypeIds.length > 0) {
      url += `&sizeTypeId=${sizeTypeIds}`;
    }
    return this.apiService.get<SizeListResponse>(url).pipe(
      debounceTime(600),
      map((response: SizeListResponse) => {
        this.updateSizes(response.data);
        this.updateTotalSizes(response.paginate.total);
      }),
    );
  }

  getList(): Observable<Size[]> {
    return this.sizes$.asObservable();
  }

  getTotal(): Observable<number> {
    return this.total$.asObservable();
  }

  // 4. Helpers para recargar manteniendo filtros
  private reloadWithCurrentState(): Observable<void> {
    const s = this.getFilterState();
    // Si hay estado guardado, úsalo; si no, defaults
    return this.callGetList(
      s?.limit ?? 10,
      s?.page ?? 1,
      s?.search ?? '',
      s?.sizeTypeIds ?? [],
    );
  }

  create(data: SizeSave): Observable<void> {
    return this.apiService
      .post('sizes', data)
      .pipe(switchMap(() => this.reloadWithCurrentState()));
  }

  delete(id: number): Observable<void> {
    return this.apiService
      .delete(`sizes/${id}`)
      .pipe(switchMap(() => this.reloadWithCurrentState()));
  }

  edit(id: number, data: SizeSave): Observable<void> {
    return this.apiService
      .patch(`sizes/${id}`, data)
      .pipe(switchMap(() => this.reloadWithCurrentState()));
  }

  getOne(id: number): Observable<Size> {
    return this.apiService.get(`sizes/${id}`);
  }

  private updateSizes(value: Size[]): void {
    this.sizes = value;
    this.sizes$.next(this.sizes);
  }

  private updateTotalSizes(value: number): void {
    this.total = value;
    this.total$.next(this.total);
  }
}
