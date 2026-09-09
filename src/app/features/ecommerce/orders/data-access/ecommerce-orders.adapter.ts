import {
  EcommerceOrder,
  EcommerceOrderAddress,
  EcommerceOrderItem,
  EcommerceOrderStatus,
  EcommerceOrdersListResponse,
} from '../models/ecommerce-order.model';

const ORDER_STATUSES: EcommerceOrderStatus[] = [
  'pending',
  'processing',
  'shipped',
  'out-for-delivery',
  'delivered',
  'cancelled',
];

function readString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function readOptionalString(value: unknown): string | null {
  if (value == null) return null;
  const str = String(value).trim();
  return str || null;
}

function readNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function readOrderStatus(value: unknown): EcommerceOrderStatus {
  const status = readString(value, 'pending') as EcommerceOrderStatus;
  return ORDER_STATUSES.includes(status) ? status : 'pending';
}

function readPaymentStatus(value: unknown): 'pending' | 'paid' {
  return readString(value) === 'paid' ? 'paid' : 'pending';
}

function adaptListMeta(raw: unknown, fallbackCount = 0) {
  const meta = (raw ?? {}) as Record<string, unknown>;
  const total = readNumber(meta['total'], fallbackCount);
  const perPage = readNumber(meta['perPage'], 15);

  return {
    total,
    page: readNumber(meta['page'], 1),
    perPage,
    totalPages: readNumber(meta['totalPages'], Math.max(1, Math.ceil(total / perPage))),
  };
}

function adaptOrderAddress(raw: unknown): EcommerceOrderAddress {
  const data = (raw ?? {}) as Record<string, unknown>;

  return {
    firstName: readString(data['firstName']),
    lastName: readString(data['lastName']),
    country: readString(data['country'], 'PE'),
    address1: readString(data['address1']),
    address2: readOptionalString(data['address2']) ?? undefined,
    city: readString(data['city']),
    state: readString(data['state']),
    postcode: readString(data['postcode']),
    phone: readOptionalString(data['phone']) ?? undefined,
  };
}

function adaptOrderItem(raw: unknown): EcommerceOrderItem {
  const item = (raw ?? {}) as Record<string, unknown>;

  return {
    id: readString(item['id']),
    productId: readString(item['productId']),
    productSizeId: readString(item['productSizeId']),
    colorId: readOptionalString(item['colorId']),
    name: readString(item['name']),
    variation: readOptionalString(item['variation']),
    imageUrl: readOptionalString(item['imageUrl']),
    quantity: readNumber(item['quantity'], 1),
    unitPrice: readNumber(item['unitPrice']),
    subtotal: readNumber(item['subtotal']),
  };
}

export function adaptEcommerceOrder(raw: unknown): EcommerceOrder {
  const data = (raw ?? {}) as Record<string, unknown>;
  const items = Array.isArray(data['items']) ? data['items'].map(adaptOrderItem) : [];

  return {
    id: readString(data['id']),
    orderNumber: readString(data['orderNumber']),
    warehouseId: readOptionalString(data['warehouseId']) ?? undefined,
    status: readOrderStatus(data['status']),
    statusLabel: readOptionalString(data['statusLabel']) ?? undefined,
    paymentStatus: readPaymentStatus(data['paymentStatus']),
    createdAt: readString(data['createdAt']),
    updatedAt: readOptionalString(data['updatedAt']) ?? undefined,
    cancelledAt: readOptionalString(data['cancelledAt']),
    email: readString(data['email']),
    billing: adaptOrderAddress(data['billing']),
    shipping: adaptOrderAddress(data['shipping']),
    orderNotes: readOptionalString(data['orderNotes']),
    shippingMethodTitle: readString(data['shippingMethodTitle']),
    shippingTotal: readNumber(data['shippingTotal']),
    paymentMethodTitle: readString(data['paymentMethodTitle']),
    subtotal: readNumber(data['subtotal']),
    couponCode: readOptionalString(data['couponCode']),
    couponDiscount: readNumber(data['couponDiscount']),
    total: readNumber(data['total']),
    items,
  };
}

export function adaptEcommerceOrdersListResponse(raw: unknown): EcommerceOrdersListResponse {
  const data = (raw ?? {}) as Record<string, unknown>;
  const orders = Array.isArray(data['orders']) ? data['orders'].map(adaptEcommerceOrder) : [];

  return {
    orders,
    meta: adaptListMeta(data['meta'], orders.length),
  };
}
