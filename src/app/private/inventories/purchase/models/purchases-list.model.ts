export interface PurchaseRow {
  id: number;
  supplierName: string;
  vendorId: number | null;
  documentNote: string | null;
  registeredAt: string | null;
  warehouseId: number;
  warehouseName?: string;
  currency: string;
  status: string;
  totalSubtotal: number;
  creationTime: string | null;
  cancelledAt: string | null;
}

export interface PurchaseLineColorDeltaRow {
  id: number;
  colorId: number;
  colorDescription?: string;
  quantity: number;
}

export interface PurchaseLineRow {
  id: number;
  lineId: string | null;
  productId: number;
  productName?: string;
  sizeId: number;
  sizeDescription?: string;
  productSizeId: number;
  barcode: string | null;
  purchasePrice: number | null;
  salePrice: number | null;
  minSalePrice: number | null;
  subtotal: number;
  sizeStockDelta: number;
  hasColorBreakdown: boolean;
  colorDeltas?: PurchaseLineColorDeltaRow[];
}

export interface PurchaseDetail extends PurchaseRow {
  warehouseName?: string;
  cancellationReason: string | null;
  lines: PurchaseLineRow[];
  payloadSnapshot: unknown;
  linkedPayment?: PurchaseLinkedPayment | null;
}

export interface PurchaseLinkedPayment {
  cashMovementId: number;
  amount: number;
  paymentMethod: string;
  description: string;
  date: string | null;
  voucherPath: string | null;
  voucherPaths?: string[];
}

export interface PurchaseListResponse {
  data: PurchaseRow[];
  paginate: { total: number; pages: number };
}

export interface PurchaseRegisterBulkResponse {
  message: string;
  purchaseId: number;
}
