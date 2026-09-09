import {
  EcommerceCustomerAddress,
  EcommerceCustomerDetail,
  EcommerceCustomerListItem,
  EcommerceCustomerNotification,
  EcommerceCustomerNotificationSettings,
  EcommerceCustomerOrderSummary,
  EcommerceCustomerOrdersResponse,
  EcommerceCustomerRefund,
  EcommerceCustomerReview,
  EcommerceCustomersListResponse,
  EcommerceRefundStatus,
} from '../models/ecommerce-customer.model';

const REFUND_STATUSES: EcommerceRefundStatus[] = ['pending', 'approved', 'rejected', 'completed'];

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

function readOptionalNumber(value: unknown): number | null {
  if (value == null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function readRefundStatus(value: unknown): EcommerceRefundStatus {
  const status = readString(value, 'pending') as EcommerceRefundStatus;
  return REFUND_STATUSES.includes(status) ? status : 'pending';
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

function adaptCustomerRecord(raw: unknown): EcommerceCustomerDetail['customer'] {
  const data = (raw ?? {}) as Record<string, unknown>;

  return {
    id: readString(data['id']),
    email: readString(data['email']),
    name: readString(data['name']),
    isEnabled: data['isEnabled'] !== false,
    userId: readOptionalString(data['userId']),
    userPhone: readOptionalString(data['userPhone']),
    userIsEnabled: typeof data['userIsEnabled'] === 'boolean' ? data['userIsEnabled'] : null,
    username: readOptionalString(data['username']),
    createdAt: readString(data['createdAt']),
    updatedAt: readString(data['updatedAt']),
  };
}

export function adaptEcommerceCustomerListItem(raw: unknown): EcommerceCustomerListItem {
  const data = (raw ?? {}) as Record<string, unknown>;

  return {
    id: readString(data['id']),
    email: readString(data['email']),
    name: readString(data['name']),
    isEnabled: data['isEnabled'] !== false,
    userId: readOptionalString(data['userId']),
    createdAt: readString(data['createdAt']),
    updatedAt: readString(data['updatedAt']),
    orderCount: readNumber(data['orderCount']),
    refundCount: readNumber(data['refundCount']),
    reviewCount: readNumber(data['reviewCount']),
    totalSpent: readNumber(data['totalSpent']),
  };
}

export function adaptEcommerceCustomersListResponse(raw: unknown): EcommerceCustomersListResponse {
  const data = (raw ?? {}) as Record<string, unknown>;
  const customers = Array.isArray(data['customers'])
    ? data['customers'].map(adaptEcommerceCustomerListItem)
    : [];

  return {
    customers,
    meta: adaptListMeta(data['meta'], customers.length),
  };
}

function adaptCustomerAddress(raw: unknown): EcommerceCustomerAddress {
  const data = (raw ?? {}) as Record<string, unknown>;

  return {
    id: readString(data['id']),
    label: readString(data['label']),
    firstName: readString(data['firstName']),
    lastName: readString(data['lastName']),
    country: readString(data['country'], 'PE'),
    address1: readString(data['address1']),
    address2: readOptionalString(data['address2']),
    city: readString(data['city']),
    state: readString(data['state']),
    postcode: readString(data['postcode']),
    phone: readOptionalString(data['phone']),
    isDefault: data['isDefault'] === true,
    createdAt: readString(data['createdAt']),
    updatedAt: readString(data['updatedAt']),
  };
}

function adaptNotificationSettings(raw: unknown): EcommerceCustomerNotificationSettings {
  const data = (raw ?? {}) as Record<string, unknown>;

  return {
    orderUpdates: data['orderUpdates'] !== false,
    promotions: data['promotions'] !== false,
    newsletter: data['newsletter'] !== false,
  };
}

export function adaptEcommerceCustomerDetail(raw: unknown): EcommerceCustomerDetail {
  const data = (raw ?? {}) as Record<string, unknown>;
  const stats = (data['stats'] ?? {}) as Record<string, unknown>;
  const addresses = Array.isArray(data['addresses']) ? data['addresses'].map(adaptCustomerAddress) : [];

  return {
    customer: adaptCustomerRecord(data['customer'] ?? data),
    stats: {
      orderCount: readNumber(stats['orderCount']),
      refundCount: readNumber(stats['refundCount']),
      reviewCount: readNumber(stats['reviewCount']),
      totalSpent: readNumber(stats['totalSpent']),
      guestOrderCount: readNumber(stats['guestOrderCount']),
    },
    addresses,
    notificationSettings: adaptNotificationSettings(data['notificationSettings']),
  };
}

export function adaptEcommerceCustomerUpdateResponse(raw: unknown): {
  customer: EcommerceCustomerDetail['customer'];
} {
  const data = (raw ?? {}) as Record<string, unknown>;

  return {
    customer: adaptCustomerRecord(data['customer'] ?? data),
  };
}

export function adaptEcommerceCustomerOrderSummary(raw: unknown): EcommerceCustomerOrderSummary {
  const data = (raw ?? {}) as Record<string, unknown>;

  return {
    id: readString(data['id']),
    orderNumber: readString(data['orderNumber']),
    status: readString(data['status']),
    statusLabel: readString(data['statusLabel']),
    paymentStatus: readPaymentStatus(data['paymentStatus']),
    email: readString(data['email']),
    customerId: readOptionalString(data['customerId']),
    isGuestOrder: data['isGuestOrder'] === true,
    customerName: readString(data['customerName']),
    total: readNumber(data['total']),
    itemCount: readNumber(data['itemCount']),
    createdAt: readString(data['createdAt']),
  };
}

export function adaptEcommerceCustomerOrdersResponse(raw: unknown): EcommerceCustomerOrdersResponse {
  const data = (raw ?? {}) as Record<string, unknown>;
  const orders = Array.isArray(data['orders'])
    ? data['orders'].map(adaptEcommerceCustomerOrderSummary)
    : [];

  return {
    orders,
    meta: adaptListMeta(data['meta'], orders.length),
  };
}

function adaptRefundOrder(raw: unknown): EcommerceCustomerRefund['order'] {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const data = raw as Record<string, unknown>;

  return {
    id: readString(data['id']),
    orderNumber: readString(data['orderNumber']),
    total: readNumber(data['total']),
    status: readString(data['status']),
    paymentStatus: readString(data['paymentStatus']),
  };
}

export function adaptEcommerceCustomerRefund(raw: unknown): EcommerceCustomerRefund {
  const data = (raw ?? {}) as Record<string, unknown>;

  return {
    id: readString(data['id']),
    status: readRefundStatus(data['status']),
    reason: readString(data['reason']),
    amount: readOptionalNumber(data['amount']),
    adminNotes: readOptionalString(data['adminNotes']),
    createdAt: readString(data['createdAt']),
    updatedAt: readString(data['updatedAt']),
    order: adaptRefundOrder(data['order']),
  };
}

export function adaptEcommerceCustomerRefundsResponse(raw: unknown): {
  refunds: EcommerceCustomerRefund[];
} {
  const data = (raw ?? {}) as Record<string, unknown>;
  const refunds = Array.isArray(data['refunds']) ? data['refunds'].map(adaptEcommerceCustomerRefund) : [];

  return { refunds };
}

export function adaptEcommerceCustomerReview(raw: unknown): EcommerceCustomerReview {
  const data = (raw ?? {}) as Record<string, unknown>;

  return {
    id: readString(data['id']),
    productId: readString(data['productId']),
    productName: readString(data['productName']),
    orderNumber: readString(data['orderNumber']),
    rating: readNumber(data['rating'], 5),
    description: readString(data['description']),
    status: readString(data['status']),
    rejectionReason: readOptionalString(data['rejectionReason']),
    createdAt: readString(data['createdAt']),
    updatedAt: readString(data['updatedAt']),
  };
}

export function adaptEcommerceCustomerReviewsResponse(raw: unknown): {
  reviews: EcommerceCustomerReview[];
} {
  const data = (raw ?? {}) as Record<string, unknown>;
  const reviews = Array.isArray(data['reviews']) ? data['reviews'].map(adaptEcommerceCustomerReview) : [];

  return { reviews };
}

export function adaptEcommerceCustomerNotification(raw: unknown): EcommerceCustomerNotification {
  const data = (raw ?? {}) as Record<string, unknown>;

  return {
    id: readString(data['id']),
    type: readString(data['type']),
    title: readString(data['title']),
    message: readString(data['message']),
    readAt: readOptionalString(data['readAt']),
    createdAt: readString(data['createdAt']),
  };
}

export function adaptEcommerceCustomerNotificationsResponse(raw: unknown): {
  notifications: EcommerceCustomerNotification[];
} {
  const data = (raw ?? {}) as Record<string, unknown>;
  const notifications = Array.isArray(data['notifications'])
    ? data['notifications'].map(adaptEcommerceCustomerNotification)
    : [];

  return { notifications };
}

export function adaptEcommerceCustomerRefundUpdateResponse(raw: unknown): {
  refund: EcommerceCustomerRefund;
} {
  const data = (raw ?? {}) as Record<string, unknown>;

  return {
    refund: adaptEcommerceCustomerRefund(data['refund'] ?? data),
  };
}
