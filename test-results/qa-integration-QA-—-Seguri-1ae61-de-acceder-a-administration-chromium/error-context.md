# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: qa-integration.spec.ts >> QA — Seguridad warehouse / admin / payroll (SEC-025) >> usuario sin rol admin no puede acceder a /administration
- Location: tests-e2e/qa-integration.spec.ts:206:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
TimeoutError: page.goto: Timeout 30000ms exceeded.
Call log:
  - navigating to "http://localhost:4200/#/auth/login", waiting until "load"

```

# Test source

```ts
  13  |   roles: ['Vendedora'],
  14  |   permissions: [
  15  |     'pos.checkout',
  16  |     'pos.searchProduct',
  17  |     'pos.searchCustomer',
  18  |     'cashflow.getDaily',
  19  |     'cashflow.store',
  20  |   ],
  21  |   tenantId: 1,
  22  |   warehouseId: 1,
  23  |   mustChangePassword: false,
  24  | };
  25  | 
  26  | function corsHeaders(): Record<string, string> {
  27  |   return {
  28  |     'Access-Control-Allow-Origin': 'http://localhost:4200',
  29  |     'Access-Control-Allow-Credentials': 'true',
  30  |     'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  31  |     'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  32  |   };
  33  | }
  34  | 
  35  | async function fulfillPreflight(route: Route): Promise<boolean> {
  36  |   if (route.request().method() === 'OPTIONS') {
  37  |     await route.fulfill({ status: 204, headers: corsHeaders() });
  38  |     return true;
  39  |   }
  40  |   return false;
  41  | }
  42  | 
  43  | async function setupAuthMocks(page: Page, user = MOCK_VENDEDORA): Promise<void> {
  44  |   if (process.env.E2E_USE_REAL_API === 'true') {
  45  |     return;
  46  |   }
  47  | 
  48  |   await page.route('**/sanctum/csrf-cookie', async route => {
  49  |     if (await fulfillPreflight(route)) return;
  50  |     await route.fulfill({ status: 204, headers: corsHeaders() });
  51  |   });
  52  | 
  53  |   await page.route('**/api/auth/csrf-token', async route => {
  54  |     if (await fulfillPreflight(route)) return;
  55  |     await route.fulfill({
  56  |       status: 200,
  57  |       headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
  58  |       body: JSON.stringify({ csrf_token: 'e2e-csrf-token' }),
  59  |     });
  60  |   });
  61  | 
  62  |   await page.route('**/api/auth/login', async route => {
  63  |     if (await fulfillPreflight(route)) return;
  64  |     await route.fulfill({
  65  |       status: 200,
  66  |       headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
  67  |       body: JSON.stringify(user),
  68  |     });
  69  |   });
  70  | 
  71  |   await page.route('**/api/auth/me', async route => {
  72  |     if (await fulfillPreflight(route)) return;
  73  |     await route.fulfill({
  74  |       status: 200,
  75  |       headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
  76  |       body: JSON.stringify(user),
  77  |     });
  78  |   });
  79  | 
  80  |   await page.route('**/api/auth/logout', async route => {
  81  |     if (await fulfillPreflight(route)) return;
  82  |     await route.fulfill({
  83  |       status: 200,
  84  |       headers: corsHeaders(),
  85  |       body: JSON.stringify({ message: 'Logout successfully' }),
  86  |     });
  87  |   });
  88  | 
  89  |   await page.route('**/api/**', async route => {
  90  |     if (await fulfillPreflight(route)) return;
  91  |     const url = route.request().url();
  92  |     if (url.includes('/auth/')) return route.fallback();
  93  |     await route.fulfill({
  94  |       status: 403,
  95  |       headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
  96  |       body: JSON.stringify({ message: 'Acceso denegado (mock QA)' }),
  97  |     });
  98  |   });
  99  | }
  100 | 
  101 | async function fillLoginForm(page: Page): Promise<void> {
  102 |   await page.getByTestId('login-username').fill(E2E_USERNAME);
  103 |   const passwordInput = page.locator('#login-password-input');
  104 |   await passwordInput.click();
  105 |   await passwordInput.fill(E2E_PASSWORD);
  106 |   await passwordInput.dispatchEvent('input');
  107 |   await passwordInput.dispatchEvent('change');
  108 |   await passwordInput.blur();
  109 |   await expect(page.getByRole('button', { name: 'Login' })).toBeEnabled();
  110 | }
  111 | 
  112 | async function login(page: Page): Promise<void> {
> 113 |   await page.goto('/#/auth/login');
      |              ^ TimeoutError: page.goto: Timeout 30000ms exceeded.
  114 |   await expect(page.getByTestId('login-username')).toBeVisible();
  115 |   await fillLoginForm(page);
  116 |   await page.getByRole('button', { name: 'Login' }).click();
  117 |   await page.waitForURL(url => !url.hash.includes('/auth/login'), {
  118 |     timeout: 15_000,
  119 |   });
  120 | }
  121 | 
  122 | test.describe('QA — Protección de rutas frontend', () => {
  123 |   test('ruta protegida redirige a login sin sesión', async ({ page }) => {
  124 |     await page.goto('/#/inventories/products');
  125 |     await expect(page).toHaveURL(/auth\/login/, { timeout: 10_000 });
  126 |   });
  127 | 
  128 |   test('vendedora puede acceder a POS con permiso', async ({ page }) => {
  129 |     await setupAuthMocks(page);
  130 |     await login(page);
  131 |     await page.goto('/#/sales/pos');
  132 |     await expect(page).not.toHaveURL(/auth\/login/);
  133 |   });
  134 | 
  135 |   test('vendedora no puede acceder al registro de compras sin permiso', async ({
  136 |     page,
  137 |   }) => {
  138 |     await setupAuthMocks(page);
  139 |     await login(page);
  140 |     await page.goto('/#/inventories/purchase/register');
  141 |     await expect(page).toHaveURL(/\/(dashboard|home|sales\/pos)?/, {
  142 |       timeout: 10_000,
  143 |     });
  144 |   });
  145 | 
  146 |   test('vendedora no ve inventario de productos en menú', async ({ page }) => {
  147 |     await setupAuthMocks(page);
  148 |     await login(page);
  149 |     await page.goto('/#/sales/pos');
  150 |     const sidebarMenu = page.locator('.layout-menu');
  151 |     await expect(sidebarMenu.getByText('Productos', { exact: true })).toHaveCount(0);
  152 |     await expect(sidebarMenu.getByText('POS', { exact: true })).toHaveCount(1);
  153 |     await expect(sidebarMenu.getByText('Caja', { exact: true })).toHaveCount(1);
  154 |   });
  155 | 
  156 |   test('manipulación localStorage no otorga permisos admin en menú', async ({
  157 |     page,
  158 |   }) => {
  159 |     await setupAuthMocks(page);
  160 |     await login(page);
  161 |     await page.evaluate(() => {
  162 |       localStorage.setItem(
  163 |         'user',
  164 |         JSON.stringify({
  165 |           role: 'Admin',
  166 |           roles: ['Admin'],
  167 |           permissions: ['cashflow.getAdminMonthlyReport', 'purchase.registerBulk'],
  168 |         }),
  169 |       );
  170 |     });
  171 |     await page.reload();
  172 |     await page.goto('/#/finance/cash-movements/admin-expenses');
  173 |     await expect(page).not.toHaveURL(/auth\/login/);
  174 |   });
  175 | });
  176 | 
  177 | /**
  178 |  * SEC-025 — E2E ampliado: warehouse / admin / payroll
  179 |  *
  180 |  * Credenciales semilla (backend RoleAndPermissionSeeder):
  181 |  *   - vendedora / password123  →  Role: Vendedora  (sin admin, sin team.getPaymentByMonth)
  182 |  *   - superadmin / password123 →  Role: Super Admin (todos los permisos)
  183 |  *
  184 |  * Para correr contra el backend real: E2E_USE_REAL_API=true
  185 |  * Variables de entorno: E2E_USERNAME, E2E_PASSWORD, E2E_BASE_URL
  186 |  */
  187 | test.describe('QA — Seguridad warehouse / admin / payroll (SEC-025)', () => {
  188 |   test('warehouse_id arbitrario en localStorage no otorga acceso a inventario', async ({
  189 |     page,
  190 |   }) => {
  191 |     // vendedora no tiene product.getAll → permissionGuard bloquea /inventories/products
  192 |     // incluso si el atacante manipula active_warehouse_id para apuntar a otro warehouse
  193 |     await setupAuthMocks(page);
  194 |     await login(page);
  195 | 
  196 |     await page.evaluate(() => {
  197 |       localStorage.setItem('active_warehouse_id', '9999');
  198 |     });
  199 | 
  200 |     await page.goto('/#/inventories/products');
  201 | 
  202 |     // permissionGuard redirige al dashboard — la URL nunca debe quedar en /inventories/products
  203 |     await expect(page).not.toHaveURL(/inventories\/products/, { timeout: 10_000 });
  204 |   });
  205 | 
  206 |   test('usuario sin rol admin no puede acceder a /administration', async ({ page }) => {
  207 |     // vendedora (role: Vendedora) no tiene Admin ni Super Admin → roleGuard redirige
  208 |     await setupAuthMocks(page);
  209 |     await login(page);
  210 | 
  211 |     await page.goto('/#/administration');
  212 | 
  213 |     await expect(page).not.toHaveURL(/administration/, { timeout: 10_000 });
```