export interface Tenant {
  id: number;
  name: string;
  isActive?: boolean;
}

export interface Paginate {
  total: number;
  pages: number;
}

export interface TenantListResponse {
  data: Tenant[];
  paginate: Paginate;
}
