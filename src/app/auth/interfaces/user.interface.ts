export interface User {
  id: number;
  username: string;
  email: string;
  name: string;
  surname: string;
  password: string;
  role: string;
  roles?: string[];
  /** Nombres Spatie devueltos por auth/me (ej. pos.checkout, sale.getAll). */
  permissions?: string[];
  tenantId?: number | null;
  warehouseId?: number | null;
}
