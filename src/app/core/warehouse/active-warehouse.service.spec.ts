import { beforeEach, describe, expect, it } from 'vitest';
import { ACTIVE_WAREHOUSE_STORAGE_KEY, ActiveWarehouseService } from './active-warehouse.service';
import { AuthUser } from '../../features/auth/models/auth.model';

const storage = new Map<string, string>();

beforeEach(() => {
  storage.clear();
  globalThis.localStorage = {
    get length() {
      return storage.size;
    },
    clear: () => storage.clear(),
    getItem: (key: string) => storage.get(key) ?? null,
    key: (index: number) => [...storage.keys()][index] ?? null,
    removeItem: (key: string) => {
      storage.delete(key);
    },
    setItem: (key: string, value: string) => {
      storage.set(key, value);
    },
  };
});

const WAREHOUSE_SERVER = 'a1111111-1111-4111-8111-111111111111';
const WAREHOUSE_SPOOF = '99999999-9999-4999-8999-999999999999';
const WAREHOUSE_STORED = 'b2222222-2222-4222-8222-222222222222';
const WAREHOUSE_ADMIN_SERVER = 'c3333333-3333-4333-8333-333333333333';
const WAREHOUSE_SET = 'd4444444-4444-4444-8444-444444444444';

function vendedora(warehouseId = WAREHOUSE_SERVER): AuthUser {
  return {
    id: 'f5555555-5555-4555-8555-555555555555',
    username: 'vendedora',
    email: 'v@test.com',
    name: 'María',
    surname: 'V',
    role: 'Vendedora',
    roles: ['Vendedora'],
    warehouseId,
  };
}

function superAdmin(warehouseId = WAREHOUSE_ADMIN_SERVER): AuthUser {
  return {
    id: 'e6666666-6666-4666-8666-666666666666',
    username: 'superadmin',
    email: 'a@test.com',
    name: 'Admin',
    surname: 'A',
    role: 'Super Admin',
    roles: ['Super Admin'],
    warehouseId,
  };
}

describe('ActiveWarehouseService', () => {
  it('sincroniza warehouse del servidor para usuario regular y borra spoof localStorage', () => {
    localStorage.setItem(ACTIVE_WAREHOUSE_STORAGE_KEY, WAREHOUSE_SPOOF);
    const service = new ActiveWarehouseService();

    service.syncFromAuthUser(vendedora('e7777777-7777-4777-8777-777777777777'));

    expect(service.getActiveWarehouseId()).toBe('e7777777-7777-4777-8777-777777777777');
    expect(localStorage.getItem(ACTIVE_WAREHOUSE_STORAGE_KEY)).toBeNull();
  });

  it('permite warehouse persistido para admin', () => {
    localStorage.setItem(ACTIVE_WAREHOUSE_STORAGE_KEY, WAREHOUSE_STORED);
    const service = new ActiveWarehouseService();

    service.syncFromAuthUser(superAdmin());

    expect(service.getActiveWarehouseId()).toBe(WAREHOUSE_STORED);
    expect(localStorage.getItem(ACTIVE_WAREHOUSE_STORAGE_KEY)).toBe(WAREHOUSE_STORED);
  });

  it('clearWarehouse resetea signal y storage', () => {
    const service = new ActiveWarehouseService();
    service.setActiveWarehouseId(WAREHOUSE_SET);
    service.clearWarehouse();

    expect(service.getActiveWarehouseId()).toBeNull();
    expect(localStorage.getItem(ACTIVE_WAREHOUSE_STORAGE_KEY)).toBeNull();
  });
});
