import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  debounceTime,
  map,
  Observable,
  switchMap,
} from 'rxjs';
import { ApiService } from '../../../../services/api.service';
import { Color, ColorListResponse, ColorSave } from '../models/colors.model';

// 1. Definir interfaz de estado
export interface ColorFilterState {
  limit: number;
  page: number;
  search: string;
}

@Injectable({
  providedIn: 'root',
})
export class ColorsService {
  colors: Color[] = [];
  colors$: BehaviorSubject<Color[]> = new BehaviorSubject<Color[]>(this.colors);

  total: number = 0;
  total$: BehaviorSubject<number> = new BehaviorSubject<number>(this.total);

  // 2. Variables de persistencia
  private filterState: ColorFilterState | null = null;
  private readonly STORAGE_KEY = 'colors_filter_state';

  constructor(private apiService: ApiService) {}

  // Métodos de estado
  private setFilterState(limit: number, page: number, search: string) {
    this.filterState = { limit, page, search };
    sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.filterState));
  }

  getFilterState(): ColorFilterState | null {
    if (!this.filterState) {
      const saved = sessionStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        try {
          this.filterState = JSON.parse(saved);
        } catch (e) {
          console.error('Error parsing color filter state', e);
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

    let url = `colors?limit=${limit}&page=${page}`;
    if (name) {
      url += `&search=${name}`;
    }
    return this.apiService.get<ColorListResponse>(url).pipe(
      debounceTime(600),
      map((response: ColorListResponse) => {
        this.updateColors(response.data);
        this.updateTotalColors(response.paginate.total);
      }),
    );
  }

  getList(): Observable<Color[]> {
    return this.colors$.asObservable();
  }

  getTotal(): Observable<number> {
    return this.total$.asObservable();
  }

  // 4. Helper para recargar manteniendo página
  private reloadWithCurrentState(): Observable<void> {
    const s = this.getFilterState();
    return this.callGetList(s?.limit ?? 10, s?.page ?? 1, s?.search ?? '');
  }

  create(data: ColorSave): Observable<void> {
    return this.apiService
      .post('colors', data)
      .pipe(switchMap(() => this.reloadWithCurrentState()));
  }

  delete(id: number): Observable<void> {
    return this.apiService
      .delete(`colors/${id}`)
      .pipe(switchMap(() => this.reloadWithCurrentState()));
  }

  edit(id: number, data: ColorSave): Observable<void> {
    return this.apiService
      .patch(`colors/${id}`, data)
      .pipe(switchMap(() => this.reloadWithCurrentState()));
  }

  getOne(id: number): Observable<Color> {
    return this.apiService.get(`colors/${id}`);
  }

  private updateColors(value: Color[]): void {
    this.colors = value;
    this.colors$.next(this.colors);
  }

  private updateTotalColors(value: number): void {
    this.total = value;
    this.total$.next(this.total);
  }
}
