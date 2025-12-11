export interface Paginate {
  total: number;
  pages: number;
}

export interface Warehouse {
  id: number;
  name: string;
}

export interface WarehouseListResponse {
  data: Warehouse[];
  paginate: Paginate;
}
