import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../services/api.service';
import { Customer } from '../models/customer.model';

@Injectable({
  providedIn: 'root',
})
export class CustomersService {
  // customer: Customer | null = { id: 0, dni: '', name: '', surname: '' };
  // customer$: BehaviorSubject<Customer | null> =
  //   new BehaviorSubject<Customer | null>(this.customer);

  constructor(private apiService: ApiService) {}

  getByDni(dni: string): Observable<Customer> {
    return this.apiService.get<Customer>(`consultation-dni/${dni}`);
  }

  // getByDni(dni: string): Observable<void> {
  //   return this.apiService.get<Customer>(`consultation-dni/${dni}`).pipe(
  //     debounceTime(600),
  //     map((customer: Customer) => {
  //       this.updateCustomer(customer);
  //     }),
  //   );
  // }

  // getObject(): Observable<Customer | null> {
  //   return this.customer$.asObservable();
  // }

  // updateCustomer(customer: Customer | null): void {
  //   this.customer = customer;
  //   this.customer$.next(this.customer);
  // }
}
