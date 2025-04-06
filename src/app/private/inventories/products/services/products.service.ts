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

  constructor(private apiService: ApiService) {}

  callGetList(
    limit: number = 10,
    page: number = 1,
    name: string = '',
  ): Observable<void> {
    let url = `products?limit=${limit}&page=${page}`;
    if (name) {
      url += `&search=${name}`;
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

  private updateProducts(value: Product[]): void {
    this.products = value;
    this.products$.next(this.products);
  }

  private updateTotalProducts(value: number): void {
    this.total = value;
    this.total$.next(this.total);
  }
}
