import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BASE_URL } from '../../../../utils/constants';
import {
  ProductMediaDeleteResponse,
  ProductMediaUploadResponse,
} from '../models/product-media.model';

@Injectable({ providedIn: 'root' })
export class ProductMediaService {
  private readonly basePath = 'products';

  constructor(private readonly http: HttpClient) {}

  uploadImage(
    productId: number,
    file: File,
  ): Observable<HttpResponse<ProductMediaUploadResponse>> {
    const formData = new FormData();
    formData.append('image', file);

    return this.http.post<ProductMediaUploadResponse>(
      `${BASE_URL}/${this.basePath}/${productId}/media`,
      formData,
      { observe: 'response' },
    );
  }

  deleteImage(
    productId: number,
    mediaId: number,
  ): Observable<HttpResponse<ProductMediaDeleteResponse>> {
    return this.http.delete<ProductMediaDeleteResponse>(
      `${BASE_URL}/${this.basePath}/${productId}/media/${mediaId}`,
      { observe: 'response' },
    );
  }

  /** Imagen autenticada vía Laravel (el uploader exige X-API-KEY). */
  getPreviewBlob(productId: number, mediaId: number): Observable<Blob> {
    return this.http.get(
      `${BASE_URL}/${this.basePath}/${productId}/media/${mediaId}/preview`,
      { responseType: 'blob' },
    );
  }
}
