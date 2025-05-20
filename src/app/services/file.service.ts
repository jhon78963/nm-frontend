import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { BASE_S3_URL } from '../utils/constants';
import { FileApiService } from './file-api.service';

@Injectable({
  providedIn: 'root',
})
export class FileService {
  BASE_S3_URL = BASE_S3_URL;
  constructor(
    private apiService: ApiService,
    private fileApiService: FileApiService,
  ) {}

  createImage(data: any) {
    return this.fileApiService.post('images/upload', data);
  }

  deleteImage(path: string) {
    return this.fileApiService.delete(`images/${path}`);
  }

  saveImage(path: string): any {
    return this.apiService.post('images', { path });
  }

  saveProductImage(productId: number, imageId: number) {
    return this.apiService.post(`products/${productId}/image/${imageId}`, {});
  }

  getImageByProduct(productId: number) {
    return this.apiService.get(`products/${productId}/image`);
  }

  removeImageProduct(productId: number, imageId: number) {
    return this.apiService.delete(`products/${productId}/image/${imageId}`);
  }

  removeImage(imageId: number) {
    return this.apiService.delete(`images/${imageId}`);
  }
}
