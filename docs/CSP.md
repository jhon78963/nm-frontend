# Content-Security-Policy (producción) — nm-frontend

**SEC-005.** La CSP de producción se envía por **header HTTP en nginx**, no por `<meta>` en HTML.

| Entorno                 | Dónde vive la CSP                                              |
| ----------------------- | -------------------------------------------------------------- |
| Desarrollo (`ng serve`) | `src/index.html` — meta `http-equiv` (SEC-022)                 |
| Producción (`ng build`) | `deploy/nginx.conf.example` — header `Content-Security-Policy` |

### CSP en desarrollo (SEC-022)

`src/index.html` aplica la misma política base que nginx, con estas diferencias:

| Directiva                   | Dev                                                              | Prod (nginx)                                   |
| --------------------------- | ---------------------------------------------------------------- | ---------------------------------------------- |
| `upgrade-insecure-requests` | No (API/uploads locales en HTTP)                                 | Sí                                             |
| `img-src`                   | Sin `https:` global; hosts de `environment.ts` + API/upload prod | `'self' data: blob: https:` (catálogo externo) |
| `connect-src`               | `localhost:8000`, `127.0.0.1:3050`, HMR `ws://localhost:4200`    | Solo API/upload HTTPS                          |

`style-src 'unsafe-inline'` es obligatorio en ambos entornos mientras Angular/PrimeNG inyecten estilos en línea (ver sección abajo).

Si usas API en LAN (`environment.ts` con IP), añade ese origen a `connect-src` e `img-src` en tu copia local o documenta el host en el meta.

`src/index.prod.html` deja un comentario a propósito: en build de producción no hay meta CSP; el servidor debe aplicarla.

---

## Política recomendada (copy-paste)

Valor de una sola línea (igual que en `deploy/nginx.conf.example`):

```text
default-src 'self'; script-src 'self' https://unpkg.com; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; font-src 'self' data: https://cdnjs.cloudflare.com https://unpkg.com; img-src 'self' data: blob: https:; connect-src 'self' https://api.novedadesmaritex.net.pe https://upload.novedadesmaritex.net.pe; frame-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'; upgrade-insecure-requests
```

En nginx:

```nginx
add_header Content-Security-Policy "default-src 'self'; script-src 'self' https://unpkg.com; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; font-src 'self' data: https://cdnjs.cloudflare.com https://unpkg.com; img-src 'self' data: blob: https:; connect-src 'self' https://api.novedadesmaritex.net.pe https://upload.novedadesmaritex.net.pe; frame-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'; upgrade-insecure-requests" always;
```

O usa la variable `$nm_csp` del ejemplo completo en `deploy/nginx.conf.example`.

---

## Alineación con `index.prod.html`

Recursos externos declarados en producción:

| Recurso                                     | Origen                                   | Directiva                |
| ------------------------------------------- | ---------------------------------------- | ------------------------ |
| Bundles Angular (JS)                        | `'self'`                                 | `script-src`             |
| Phosphor Icons                              | `https://unpkg.com`                      | `script-src`, `font-src` |
| Font Awesome 6 CSS                          | `https://cdnjs.cloudflare.com`           | `style-src`, `font-src`  |
| Tema PrimeNG / layout                       | `'self'` (`assets/...`)                  | `style-src`              |
| API Laravel Sanctum                         | `https://api.novedadesmaritex.net.pe`    | `connect-src`            |
| Servicio de uploads                         | `https://upload.novedadesmaritex.net.pe` | `connect-src`            |
| Imágenes de productos/CDN                   | `https:`                                 | `img-src`                |
| Vista previa / impresión POS (blob, iframe) | `blob:`                                  | `img-src`, `frame-src`   |

Variables de entorno de referencia: `src/environments/environment.prod.ts`.

---

## Directivas y excepciones necesarias

### `style-src 'unsafe-inline'` (Angular + PrimeNG)

Angular inyecta estilos en línea en componentes (`encapsulation`, estilos de plantilla) y PrimeNG añade estilos dinámicos. Sin `'unsafe-inline'` en `style-src`, la UI se rompe (temas, tablas, diálogos).

**No confundir con scripts:** en build de producción los JS van hasheados en archivos bajo `'self'`; `script-src` no necesita `'unsafe-inline'` salvo que se añadan scripts inline a mano.

### `img-src https:`

Permite imágenes servidas desde el dominio de uploads u otros HTTPS de catálogo. Restringir a hosts concretos mejora la postura si todos los assets pasan por dominios fijos.

### `frame-src 'self' blob:`

Impresión de tickets (POS/ventas) crea `<iframe src="blob:...">`. Sin `blob:` en `frame-src`, la impresión falla en producción.

### `connect-src`

Debe incluir **exactamente** los orígenes que usa `HttpClient` y cookies Sanctum:

- API: `https://api.novedadesmaritex.net.pe`
- Upload: `https://upload.novedadesmaritex.net.pe`

Si añades staging u otro API, agrega el host aquí y en `environment.*.ts`.

### CDNs en `index.html` / `index.prod.html` (SEC-021)

Font Awesome 6.4.0 (cdnjs) y Phosphor Icons `@2.1.2` (unpkg) incluyen **SRI** (`integrity` + `crossorigin="anonymous"`). La CSP los permite en `style-src` / `script-src` / `font-src`.

**Plan opcional:** self-host en `assets/` y quitar `cdnjs.cloudflare.com` y `unpkg.com` de la política.

---

## Plan para reducir `'unsafe-inline'` en estilos

| Fase | Acción                                                                                  | Impacto                                    |
| ---- | --------------------------------------------------------------------------------------- | ------------------------------------------ |
| 1    | ~~SRI en CDN~~ (hecho SEC-021) o self-host en `assets/`                                 | Menos dominios en `style-src` / `font-src` |
| 2    | Auditar estilos inline críticos (PrimeNG theme, `styles.scss`)                          | Base para nonces o hashes                  |
| 3    | Evaluar CSP con **nonce** en nginx (`style-src 'nonce-…'`) + build Angular experimental | Permite quitar `'unsafe-inline'` global    |
| 4    | Endurecer `img-src` a hosts de uploads conocidos                                        | Menor superficie XSS vía imágenes          |

Mientras las fases 3–4 no estén hechas, mantener `'unsafe-inline'` en `style-src` es el compromiso documentado y aceptado para esta app.

---

## Verificación tras despliegue

1. Abrir la app en HTTPS y en DevTools → **Network** → documento principal → Response Headers: debe aparecer `Content-Security-Policy`.
2. Consola sin violaciones CSP en login, listados, POS e impresión de ticket.
3. Peticiones a API y upload sin bloqueos (`connect-src`).
4. Opcional: [CSP Evaluator](https://csp-evaluator.withgoogle.com/) pegando el valor del header.

```bash
curl -sI "https://adm.tudominio.com/" | grep -i content-security-policy
```

---

## Referencias

- `deploy/nginx.conf.example` — server block listo para copiar
- `src/index.prod.html` — sin meta CSP; CDNs documentados
- `nm-backend/docs/DEPLOY-SECURITY.md` — headers del API (SEC-004); CSP del SPA es solo aquí
- `security-audit/PROMPTS.md` — SEC-005, SEC-022
