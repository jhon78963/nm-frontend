import { ADMIN_ROUTE_ROLES } from '../guards/role.guard';
import { User } from '../interfaces/user.interface';

export type StoredUserWithWarehouse = User & { warehouse_id?: number | null };

export function readStoredUser(): StoredUserWithWarehouse | undefined {
  const raw = localStorage.getItem('user');
  if (!raw) {
    return undefined;
  }
  try {
    return JSON.parse(raw) as StoredUserWithWarehouse;
  } catch {
    return undefined;
  }
}

/** Admin / Super Admin pueden operar sin almacén en el perfil (el backend aplica fallback). */
export function userBypassesWarehouseRequirement(
  user: StoredUserWithWarehouse,
): boolean {
  const roleNames = new Set<string>();
  if (user.role) {
    roleNames.add(user.role);
  }
  for (const r of user.roles ?? []) {
    roleNames.add(r);
  }

  return [...roleNames].some(name =>
    (ADMIN_ROUTE_ROLES as readonly string[]).includes(name),
  );
}

export function isWarehouseMissing(user: StoredUserWithWarehouse): boolean {
  const warehouseId = user.warehouseId ?? user.warehouse_id;
  return warehouseId == null || warehouseId === 0;
}

export function userRequiresWarehouseAssignment(
  user: StoredUserWithWarehouse | undefined,
): boolean {
  if (!user) {
    return false;
  }
  return !userBypassesWarehouseRequirement(user) && isWarehouseMissing(user);
}
