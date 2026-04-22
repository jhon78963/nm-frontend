export interface WarehouseRow {
  id: number;
  name: string;
  tenantId?: number | null;
}

export interface Paginate {
  total: number;
  pages: number;
}

export interface WarehouseListResponse {
  data: WarehouseRow[];
  paginate: Paginate;
}
