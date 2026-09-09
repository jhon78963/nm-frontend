import { expect, test } from '@playwright/test';
import {
  corsHeaders,
  fulfillPreflight,
  login,
  MOCK_VENDEDORA,
  setupAuthMocks,
} from './helpers/auth-mocks';

const MOCK_SALE_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

const MOCK_SALES_USER = {
  ...MOCK_VENDEDORA,
  permissions: [
    ...MOCK_VENDEDORA.permissions,
    'sale.getAll',
    'sale.get',
    'sale.exchange',
    'sale.update',
  ],
};

const MOCK_SALE_DETAIL = {
  id: MOCK_SALE_ID,
  code: 'V-E2E-001',
  creationTime: '2026-09-09T10:00:00.000Z',
  total: 59.9,
  status: 'ACTIVE',
  paymentMethod: 'CASH',
  customer: 'Cliente E2E',
  items: [
    {
      id: 'item-e2e-1',
      product_name: 'Polo E2E',
      quantity: 1,
      unit_price: 59.9,
      subtotal: 59.9,
    },
  ],
  payments: [{ method: 'CASH', amount: 59.9 }],
};

async function setupSalesMocks(page: import('@playwright/test').Page): Promise<void> {
  await page.route(`**/api/v1/sales/${MOCK_SALE_ID}`, async (route) => {
    if (await fulfillPreflight(route)) return;
    await route.fulfill({
      status: 200,
      headers: {
        ...corsHeaders(route.request().headers()['origin']),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(MOCK_SALE_DETAIL),
    });
  });
}

test.describe('QA — Deep links ventas', () => {
  test('/finances/sales/new redirige al POS', async ({ page }) => {
    await setupAuthMocks(page, MOCK_SALES_USER);
    await login(page);
    await page.goto('/finances/sales/new');
    await expect(page).toHaveURL(/\/finances\/pos/, { timeout: 10_000 });
  });

  test('/finances/sales/:id abre detalle de venta', async ({ page }) => {
    await setupAuthMocks(page, MOCK_SALES_USER);
    await setupSalesMocks(page);
    await login(page);
    await page.goto(`/finances/sales/${MOCK_SALE_ID}`);
    await expect(page).toHaveURL(new RegExp(`/finances/sales/${MOCK_SALE_ID}$`));
    await expect(
      page.getByRole('heading', { name: /Editar venta|Detalle de venta/, level: 2 }),
    ).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText('Polo E2E')).toBeVisible();
  });

  test('/finances/sales/:id/exchange abre flujo de canje', async ({ page }) => {
    await setupAuthMocks(page, MOCK_SALES_USER);
    await setupSalesMocks(page);
    await login(page);
    await page.goto(`/finances/sales/${MOCK_SALE_ID}/exchange`);
    await expect(page).toHaveURL(
      new RegExp(`/finances/sales/${MOCK_SALE_ID}/exchange$`),
    );
    await expect(page.getByRole('heading', { name: 'Canje / Cambio', level: 2 })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText('Polo E2E')).toBeVisible();
  });
});
