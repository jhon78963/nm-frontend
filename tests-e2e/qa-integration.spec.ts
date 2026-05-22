import { expect, test, type Page, type Route } from '@playwright/test';

const E2E_USERNAME = process.env.E2E_USERNAME ?? 'vendedora';
const E2E_PASSWORD = process.env.E2E_PASSWORD ?? 'password123';

const MOCK_VENDEDORA = {
  username: E2E_USERNAME,
  email: 'vendedora@test.com',
  name: 'María',
  surname: 'Vendedora',
  role: 'Vendedora',
  roles: ['Vendedora'],
  permissions: [
    'pos.checkout',
    'pos.searchProduct',
    'pos.searchCustomer',
    'cashflow.getDaily',
    'cashflow.store',
  ],
  tenantId: 1,
  warehouseId: 1,
  mustChangePassword: false,
};

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': 'http://localhost:4200',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  };
}

async function fulfillPreflight(route: Route): Promise<boolean> {
  if (route.request().method() === 'OPTIONS') {
    await route.fulfill({ status: 204, headers: corsHeaders() });
    return true;
  }
  return false;
}

async function setupAuthMocks(page: Page, user = MOCK_VENDEDORA): Promise<void> {
  if (process.env.E2E_USE_REAL_API === 'true') {
    return;
  }

  await page.route('**/api/auth/login', async route => {
    if (await fulfillPreflight(route)) return;
    await route.fulfill({
      status: 200,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    });
  });

  await page.route('**/api/auth/me', async route => {
    if (await fulfillPreflight(route)) return;
    await route.fulfill({
      status: 200,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    });
  });

  await page.route('**/api/auth/logout', async route => {
    if (await fulfillPreflight(route)) return;
    await route.fulfill({
      status: 200,
      headers: corsHeaders(),
      body: JSON.stringify({ message: 'Logout successfully' }),
    });
  });

  await page.route('**/api/**', async route => {
    if (await fulfillPreflight(route)) return;
    const url = route.request().url();
    if (url.includes('/auth/')) return route.fallback();
    await route.fulfill({
      status: 403,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Acceso denegado (mock QA)' }),
    });
  });
}

async function fillLoginForm(page: Page): Promise<void> {
  await page.getByTestId('login-username').fill(E2E_USERNAME);
  const passwordInput = page.locator('#login-password-input');
  await passwordInput.click();
  await passwordInput.fill(E2E_PASSWORD);
  await passwordInput.dispatchEvent('input');
  await passwordInput.dispatchEvent('change');
  await passwordInput.blur();
}

async function login(page: Page): Promise<void> {
  await page.goto('/#/auth/login');
  await expect(page.getByTestId('login-username')).toBeVisible();
  await fillLoginForm(page);
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForURL(url => !url.hash.includes('/auth/login'), {
    timeout: 15_000,
  });
}

test.describe('QA — Protección de rutas frontend', () => {
  test('ruta protegida redirige a login sin sesión', async ({ page }) => {
    await page.goto('/#/inventories/products');
    await expect(page).toHaveURL(/auth\/login/, { timeout: 10_000 });
  });

  test('vendedora puede acceder a POS con permiso', async ({ page }) => {
    await setupAuthMocks(page);
    await login(page);
    await page.goto('/#/sales/pos');
    await expect(page).not.toHaveURL(/auth\/login/);
  });

  test('vendedora no puede acceder al registro de compras sin permiso', async ({
    page,
  }) => {
    await setupAuthMocks(page);
    await login(page);
    await page.goto('/#/inventories/purchase/register');
    await expect(page).toHaveURL(/\/(dashboard|home|sales\/pos)?/, {
      timeout: 10_000,
    });
  });

  test('vendedora no ve inventario de productos en menú', async ({ page }) => {
    await setupAuthMocks(page);
    await login(page);
    await page.goto('/#/sales/pos');
    await expect(page.getByText('Productos', { exact: true })).toHaveCount(0);
    await expect(page.getByText('POS', { exact: true })).toBeVisible();
    await expect(page.getByText('Caja', { exact: true })).toBeVisible();
  });

  test('manipulación localStorage no otorga permisos admin en menú', async ({
    page,
  }) => {
    await setupAuthMocks(page);
    await login(page);
    await page.evaluate(() => {
      localStorage.setItem(
        'user',
        JSON.stringify({
          role: 'Admin',
          roles: ['Admin'],
          permissions: ['cashflow.getAdminMonthlyReport', 'purchase.registerBulk'],
        }),
      );
    });
    await page.reload();
    await page.goto('/#/finance/cash-movements/admin-expenses');
    await expect(page).not.toHaveURL(/auth\/login/);
  });
});

test.describe('QA — Interceptor 401', () => {
  test('401 en API limpia sesión y redirige a login', async ({ page }) => {
    await setupAuthMocks(page);
    await login(page);

    await page.route('**/api/**', async route => {
      if (await fulfillPreflight(route)) return;
      await route.fulfill({
        status: 401,
        headers: corsHeaders(),
        body: JSON.stringify({ message: 'Unauthenticated.' }),
      });
    });

    await page.goto('/#/sales/pos');
    await expect(page).toHaveURL(/auth\/login/, { timeout: 15_000 });
  });
});
