export interface Warehouse {
  id: string;
  name: string;
  tenantId: string | null;
  baseCash?: number;
  electronicInvoicingEnabled?: boolean;
  tenantElectronicInvoicingEnabled?: boolean;
}

export interface WarehouseListResponse {
  data: Warehouse[];
  paginate: { total: number; pages: number };
}

export interface WarehousePayload {
  name: string;
  tenantId: string;
  baseCash?: number;
  electronicInvoicingEnabled?: boolean;
}

export interface WarehouseFormModel {
  name: string;
  tenantId: string | null;
  baseCash: number | null;
  electronicInvoicingEnabled: boolean;
}

export interface TenantLookupOption {
  id: string;
  name: string;
  electronicInvoicingEnabled?: boolean;
}
