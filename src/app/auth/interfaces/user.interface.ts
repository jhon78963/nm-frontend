export interface User {
  id: number;
  username: string;
  email: string;
  name: string;
  surname: string;
  password: string;
  profilePicture?: string | null;
  role: string;
  roles?: string[];
  tenantId: number;
  warehouseId?: number | null;
  /** Flat permission strings returned by /auth/me (e.g. 'sales.delete') */
  permissions: string[];
  /** Active commercial feature flags returned by /auth/me (e.g. 'electronic_billing') */
  features: string[];
}
