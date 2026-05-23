import { expect, test, type Page, type Route } from '@playwright/test';

/** Usuario demo del seeder Laravel (`vendedora`). */
const E2E_USERNAME = process.env.E2E_USERNAME ?? 'vendedora';
const E2E_PASSWORD = process.env.E2E_PASSWORD ?? 'password123';
const E2E_POS_SKU = process.env.E2E_POS_SKU ?? 'TEST-SKU-001';

const MOCK_PRODUCT = {
  id: '101',
  sku: E2E_POS_SKU,
  name: 'Polo Maritex E2E',
  basePrice: 49.9,
  variants: {
    M: [
      {
        product_size_id: 1001,
        color_id: 2001,
        colorName: 'Azul Marino',
        hex: '#1e3a8a',
        price: 49.9,
        sku: E2E_POS_SKU,
        inventory: { available_quantity: 10, warehouse_id: 1 },
      },
    ],
  },
};

const MOCK_USER = {
  id: 2,
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

/**
 * Intercepta la API (patrón glob) para pruebas deterministas sin backend.
 * Usar E2E_USE_REAL_API=true solo si Laravel está levantado y el seeder ejecutado.
 */
async function setupPosApiMocks(page: Page): Promise<void> {
  if (process.env.E2E_USE_REAL_API === 'true') {
    return;
  }

  await page.route('**/api/auth/login', async route => {
    if (await fulfillPreflight(route)) {
      return;
    }

    await route.fulfill({
      status: 200,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(MOCK_USER),
    });
  });

  await page.route('**/api/auth/me', async route => {
    if (await fulfillPreflight(route)) {
      return;
    }

    await route.fulfill({
      status: 200,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(MOCK_USER),
    });
  });

  await page.route('**/api/pos/products**', async route => {
    if (await fulfillPreflight(route)) {
      return;
    }

    const url = new URL(route.request().url());
    const sku = url.searchParams.get('sku');

    if (sku === E2E_POS_SKU) {
      await route.fulfill({
        status: 200,
        headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(MOCK_PRODUCT),
      });
      return;
    }

    await route.fulfill({
      status: 404,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Producto no encontrado' }),
    });
  });

  await page.route('**/api/pos/checkout', async route => {
    if (await fulfillPreflight(route)) {
      return;
    }

    await route.fulfill({
      status: 200,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        sale_id: 'E2E-0001',
        // Debe ser origen permitido por PosService.isValidTicketUrl (localhost:8000)
        ticket_url: 'http://localhost:8000/api/pos/sales/E2E-0001/ticket',
        message: 'Venta registrada correctamente',
      }),
    });
  });

  // Ticket autenticado: el POS lo pide vía HttpClient, no iframe directo a la API
  await page.route('**/api/pos/sales/**/ticket**', async route => {
    await route.fulfill({
      status: 200,
      headers: { 'Content-Type': 'text/html' },
      body: '<html><body>Ticket E2E</body></html>',
    });
  });
}

/**
 * PrimeNG p-password usa ControlValueAccessor: hay que disparar input/change
 * para que Angular incluya `password` en el POST (si no, Laravel responde 422).
 */
async function fillLoginForm(page: Page): Promise<void> {
  await page.getByTestId('login-username').fill(E2E_USERNAME);

  const passwordInput = page.locator('#login-password-input');
  await passwordInput.click();
  await passwordInput.fill(E2E_PASSWORD);
  await passwordInput.dispatchEvent('input');
  await passwordInput.dispatchEvent('change');
  await passwordInput.blur();

  await expect(page.getByRole('button', { name: 'Login' })).toBeEnabled();
  await expect(passwordInput).toHaveValue(E2E_PASSWORD);
}

async function readSessionFlag(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const raw = localStorage.getItem('authSession');
    if (!raw) {
      return false;
    }

    try {
      const parsed = JSON.parse(raw) as { isLoggedIn?: boolean };
      return parsed.isLoggedIn === true;
    } catch {
      return false;
    }
  });
}

test.describe('Flujo crítico POS — cajero', () => {
  test.beforeEach(async ({ page }) => {
    await setupPosApiMocks(page);
  });

  test('login → escaneo SKU → carrito → cobrar', async ({ page }) => {
    await page.goto('/#/auth/login');
    await expect(page.getByTestId('login-username')).toBeVisible();

    await fillLoginForm(page);

    const loginResponse = page.waitForResponse(
      response =>
        response.url().includes('/api/auth/login') &&
        response.request().method() === 'POST',
    );

    await page.getByRole('button', { name: 'Login' }).click();
    const response = await loginResponse;

    if (!response.ok()) {
      const body = await response.text();
      const hint =
        response.status() === 401 || response.status() === 422
          ? ' — verifica E2E_USERNAME/E2E_PASSWORD y ejecuta: php artisan db:seed --class=RoleAndPermissionSeeder'
          : '';
      throw new Error(`Login HTTP ${response.status()}: ${body}${hint}`);
    }

    await expect
      .poll(async () => readSessionFlag(page), { timeout: 5_000 })
      .toBe(true);

    await page.waitForURL(currentUrl => !currentUrl.hash.includes('/auth/login'), {
      timeout: 15_000,
    });

    await page.goto('/#/sales/pos');
    await expect(page.getByPlaceholder('Escanear código...')).toBeVisible();

    const scannerInput = page.getByPlaceholder('Escanear código...');
    await scannerInput.fill(E2E_POS_SKU);
    await page.locator('button .pi-barcode').locator('..').click();

    await expect(page.getByText(MOCK_PRODUCT.name)).toBeVisible({ timeout: 10_000 });
    await page.getByText('Toca para agregar').first().click();
    await page.getByRole('button', { name: 'AGREGAR AL CARRITO' }).click();

    await expect(page.locator('.item-card')).toHaveCount(1);
    await expect(page.locator('.item-card')).toContainText(MOCK_PRODUCT.name);
    await expect(page.getByText(/Carrito \(1\)/)).toBeVisible();

    const checkoutResponse = page.waitForResponse(
      response =>
        response.url().includes('/api/pos/checkout') &&
        response.request().method() === 'POST',
    );

    await page.getByRole('button', { name: 'COBRAR' }).click();
    const checkout = await checkoutResponse;

    if (!checkout.ok()) {
      throw new Error(
        `Checkout HTTP ${checkout.status()}: ${await checkout.text()}`,
      );
    }

    const checkoutBody = (await checkout.json()) as {
      success?: boolean;
      sale_id?: string | number;
    };
    expect(checkoutBody.success).toBeTruthy();

    // Señal fiable #1: carrito vacío tras venta exitosa
    await expect(page.getByText('Empieza a escanear')).toBeVisible({
      timeout: 10_000,
    });

    // Señal fiable #2: toast de éxito (data-testid, no desaparece por errores de impresión)
    await expect(page.getByTestId('pos-toast')).toContainText(/Venta .+ Exitosa!/, {
      timeout: 5_000,
    });
  });
});
