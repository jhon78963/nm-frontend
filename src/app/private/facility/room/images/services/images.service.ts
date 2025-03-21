import { Injectable } from '@angular/core';

import {
  BehaviorSubject,
  debounceTime,
  map,
  Observable,
  switchMap,
} from 'rxjs';

import { ApiService } from '../../../../../services/api.service';

import { ImageListResponse, Image } from '../models/images.model';

@Injectable({
  providedIn: 'root',
})
export class ImagesService {
  images: Image[] = [];
  images$: BehaviorSubject<Image[]> = new BehaviorSubject<Image[]>(this.images);

  total: number = 0;
  total$: BehaviorSubject<number> = new BehaviorSubject<number>(this.total);

  constructor(private readonly apiService: ApiService) {}

  callGetList(
    limit: number = 10,
    page: number = 1,
    name: string = '',
  ): Observable<void> {
    let url = `images?limit=${limit}&page=${page}`;
    if (name) {
      url += `&search=${name}`;
    }
    return this.apiService.get<ImageListResponse>(url).pipe(
      debounceTime(600),
      map((response: ImageListResponse) => {
        this.updateImages(response.data);
        this.updateTotalImages(response.paginate.total);
      }),
    );
  }

  getList(): Observable<Image[]> {
    return this.images$.asObservable();
  }

  getTotal(): Observable<number> {
    return this.total$.asObservable();
  }

  getOne(id: number): Observable<Image> {
    return this.apiService.get(`images/${id}`);
  }

  delete(id: number): Observable<void> {
    return this.apiService
      .delete(`images/${id}`)
      .pipe(switchMap(() => this.callGetList()));
  }

  private updateImages(value: Image[]): void {
    this.images = value;
    this.images$.next(this.images);
  }

  private updateTotalImages(value: number): void {
    this.total = value;
    this.total$.next(this.total);
  }
}
