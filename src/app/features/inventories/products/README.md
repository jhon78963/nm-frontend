# Módulo de productos (inventario)

Gestión de catálogo ERP: listado, stepper multi-paso, tallas, colores, ecommerce, kardex e historial.

## Estructura

```
products/
├── components/
│   ├── products-list/
│   ├── product-form/
│   ├── product-form-wrapper/
│   ├── product-stepper/
│   ├── product-sizes/
│   ├── product-colors/
│   ├── product-ecommerce-step/
│   ├── product-kardex/
│   └── product-history/
├── data-access/
│   ├── product.service.ts
│   ├── product-sizes.service.ts
│   ├── product-colors.service.ts
│   ├── product-lookup.service.ts
│   ├── kardex.service.ts
│   ├── product.adapter.ts
│   └── kardex.adapter.ts
├── models/
│   ├── product.model.ts
│   ├── product-ecommerce.model.ts
│   └── kardex.model.ts
└── products.routes.ts
```

## Rutas

| Ruta | Permiso(s) | Descripción |
|------|------------|-------------|
| `/inventories/products` | `product.getAll` | Listado |
| `/inventories/products/new` | `product.create` | Alta (stepper) |
| `/inventories/products/:id/general` | `product.get` | Datos generales |
| `/inventories/products/:id/sizes` | `productSize.add`, `productSize.modify` | Tallas y precios |
| `/inventories/products/:id/colors` | `productSizeColor.add`, `productSizeColor.modify` | Variantes por color |
| `/inventories/products/:id/ecommerce` | `product.update` | Publicación tienda online |
| `/inventories/products/:id/kardex` | `inventoryKardex.index` | Movimientos de stock |
| `/inventories/products/:id/history` | `productHistory.index` | Auditoría de cambios |

La ruta legacy `/inventories/products/edit/:id` redirige a `:id/general`.

## Servicios principales

- **ProductService** — CRUD, historial, import/export Excel.
- **ProductSizesService** — tallas, códigos de barras, stock y precios.
- **ProductColorsService** — variantes por talla/color y catálogo de colores.
- **ProductLookupService** — géneros, almacenes y tipos de talla.
- **KardexService** — reporte de movimientos por producto.

Los adapters normalizan respuestas del API (`camelCase`, valores por defecto, tipos seguros).

## Patrones

- Componentes standalone con signals y `inject()`.
- Formularios con Signal Forms donde aplica.
- Guards de permiso en rutas (`permissionGuard`).
- IDs de entidades como **UUID string** (alineado con Prisma/backend).

## Desarrollo local

```bash
cd nm-frontend
npm start
```

Abrir `http://localhost:4200/inventories/products` (requiere sesión con `product.getAll`).

## Tests

Los specs del monorepo usan Vitest (`tsconfig.spec.json`). Ejemplo:

```bash
cd nm-frontend
npx vitest run src/app/core/warehouse/active-warehouse.service.spec.ts
```
