import { Injectable } from '@angular/core';
import { Size, SizeSave } from '../models/sizes.model';
import {
  BehaviorSubject,
  debounceTime,
  map,
  Observable,
  switchMap,
} from 'rxjs';
import { ApiService } from '../../../../services/api.service';

@Injectable({
  providedIn: 'root',
})
export class SizesSelectedService {
  sizes: Size[] = [];
  sizes$: BehaviorSubject<Size[]> = new BehaviorSubject<Size[]>(this.sizes);
  constructor(private apiService: ApiService) {}
  callGetList(
    productId: number,
    sizeTypeId: number | number[],
  ): Observable<void> {
    let url = `sizes/selected?productId=${productId}`;
    if (sizeTypeId instanceof Array && sizeTypeId.length > 0) {
      url += `&sizeTypeId=${sizeTypeId}`;
    }
    return this.apiService.get<Size[]>(url).pipe(
      debounceTime(600),
      map((size: Size[]) => {
        this.updateSizes(size);
      }),
    );
  }

  getList(): Observable<Size[]> {
    return this.sizes$.asObservable();
  }

  create(
    data: SizeSave,
    productId: number,
    sizeTypeId: number,
  ): Observable<void> {
    return this.apiService
      .post('sizes', data)
      .pipe(switchMap(() => this.callGetList(productId, sizeTypeId)));
  }

  getSizeTypes(): Observable<Size[]> {
    return this.apiService.get('size-types');
  }

  private updateSizes(value: Size[]): void {
    this.sizes = value;
    this.sizes$.next(this.sizes);
  }
}
