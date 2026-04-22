export interface ActionLogUser {
  id: number;
  name: string;
  email: string;
}

export interface UserActionLog {
  id: number;
  creationTime: string;
  action: string;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
  warehouseId?: number | null;
  userName?: string;
  user?: ActionLogUser;
}

export interface Paginate {
  total: number;
  pages: number;
}

export interface ActionLogListResponse {
  data: UserActionLog[];
  paginate: Paginate;
}
