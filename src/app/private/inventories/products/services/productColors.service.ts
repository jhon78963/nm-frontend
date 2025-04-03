import { Injectable } from '@angular/core';
import { ApiService } from '../../../../services/api.service';
import { Observable } from 'rxjs';
import { ProductSizeSave } from '../models/sizes.interface';

@Injectable({
  providedIn: 'root',
})
export class ProductSizeColorsService {
  constructor(private apiService: ApiService) {}

  add(
    productSizeId: number,
    colorId: number,
    data: ProductSizeSave,
  ): Observable<void> {
    return this.apiService.post(
      `product-size/${productSizeId}/color/${colorId}`,
      data,
    );
  }

  remove(productSizeId: number, colorId: number): Observable<void> {
    return this.apiService.delete(
      `product-size/${productSizeId}/color/${colorId}`,
    );
  }

  update(
    productSizeId: number,
    colorId: number,
    data: ProductSizeSave,
  ): Observable<void> {
    return this.apiService.patch(
      `product-size/${productSizeId}/color/${colorId}`,
      data,
    );
  }
}
