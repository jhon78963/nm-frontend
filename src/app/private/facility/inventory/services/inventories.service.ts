import { Injectable } from '@angular/core';
import { BehaviorSubject, debounceTime, map, Observable } from 'rxjs';
import { ApiService } from '../../../../services/api.service';
import { Inventory, InventoryListResponse } from '../models/inventory.model';

@Injectable({
  providedIn: 'root',
})
export class InventoriesService {
  inventories: Inventory[] = [];
  inventories$: BehaviorSubject<Inventory[]> = new BehaviorSubject<Inventory[]>(
    this.inventories,
  );

  total: number = 0;
  total$: BehaviorSubject<number> = new BehaviorSubject<number>(this.total);

  constructor(private apiService: ApiService) {}

  callGetList(
    limit: number = 10,
    page: number = 1,
    description: string = '',
  ): Observable<void> {
    let url = `inventories?limit=${limit}&page=${page}`;
    if (description) {
      url += `&search=${description}`;
    }
    return this.apiService.get<InventoryListResponse>(url).pipe(
      debounceTime(600),
      map((response: InventoryListResponse) => {
        this.updateInventories(response.data);
        this.updateTotalInventories(response.paginate.total);
      }),
    );
  }

  create(body: Inventory): Observable<void> {
    return this.apiService.post(`inventories`, body);
  }

  delete(id: number): Observable<void> {
    return this.apiService.delete(`inventories/${id}`);
  }

  get(id: number): Observable<Inventory> {
    return this.apiService.get(`inventories/${id}`);
  }

  getList(): Observable<Inventory[]> {
    return this.inventories$.asObservable();
  }

  getTotal(): Observable<number> {
    return this.total$.asObservable();
  }

  update(id: number, body: Inventory): Observable<void> {
    return this.apiService.patch(`inventories/${id}`, body);
  }

  private updateInventories(inventories: Inventory[]): void {
    this.inventories = inventories;
    this.inventories$.next(this.inventories);
  }

  private updateTotalInventories(total: number): void {
    this.total = total;
    this.total$.next(this.total);
  }
}
