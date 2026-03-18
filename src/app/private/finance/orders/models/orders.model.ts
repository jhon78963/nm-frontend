export interface OrderItem {
  id: number;
  productSizeId: number;
  productId: number;
  sizeId: number;
  colorId?: number | null;
  quantity: number;
  barcode: string;
  purchasePrice: number;
  salePrice: number;
  minSalePrice: number;
  unitPrice: number;
  total: number;
}

export interface IOrder {
  id: number;
  date: string;
  code?: string;
  total: number;
  originWarehouseId?: number | null;
  destinationWarehouseId: number;
  trackingNumber?: string | null;
  type:
    | 'TRIP_PURCHASE'
    | 'ONLINE_PURCHASE'
    | 'WAREHOUSE_TRANSFER'
    | 'WAREHOUSE_IN';
  status: 'COMPLETED' | 'CANCELED' | 'PENDING';
  notes?: string;
  items?: OrderItem[];
}

export class Order {
  id: number;
  date: string;
  code?: string;
  total: number;
  originWarehouseId?: number | null;
  destinationWarehouseId: number;
  trackingNumber?: string | null;
  type:
    | 'TRIP_PURCHASE'
    | 'ONLINE_PURCHASE'
    | 'WAREHOUSE_TRANSFER'
    | 'WAREHOUSE_IN';
  status: 'COMPLETED' | 'CANCELED' | 'PENDING';
  notes?: string;
  items?: OrderItem[];

  constructor(order: IOrder) {
    this.id = order.id;
    this.date = order.date;
    this.code = order.code;
    this.total = order.total;
    this.originWarehouseId = order.originWarehouseId;
    this.destinationWarehouseId = order.destinationWarehouseId;
    this.trackingNumber = order.trackingNumber;
    this.type = order.type;
    this.status = order.status;
    this.notes = order.notes;
    this.items = order.items;
  }
}

export interface Paginate {
  total: number;
  pages: number;
}

export interface OrderListResponse {
  data: Order[];
  paginate: Paginate;
}
