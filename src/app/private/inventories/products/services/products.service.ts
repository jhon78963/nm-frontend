import { Injectable } from '@angular/core';
import { ApiService } from '../../../../services/api.service';
import {
  Product,
  ProductListResponse,
  ProductSave,
} from '../models/products.model';
import {
  BehaviorSubject,
  debounceTime,
  map,
  Observable,
  switchMap,
} from 'rxjs';

export interface ProductFilterState {
  limit: number;
  page: number;
  name: string;
  genderId: number[];
}

@Injectable({
  providedIn: 'root',
})
export class ProductsService {
  products: Product[] = [];
  products$: BehaviorSubject<Product[]> = new BehaviorSubject<Product[]>(
    this.products,
  );

  total: number = 0;
  total$: BehaviorSubject<number> = new BehaviorSubject<number>(this.total);

  // Variable en memoria
  private filterState: ProductFilterState | null = null;
  // Clave para guardar en el navegador
  private readonly STORAGE_KEY = 'products_filter_state';

  constructor(private apiService: ApiService) {}

  // 1. Guardar en memoria Y en SessionStorage
  setFilterState(
    limit: number,
    page: number,
    name: string,
    genderId: number[],
  ) {
    this.filterState = { limit, page, name, genderId };
    sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.filterState));
  }

  // 2. Recuperar: Si no está en memoria, buscar en SessionStorage
  getFilterState(): ProductFilterState | null {
    if (!this.filterState) {
      const saved = sessionStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        try {
          this.filterState = JSON.parse(saved);
        } catch (e) {
          console.error('Error parsing filter state', e);
          return null;
        }
      }
    }
    return this.filterState;
  }

  // 3. Limpiar todo
  clearFilterState() {
    this.filterState = null;
    sessionStorage.removeItem(this.STORAGE_KEY);
  }

  callGetList(
    limit: number = 10,
    page: number = 1,
    name: string = '',
    genderId: number[] = [],
  ): Observable<void> {
    // Esto guardará automáticamente en el storage cada vez que busques
    this.setFilterState(limit, page, name, genderId);

    let url = `products?limit=${limit}&page=${page}`;
    if (name) {
      url += `&search=${name}`;
    }
    if (genderId && genderId.length > 0) {
      url += `&genderId=${genderId}`;
    }
    return this.apiService.get<ProductListResponse>(url).pipe(
      debounceTime(600),
      map((response: ProductListResponse) => {
        this.updateProducts(response.data);
        this.updateTotalProducts(response.paginate.total);
      }),
    );
  }

  getList(): Observable<Product[]> {
    return this.products$.asObservable();
  }

  getTotal(): Observable<number> {
    return this.total$.asObservable();
  }

  create(
    data: ProductSave,
  ): Observable<{ message: string; productId: number }> {
    return this.apiService.post<{ message: string; productId: number }>(
      'products',
      data,
    );
  }

  delete(id: number): Observable<void> {
    return this.apiService
      .delete(`products/${id}`)
      .pipe(switchMap(() => this.callGetList()));
  }

  edit(
    id: number,
    data: ProductSave,
  ): Observable<{ message: string; productId: number }> {
    return this.apiService.patch<{ message: string; productId: number }>(
      `products/${id}`,
      data,
    );
  }

  getOne(id: number): Observable<Product> {
    return this.apiService.get(`products/${id}`);
  }

  getHistory(id: number): Observable<any> {
    return this.apiService.get(`products/${id}/history`);
  }

  private updateProducts(value: Product[]): void {
    this.products = value;
    this.products$.next(this.products);
  }

  private updateTotalProducts(value: number): void {
    this.total = value;
    this.total$.next(this.total);
  }
}
