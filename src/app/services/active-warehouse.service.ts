import { Injectable, signal } from '@angular/core';
import { ADMIN_ROUTE_ROLES } from '../auth/guards/role.guard';
import { User } from '../auth/interfaces/user.interface';

export const ACTIVE_WAREHOUSE_STORAGE_KEY = 'active_warehouse_id';

@Injectable({ providedIn: 'root' })
export class ActiveWarehouseService {
  /**
   * In-memory signal seeded authoritatively from auth/me, not from localStorage.
   * localStorage is only consulted for admin warehouse-switcher selections.
   */
  readonly activeWarehouseId = signal<number | null>(null);

  getActiveWarehouseId(): number | null {
    return this.activeWarehouseId();
  }

  /**
   * Called immediately after a successful auth/me response.
   * - Regular users: always use the server-provided warehouseId; any localStorage
   *   value is discarded to prevent spoofing via DevTools.
   * - Admin / Super Admin: may keep a previously-switched warehouse stored in
   *   localStorage (the warehouse switcher writes there); falls back to the
   *   server value if nothing is stored.
   */
  syncFromAuthUser(user: User): void {
    const serverWarehouseId: number | null =
      typeof user.warehouseId === 'number' && user.warehouseId > 0
        ? user.warehouseId
        : null;

    if (this.userIsAdmin(user)) {
      const storedId = this.readFromStorage();
      const effective = storedId ?? serverWarehouseId;
      this.activeWarehouseId.set(effective);
      this.persistToStorage(effective);
    } else {
      localStorage.removeItem(ACTIVE_WAREHOUSE_STORAGE_KEY);
      this.activeWarehouseId.set(serverWarehouseId);
    }
  }

  /**
   * Explicitly selects a warehouse (Super Admin warehouse switcher).
   * The caller must ensure the backend has confirmed the warehouse is accessible
   * before calling this method (e.g. by checking the 200 response of the
   * warehouses endpoint).
   */
  setActiveWarehouseId(id: number | null): void {
    this.activeWarehouseId.set(id);
    this.persistToStorage(id);
  }

  /** Called on logout to reset state. */
  clearWarehouse(): void {
    this.activeWarehouseId.set(null);
    localStorage.removeItem(ACTIVE_WAREHOUSE_STORAGE_KEY);
  }

  private userIsAdmin(user: User): boolean {
    const roles = new Set<string>();
    if (user.role) {
      roles.add(user.role);
    }
    for (const r of user.roles ?? []) {
      roles.add(r);
    }
    return [...roles].some(r =>
      (ADMIN_ROUTE_ROLES as readonly string[]).includes(r),
    );
  }

  private readFromStorage(): number | null {
    const raw = localStorage.getItem(ACTIVE_WAREHOUSE_STORAGE_KEY);
    if (raw == null || raw.trim() === '') {
      return null;
    }
    const id = Number(raw);
    return Number.isFinite(id) && id > 0 ? id : null;
  }

  private persistToStorage(id: number | null): void {
    if (id != null && id > 0) {
      localStorage.setItem(ACTIVE_WAREHOUSE_STORAGE_KEY, String(id));
    } else {
      localStorage.removeItem(ACTIVE_WAREHOUSE_STORAGE_KEY);
    }
  }
}
