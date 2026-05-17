export interface KardexReportParams {
  warehouseId: number;
  productId: number;
  productSizeId: number;
  colorId: number | null;
  fechaInicio: string;
  fechaFin: string;
}

export interface KardexReference {
  morph_short?: string | null;
  code?: string | null;
}

export interface KardexMovementRow {
  id: number;
  occurred_at: string;
  direction: 'IN' | 'OUT';
  movement_type_label: string;
  quantity: number;
  balance_after_movement: number;
  reference: KardexReference | null;
}

export interface KardexMeta {
  opening_balance_quantity: number;
  closing_balance_quantity: number;
  product_name?: string;
  warehouse_name?: string;
  [key: string]: unknown;
}

export interface KardexReportResponse {
  success: boolean;
  data: {
    meta: KardexMeta;
    movements: KardexMovementRow[];
  };
}
