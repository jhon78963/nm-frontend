# AuthApp

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 17.2.2.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Playwright tests live in `tests-e2e/`. By default they mock the API (no backend required).

```bash
npm ci
npx playwright install chromium
npm run test:e2e -- tests-e2e/qa-integration.spec.ts
```

CI runs lint, unit tests, production build, `npm audit --audit-level=high`, and `tests-e2e/qa-integration.spec.ts` (see `.github/workflows/ci.yml`).

> **Nota:** `npm audit` falla mientras Angular 17 tenga advisories high/critical sin parche compatible (p. ej. GHSA-58c5-g7wp-6w37). Planifica upgrade de `@angular/*` o revisa el reporte en cada PR.

### Variables de entorno E2E

| Variable | Uso | Default local | Secret en CI |
|----------|-----|---------------|--------------|
| `E2E_USERNAME` | Usuario de login | `vendedora` | Opcional (mock no lo requiere) |
| `E2E_PASSWORD` | Contraseña de login | `password123` | Opcional (mock no lo requiere) |
| `E2E_USE_REAL_API` | `true` = API Laravel real en lugar de mocks | _(vacío)_ | Solo si ejecutas E2E contra backend |
| `E2E_BASE_URL` | URL base de la app | `http://localhost:4200` | Opcional |
| `E2E_PORT` | Puerto de `ng serve` en Playwright | `4200` | Opcional |

Para pruebas contra API real (`E2E_USE_REAL_API=true`), configura en GitHub **Settings → Secrets and variables → Actions** al menos `E2E_USERNAME` y `E2E_PASSWORD` con credenciales del seeder del backend (`SEEDER_DEFAULT_PASSWORD`).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.
