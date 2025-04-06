import { Injectable } from '@angular/core';
import { ApiService } from '../../../../services/api.service';
import { Observable } from 'rxjs';
import { ProductSizeSave } from '../models/sizes.interface';

@Injectable({
  providedIn: 'root',
})
export class ProductSizesService {
  constructor(private apiService: ApiService) {}

  add(
    productId: number,
    sizeId: number,
    data: ProductSizeSave,
  ): Observable<void> {
    return this.apiService.post(`products/${productId}/size/${sizeId}`, data);
  }

  get(productId: number, sizeId: number): Observable<void> {
    return this.apiService.get(`products/${productId}/size/${sizeId}`);
  }

  remove(productId: number, sizeId: number): Observable<void> {
    return this.apiService.delete(`products/${productId}/size/${sizeId}`);
  }

  update(
    productId: number,
    sizeId: number,
    data: ProductSizeSave,
  ): Observable<void> {
    return this.apiService.patch(`products/${productId}/size/${sizeId}`, data);
  }

  getProductSizeId(productId: number, sizeId: number): Observable<void> {
    return this.apiService.get(`products/${productId}/size/${sizeId}`);
  }
}
