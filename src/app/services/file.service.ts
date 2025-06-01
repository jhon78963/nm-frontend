import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { BASE_S3_URL } from '../utils/constants';
import { FileApiService } from './file-api.service';
import { PImage } from '../private/inventories/products/models/images.interface';
import { BehaviorSubject, debounceTime, map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FileService {
  BASE_S3_URL = BASE_S3_URL;
  images: PImage[] = [];
  images$: BehaviorSubject<PImage[]> = new BehaviorSubject<PImage[]>(
    this.images,
  );
  constructor(
    private apiService: ApiService,
    private fileApiService: FileApiService,
  ) {}

  callGetList(productId: number): Observable<void> {
    return this.apiService.get<PImage[]>(`products/${productId}/images`).pipe(
      debounceTime(600),
      map((images: PImage[]) => {
        this.updateImages(images);
      }),
    );
  }

  getList(): Observable<PImage[]> {
    return this.images$.asObservable();
  }

  createImage(data: FormData, multiply: boolean) {
    const endpoint = multiply ? 'images/multiple-upload' : 'images/upload';
    return this.fileApiService.post(endpoint, data);
  }

  saveImage(productId: number, image: any) {
    return this.apiService.post(`products/${productId}/upload/image`, image);
  }

  saveMultipleImage(productId: number, images: any) {
    return this.apiService.post(`products/${productId}/upload/images`, images);
  }

  deleteImage(path: string) {
    return this.fileApiService.delete(`images/${path}`);
  }

  removeImage(productId: number, path: string) {
    return this.apiService.delete(`products/${productId}/image/${path}`);
  }

  removeMultipleImage(productId: number, path: string[]) {
    return this.apiService.post(`products/${productId}/remove/images`, {
      path,
    });
  }

  private updateImages(value: PImage[]): void {
    this.images = value;
    this.images$.next(this.images);
  }
}
