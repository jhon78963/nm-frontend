export interface User {
  id: number;
  username: string;
  email: string;
  name: string;
  surname: string;
  password: string;
  role: string;
  roles?: string[];
  tenantId?: number | null;
  warehouseId?: number | null;
}
