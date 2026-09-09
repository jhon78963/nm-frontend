import { describe, expect, it } from 'vitest';

import { adaptEcommerceCoupon, adaptEcommerceCouponsResponse } from '../coupons/data-access/ecommerce-coupons.adapter';
import { adaptEcommerceCustomerDetail, adaptEcommerceCustomersListResponse } from '../customers/data-access/ecommerce-customers.adapter';
import { adaptNewsletterSubscribersListResponse } from '../newsletter/data-access/ecommerce-newsletter.adapter';
import { adaptEcommerceOrder, adaptEcommerceOrdersListResponse } from '../orders/data-access/ecommerce-orders.adapter';
import { adaptEcommerceReview, adaptEcommerceReviewsListResponse } from '../reviews/data-access/ecommerce-reviews.adapter';

describe('ecommerce adapters', () => {
  it('adaptEcommerceOrder normaliza pedido transaccional', () => {
    const order = adaptEcommerceOrder({
      id: 'order-1',
      orderNumber: 'NM-1001',
      status: 'processing',
      paymentStatus: 'paid',
      createdAt: '2026-09-09T10:00:00.000Z',
      email: 'cliente@test.com',
      billing: { firstName: 'Ana', lastName: 'Perez', address1: 'Av. 1', city: 'Trujillo', state: 'La Libertad', postcode: '13001', country: 'PE' },
      shipping: { firstName: 'Ana', lastName: 'Perez', address1: 'Av. 1', city: 'Trujillo', state: 'La Libertad', postcode: '13001', country: 'PE' },
      shippingMethodTitle: 'Envío estándar',
      shippingTotal: 8,
      paymentMethodTitle: 'Transferencia',
      subtotal: 49.9,
      couponDiscount: 0,
      total: 57.9,
      items: [
        {
          id: 'item-1',
          productId: 'prod-1',
          productSizeId: 'size-1',
          name: 'Polo azul',
          quantity: 1,
          unitPrice: 49.9,
          subtotal: 49.9,
        },
      ],
    });

    expect(order.orderNumber).toBe('NM-1001');
    expect(order.paymentStatus).toBe('paid');
    expect(order.items).toHaveLength(1);
    expect(order.items[0]?.name).toBe('Polo azul');
  });

  it('adaptEcommerceOrdersListResponse normaliza meta paginada', () => {
    const response = adaptEcommerceOrdersListResponse({
      orders: [{ id: 'order-1', orderNumber: 'NM-1001', status: 'pending', paymentStatus: 'pending', createdAt: '2026-09-09', email: 'a@test.com', billing: {}, shipping: {}, shippingMethodTitle: 'Envío', shippingTotal: 0, paymentMethodTitle: 'BACS', subtotal: 10, couponDiscount: 0, total: 10, items: [] }],
      meta: { total: 1, page: 1, perPage: 15, totalPages: 1 },
    });

    expect(response.orders).toHaveLength(1);
    expect(response.meta.total).toBe(1);
  });

  it('adaptEcommerceReview normaliza reseña moderada', () => {
    const review = adaptEcommerceReview({
      id: 'rev-1',
      productId: 'prod-1',
      productName: 'Polo',
      customerId: 'cust-1',
      customerName: 'Cliente',
      customerEmail: 'cliente@test.com',
      orderNumber: 'NM-1001',
      rating: 5,
      description: 'Excelente',
      status: 'approved',
      createdAt: '2026-09-09T10:00:00.000Z',
    });

    expect(review.status).toBe('approved');
    expect(review.rating).toBe(5);
  });

  it('adaptEcommerceReviewsListResponse agrupa reseñas', () => {
    const response = adaptEcommerceReviewsListResponse({
      reviews: [{ id: 'rev-1', productId: 'prod-1', productName: 'Polo', customerId: 'cust-1', customerName: 'Cliente', customerEmail: 'a@test.com', orderNumber: 'NM-1', rating: 4, description: 'Bien', status: 'pending', createdAt: '2026-09-09' }],
      meta: { total: 1, page: 1, perPage: 15, totalPages: 1 },
    });

    expect(response.reviews).toHaveLength(1);
    expect(response.meta.total).toBe(1);
  });

  it('adaptEcommerceCustomersListResponse normaliza clientes ecommerce', () => {
    const response = adaptEcommerceCustomersListResponse({
      customers: [{ id: 'cust-1', email: 'cliente@test.com', name: 'Cliente', isEnabled: true, createdAt: '2026-09-09', updatedAt: '2026-09-09' }],
      meta: { total: 1, page: 1, perPage: 15, totalPages: 1 },
    });

    expect(response.customers).toHaveLength(1);
    expect(response.customers[0]?.email).toBe('cliente@test.com');
  });

  it('adaptEcommerceCustomerDetail normaliza detalle de cliente', () => {
    const response = adaptEcommerceCustomerDetail({
      customer: { id: 'cust-1', email: 'cliente@test.com', name: 'Cliente', isEnabled: true, createdAt: '2026-09-09', updatedAt: '2026-09-09' },
      addresses: [],
      notificationSettings: { emailEnabled: true, smsEnabled: false },
    });

    expect(response.customer.id).toBe('cust-1');
    expect(response.addresses).toEqual([]);
  });

  it('adaptEcommerceCouponsResponse normaliza cupones activos', () => {
    const response = adaptEcommerceCouponsResponse({
      coupons: [{ id: 'c-1', code: 'PROMO10', discountType: 'percentage', discountValue: 10, minSubtotal: 0, usageCount: 0, perCustomerLimit: 1, perIpLimit: 1, isWelcome: false, isActive: true }],
    });

    expect(response.coupons[0]?.code).toBe('PROMO10');
    expect(response.coupons[0]?.discountType).toBe('percentage');
  });

  it('adaptEcommerceCoupon normaliza cupón individual', () => {
    const coupon = adaptEcommerceCoupon({
      id: 'c-1',
      code: 'WELCOME',
      discountType: 'fixed',
      discountValue: 15,
      minSubtotal: 50,
      usageCount: 2,
      perCustomerLimit: 1,
      perIpLimit: 1,
      isWelcome: true,
      isActive: true,
    });

    expect(coupon.code).toBe('WELCOME');
    expect(coupon.isWelcome).toBe(true);
  });

  it('adaptNewsletterSubscribersListResponse normaliza suscriptores', () => {
    const response = adaptNewsletterSubscribersListResponse({
      subscribers: [{ id: 'sub-1', email: 'news@test.com', status: 'active', source: 'footer', subscribedAt: '2026-09-09' }],
      meta: { total: 1, page: 1, perPage: 15, totalPages: 1, activeCount: 1 },
    });

    expect(response.subscribers).toHaveLength(1);
    expect(response.meta.activeCount).toBe(1);
  });
});
