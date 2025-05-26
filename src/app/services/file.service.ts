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

  createImage(data: FormData, multiply: boolean) {
    const endpoint = multiply ? 'images/multiple-upload' : 'images/upload';
    return this.fileApiService.post(endpoint, data);
  }

  deleteImage(path: string) {
    return this.fileApiService.delete(`images/${path}`);
  }

  saveImage(productId: number, image: any) {
    return this.apiService.post(`products/${productId}/upload/image`, image);
  }

  saveMultipleImage(productId: number, images: any) {
    return this.apiService.post(`products/${productId}/upload/images`, images);
  }

  getImageByProduct(productId: number) {
    return this.apiService.get(`products/${productId}/images`);
  }

  removeImageProduct(productId: number, imageId: number) {
    return this.apiService.delete(`products/${productId}/image/${imageId}`);
  }

  removeImage(imageId: number) {
    return this.apiService.delete(`images/${imageId}`);
  }
}
