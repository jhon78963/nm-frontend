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

@Injectable({
  providedIn: 'root',
})
export class SizesService {
  sizes: Size[] = [];
  sizes$: BehaviorSubject<Size[]> = new BehaviorSubject<Size[]>(this.sizes);

  total: number = 0;
  total$: BehaviorSubject<number> = new BehaviorSubject<number>(this.total);

  constructor(private apiService: ApiService) {}

  callGetList(
    limit: number = 10,
    page: number = 1,
    name: string = '',
  ): Observable<void> {
    let url = `sizes?limit=${limit}&page=${page}`;
    if (name) {
      url += `&search=${name}`;
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

  create(data: SizeSave): Observable<void> {
    return this.apiService
      .post('sizes', data)
      .pipe(switchMap(() => this.callGetList()));
  }

  delete(id: number): Observable<void> {
    return this.apiService
      .delete(`sizes/${id}`)
      .pipe(switchMap(() => this.callGetList()));
  }

  edit(id: number, data: SizeSave): Observable<void> {
    return this.apiService
      .patch(`sizes/${id}`, data)
      .pipe(switchMap(() => this.callGetList()));
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
