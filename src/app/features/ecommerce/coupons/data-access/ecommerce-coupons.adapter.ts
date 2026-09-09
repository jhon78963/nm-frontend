import {
  CouponDiscountType,
  EcommerceCoupon,
  EcommerceCouponsResponse,
} from '../models/ecommerce-coupon.model';

const DISCOUNT_TYPES: CouponDiscountType[] = ['percentage', 'fixed'];

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

function readDiscountType(value: unknown): CouponDiscountType {
  const type = readString(value, 'percentage') as CouponDiscountType;
  return DISCOUNT_TYPES.includes(type) ? type : 'percentage';
}

export function adaptEcommerceCoupon(raw: unknown): EcommerceCoupon {
  const data = (raw ?? {}) as Record<string, unknown>;

  return {
    id: readString(data['id']),
    code: readString(data['code']),
    description: readOptionalString(data['description']),
    discountType: readDiscountType(data['discountType']),
    discountValue: readNumber(data['discountValue']),
    minSubtotal: readNumber(data['minSubtotal']),
    maxDiscount: readOptionalNumber(data['maxDiscount']),
    usageLimit: readOptionalNumber(data['usageLimit']),
    usageCount: readNumber(data['usageCount']),
    perCustomerLimit: readNumber(data['perCustomerLimit'], 1),
    perIpLimit: readNumber(data['perIpLimit'], 1),
    isWelcome: data['isWelcome'] === true,
    isActive: data['isActive'] !== false,
    startsAt: readOptionalString(data['startsAt']),
    expiresAt: readOptionalString(data['expiresAt']),
    warehouseId: readOptionalString(data['warehouseId']),
  };
}

export function adaptEcommerceCouponsResponse(raw: unknown): EcommerceCouponsResponse {
  const data = (raw ?? {}) as Record<string, unknown>;
  const coupons = Array.isArray(data['coupons']) ? data['coupons'].map(adaptEcommerceCoupon) : [];

  return { coupons };
}

export function adaptEcommerceCouponResponse(raw: unknown): { coupon: EcommerceCoupon } {
  const data = (raw ?? {}) as Record<string, unknown>;
  const coupon = data['coupon'];

  return {
    coupon: adaptEcommerceCoupon(coupon ?? data),
  };
}
