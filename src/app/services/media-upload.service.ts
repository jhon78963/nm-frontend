import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

/**
 * Cliente del microservicio Node.js de archivos.
 * Contrato alineado con NodeUploaderService (Laravel): POST /api/upload, campo `files`, header X-API-KEY.
 */
@Injectable({ providedIn: 'root' })
export class MediaUploadService {
  private readonly http = inject(HttpClient);

  private uploadUrl(): string {
    return `${environment.baseUploadUrl.replace(/\/$/, '')}/api/upload`;
  }

  /**
   * Sube un archivo al uploader externo.
   * Respuesta esperada (ej.): { files: [{ url: 'ruta/relativa.ext' }] }
   */
  uploadFile(file: File, context = 'products'): Observable<any> {
    const formData = new FormData();
    formData.append('files', file, file.name);
    formData.append('context', context);

    let headers = new HttpHeaders();
    const apiKey = (environment as { uploadApiKey?: string }).uploadApiKey;
    if (apiKey) {
      headers = headers.set('X-API-KEY', apiKey);
    }

    return this.http.post(this.uploadUrl(), formData, { headers });
  }
}
