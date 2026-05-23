import { Injectable, signal } from '@angular/core';

export const ACTIVE_WAREHOUSE_STORAGE_KEY = 'active_warehouse_id';

@Injectable({ providedIn: 'root' })
export class ActiveWarehouseService {
  readonly activeWarehouseId = signal<number | null>(this.readFromStorage());

  getActiveWarehouseId(): number | null {
    return this.activeWarehouseId();
  }

  setActiveWarehouseId(id: number | null): void {
    this.activeWarehouseId.set(id);

    if (id != null && id > 0) {
      localStorage.setItem(ACTIVE_WAREHOUSE_STORAGE_KEY, String(id));
      return;
    }

    localStorage.removeItem(ACTIVE_WAREHOUSE_STORAGE_KEY);
  }

  private readFromStorage(): number | null {
    const raw = localStorage.getItem(ACTIVE_WAREHOUSE_STORAGE_KEY);
    if (raw == null || raw.trim() === '') {
      return null;
    }

    const id = Number(raw);
    return Number.isFinite(id) && id > 0 ? id : null;
  }
}
