import {
  EcommerceReview,
  EcommerceReviewStatus,
  EcommerceReviewsListResponse,
} from '../models/ecommerce-review.model';

const REVIEW_STATUSES: EcommerceReviewStatus[] = ['pending', 'approved', 'rejected'];

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

function readReviewStatus(value: unknown): EcommerceReviewStatus {
  const status = readString(value, 'pending') as EcommerceReviewStatus;
  return REVIEW_STATUSES.includes(status) ? status : 'pending';
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

export function adaptEcommerceReview(raw: unknown): EcommerceReview {
  const data = (raw ?? {}) as Record<string, unknown>;

  return {
    id: readString(data['id']),
    productId: readString(data['productId']),
    productName: readString(data['productName']),
    customerId: readString(data['customerId']),
    customerName: readString(data['customerName']),
    customerEmail: readString(data['customerEmail']),
    orderNumber: readString(data['orderNumber']),
    rating: readNumber(data['rating'], 5),
    description: readString(data['description']),
    status: readReviewStatus(data['status']),
    rejectionReason: readOptionalString(data['rejectionReason']),
    createdAt: readString(data['createdAt']),
    moderatedAt: readOptionalString(data['moderatedAt']),
  };
}

export function adaptEcommerceReviewsListResponse(raw: unknown): EcommerceReviewsListResponse {
  const data = (raw ?? {}) as Record<string, unknown>;
  const reviews = Array.isArray(data['reviews']) ? data['reviews'].map(adaptEcommerceReview) : [];

  return {
    reviews,
    meta: adaptListMeta(data['meta'], reviews.length),
  };
}
