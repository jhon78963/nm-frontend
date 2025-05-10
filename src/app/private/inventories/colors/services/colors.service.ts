import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../services/api.service';
import { ColorSave } from '../models/colors.model';

@Injectable({
  providedIn: 'root',
})
export class ColorsService {
  constructor(private apiService: ApiService) {}

  create(data: ColorSave): Observable<void> {
    return this.apiService.post('colors', data);
  }

  edit(id: number, data: ColorSave): Observable<void> {
    return this.apiService.patch(`colors/${id}`, data);
  }
}
