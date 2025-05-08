import { Injectable } from '@angular/core';
import { ApiService } from '../../../../services/api.service';
import { Observable } from 'rxjs';
import { ProductSizeSave } from '../models/sizes.interface';
import { Size } from '../../size/models/sizes.model';

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

  getSizes(productId: number, size?: string): Observable<Size[]> {
    let url = `colors/sizes?productId=${productId}`;
    if (size) {
      url += `&size=${size}`;
    }
    return this.apiService.get<Size[]>(url);
  }

  getColors(productSizeId: number) {
    return this.apiService.get(
      `colors/selected?productSizeId=${productSizeId}`,
    );
  }
}
