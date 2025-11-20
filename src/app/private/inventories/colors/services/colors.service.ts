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

@Injectable({
  providedIn: 'root',
})
export class ColorsService {
  colors: Color[] = [];
  colors$: BehaviorSubject<Color[]> = new BehaviorSubject<Color[]>(this.colors);

  total: number = 0;
  total$: BehaviorSubject<number> = new BehaviorSubject<number>(this.total);

  constructor(private apiService: ApiService) {}

  callGetList(
    limit: number = 10,
    page: number = 1,
    name: string = '',
  ): Observable<void> {
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

  create(data: ColorSave): Observable<void> {
    return this.apiService
      .post('colors', data)
      .pipe(switchMap(() => this.callGetList()));
  }

  delete(id: number): Observable<void> {
    return this.apiService
      .delete(`colors/${id}`)
      .pipe(switchMap(() => this.callGetList()));
  }

  edit(id: number, data: ColorSave): Observable<void> {
    return this.apiService
      .patch(`colors/${id}`, data)
      .pipe(switchMap(() => this.callGetList()));
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
