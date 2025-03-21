import { Injectable } from '@angular/core';
import { ApiService } from '../../../services/api.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PaymentTypesService {
  constructor(private apiService: ApiService) {}

  getAll(): Observable<any[]> {
    return this.apiService.get('payment-types');
  }
}
