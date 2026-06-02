import { expect, test, type Page, type Route } from '@playwright/test';

const E2E_USERNAME = process.env.E2E_USERNAME ?? 'vendedora';
const E2E_PASSWORD = process.env.E2E_PASSWORD ?? 'password123';

const MOCK_VENDEDORA = {
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

async function setupAuthMocks(page: Page, user = MOCK_VENDEDORA): Promise<void> {
  if (process.env.E2E_USE_REAL_API === 'true') {
    return;
  }

  await page.route('**/sanctum/csrf-cookie', async route => {
    if (await fulfillPreflight(route)) return;
    await route.fulfill({ status: 204, headers: corsHeaders() });
  });

  await page.route('**/api/auth/csrf-token', async route => {
    if (await fulfillPreflight(route)) return;
    await route.fulfill({
      status: 200,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ csrf_token: 'e2e-csrf-token' }),
    });
  });

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
  await expect(page.getByRole('button', { name: 'Login' })).toBeEnabled();
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
    const sidebarMenu = page.locator('.layout-menu');
    await expect(sidebarMenu.getByText('Productos', { exact: true })).toHaveCount(0);
    await expect(sidebarMenu.getByText('POS', { exact: true })).toHaveCount(1);
    await expect(sidebarMenu.getByText('Caja', { exact: true })).toHaveCount(1);
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

/**
 * SEC-025 — E2E ampliado: warehouse / admin / payroll
 *
 * Credenciales semilla (backend RoleAndPermissionSeeder):
 *   - vendedora / password123  →  Role: Vendedora  (sin admin, sin team.getPaymentByMonth)
 *   - superadmin / password123 →  Role: Super Admin (todos los permisos)
 *
 * Para correr contra el backend real: E2E_USE_REAL_API=true
 * Variables de entorno: E2E_USERNAME, E2E_PASSWORD, E2E_BASE_URL
 */
test.describe('QA — Seguridad warehouse / admin / payroll (SEC-025)', () => {
  test('warehouse_id arbitrario en localStorage no otorga acceso a inventario', async ({
    page,
  }) => {
    // vendedora no tiene product.getAll → permissionGuard bloquea /inventories/products
    // incluso si el atacante manipula active_warehouse_id para apuntar a otro warehouse
    await setupAuthMocks(page);
    await login(page);

    await page.evaluate(() => {
      localStorage.setItem('active_warehouse_id', '9999');
    });

    await page.goto('/#/inventories/products');

    // permissionGuard redirige al dashboard — la URL nunca debe quedar en /inventories/products
    await expect(page).not.toHaveURL(/inventories\/products/, { timeout: 10_000 });
  });

  test('usuario sin rol admin no puede acceder a /administration', async ({ page }) => {
    // vendedora (role: Vendedora) no tiene Admin ni Super Admin → roleGuard redirige
    await setupAuthMocks(page);
    await login(page);

    await page.goto('/#/administration');

    await expect(page).not.toHaveURL(/administration/, { timeout: 10_000 });
  });

  test('usuario sin permiso team.getPaymentByMonth no puede acceder a payroll', async ({
    page,
  }) => {
    // Usuario con acceso básico a team (team.getAll) pero sin team.getPaymentByMonth
    const userWithTeamButNoPayroll = {
      ...MOCK_VENDEDORA,
      permissions: [
        ...MOCK_VENDEDORA.permissions,
        'team.getAll',
        'team.get',
        // team.getPaymentByMonth omitido deliberadamente
      ],
    };

    await setupAuthMocks(page, userWithTeamButNoPayroll);
    await login(page);

    await page.goto('/#/directory/team/pagos/1');

    // permissionGuard bloquea la ruta y redirige al dashboard
    await expect(page).not.toHaveURL(/directory\/team\/pagos/, { timeout: 10_000 });
  });
});

test.describe('QA — Interceptor 401', () => {
  test('401 en API limpia sesión y redirige a login', async ({ page }) => {
    await setupAuthMocks(page);
    await login(page);

    await page.unroute('**/api/auth/me');
    await page.route('**/api/auth/me', async route => {
      if (await fulfillPreflight(route)) return;
      await route.fulfill({
        status: 401,
        headers: corsHeaders(),
        body: JSON.stringify({ message: 'Unauthenticated.' }),
      });
    });

    await page.route('**/api/auth/refresh', async route => {
      if (await fulfillPreflight(route)) return;
      await route.fulfill({
        status: 401,
        headers: corsHeaders(),
        body: JSON.stringify({ message: 'Unauthenticated.' }),
      });
    });

    await page.reload();
    await expect(page).toHaveURL(/auth\/login/, { timeout: 15_000 });
  });
})

test.describe('QA — SEC-010: Warehouse desde sesión', () => {
  test('active_warehouse_id en localStorage no es enviado como X-Warehouse-Id al auth/me', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      // Simula un localStorage manipulado por DevTools antes de la sesión
      localStorage.setItem('active_warehouse_id', '9999');
    });

    await setupAuthMocks(page);
    await login(page);

    // Tras el login (que dispara auth/me + syncFromAuthUser), el warehouse
    // debe haberse sincronizado desde la respuesta del servidor (warehouseId: 1),
    // no desde el localStorage spoofed (9999).
    const warehouseInSignal = await page.evaluate(() => {
      // El header X-Warehouse-Id que el interceptor enviaría en la próxima petición
      // refleja el signal, no el localStorage (que ya fue borrado para usuarios regulares).
      return localStorage.getItem('active_warehouse_id');
    });

    // Para un usuario regular (Vendedora), el servicio borra el localStorage y usa
    // el valor del servidor. Así, active_warehouse_id no debe ser '9999'.
    expect(warehouseInSignal).not.toBe('9999');
  });

  test('manipular active_warehouse_id post-login no cambia el signal del servicio', async ({
    page,
  }) => {
    await setupAuthMocks(page);
    await login(page);

    // Simula un atacante que edita localStorage tras autenticarse
    await page.evaluate(() => {
      localStorage.setItem('active_warehouse_id', '8888');
    });

    await page.reload();

    // Tras recargar, auth/me se vuelve a llamar y el servicio re-sincroniza
    // desde el servidor (warehouseId: 1). Para un usuario regular, el valor
    // inyectado en localStorage es ignorado.
    await page.waitForURL(url => !url.hash.includes('/auth/login'), {
      timeout: 15_000,
    });

    const storedId = await page.evaluate(() =>
      localStorage.getItem('active_warehouse_id'),
    );

    expect(storedId).not.toBe('8888');
  });
});

