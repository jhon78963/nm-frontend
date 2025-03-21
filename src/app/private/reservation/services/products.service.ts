import { Injectable } from '@angular/core';
import { Product } from '../models/product.model';
import { BehaviorSubject, debounceTime, map, Observable } from 'rxjs';
import { ApiService } from '../../../services/api.service';

@Injectable({
  providedIn: 'root',
})
export class ProductsService {
  products: any[] = [];
  products$: BehaviorSubject<any[]> = new BehaviorSubject<Product[]>(
    this.products,
  );

  constructor(private apiService: ApiService) {}

  callGetList(name: string = ''): Observable<void> {
    let url = 'reservations/products';
    if (name) {
      url += `?name=${name}`;
    }
    return this.apiService.get<Product[]>(url).pipe(
      debounceTime(600),
      map((product: Product[]) => {
        this.updateProducts(product);
      }),
    );
  }

  getList(): Observable<Product[]> {
    return this.products$.asObservable();
  }

  private updateProducts(value: Product[]): void {
    this.products = value;
    this.products$.next(this.products);
  }
}
