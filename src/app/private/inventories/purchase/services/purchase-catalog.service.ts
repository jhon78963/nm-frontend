import { Injectable } from '@angular/core';
import { forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { ApiService } from '../../../../services/api.service';
import {
  Vendor,
  VendorListResponse,
} from '../../../directory/vendors/models/vendors.model';
import {
  Product,
  ProductListResponse,
} from '../../products/models/products.model';
import { Size, SizeListResponse } from '../../sizes/models/sizes.model';
import {
  ProductColorOption,
  ProductSizeOption,
  SizeTypeOption,
} from '../models/purchase.models';

@Injectable({
  providedIn: 'root',
})
export class PurchaseCatalogService {
  constructor(private readonly api: ApiService) {}

  searchProducts(term: string, limit = 15, page = 1): Observable<Product[]> {
    const q = encodeURIComponent(term.trim());
    const url = `products?limit=${limit}&page=${page}&search=${q}`;
    return this.api
      .get<ProductListResponse>(url)
      .pipe(map(res => res.data ?? []));
  }

  getProductSizes(productId: number): Observable<ProductSizeOption[]> {
    return this.api
      .get<unknown>(`colors/sizes?productId=${productId}`)
      .pipe(map(raw => this.normalizeProductSizeOptions(raw)));
  }

  /**
   * Normaliza la respuesta de Laravel (camelCase en Resource o snake_case legado).
   */
  private normalizeProductSizeOptions(raw: unknown): ProductSizeOption[] {
    if (!Array.isArray(raw)) {
      return [];
    }
    return raw.map(r =>
      this.normalizeProductSizeOption(r as Record<string, unknown>),
    );
  }

  private normalizeProductSizeOption(
    row: Record<string, unknown>,
  ): ProductSizeOption {
    const num = (v: unknown): number | null =>
      v === null || v === undefined || v === '' ? null : Number(v);
    const str = (v: unknown): string | null =>
      v === null || v === undefined ? null : String(v).trim() || null;

    return {
      id: Number(row['id']) || 0,
      description: String(row['description'] ?? ''),
      productSizeId:
        row['productSizeId'] != null
          ? Number(row['productSizeId'])
          : row['product_size_id'] != null
            ? Number(row['product_size_id'])
            : undefined,
      stock:
        row['stock'] != null && row['stock'] !== ''
          ? Number(row['stock'])
          : undefined,
      barcode: str(row['barcode'] ?? row['bar_code']),
      purchasePrice: num(row['purchasePrice']) ?? num(row['purchase_price']),
      salePrice: num(row['salePrice']) ?? num(row['sale_price']),
      minSalePrice: num(row['minSalePrice']) ?? num(row['min_sale_price']),
    };
  }

  /**
   * Colores del catálogo global con bandera `isExists` según `product_size_color` para esa talla.
   * Usa `GET colors/selected` (no `selected-attached`) para poder elegir colores que ya existen en `colors`
   * pero aún no están vinculados a esta talla del producto.
   */
  getColors(
    productId: number,
    sizeId: number,
  ): Observable<ProductColorOption[]> {
    return this.api
      .get<unknown>(`colors/selected?productId=${productId}&sizeId=${sizeId}`)
      .pipe(
        map(raw =>
          this.normalizeColorOptions(this.unwrapColorsApiPayload(raw)),
        ),
      );
  }

  /** Laravel suele devolver `{ data: [...] }` o el arreglo plano. */
  private unwrapColorsApiPayload(raw: unknown): unknown {
    if (Array.isArray(raw)) {
      return raw;
    }
    if (
      raw &&
      typeof raw === 'object' &&
      Array.isArray((raw as Record<string, unknown>)['data'])
    ) {
      return (raw as Record<string, unknown>)['data'];
    }
    return [];
  }

  private normalizeColorOptions(raw: unknown): ProductColorOption[] {
    if (!Array.isArray(raw)) {
      return [];
    }
    return raw.map(r => {
      const row = r as Record<string, unknown>;
      const bool = (v: unknown): boolean =>
        v === true || v === 1 || v === '1' || v === 'true';
      return {
        id: Number(row['id']) || 0,
        description: String(row['description'] ?? ''),
        hash: (row['hash'] as string | null) ?? null,
        isExists: bool(row['isExists'] ?? row['is_exists']),
        stock:
          row['stock'] != null && row['stock'] !== ''
            ? Number(row['stock'])
            : null,
        productSizeId:
          row['productSizeId'] != null
            ? Number(row['productSizeId'])
            : row['product_size_id'] != null
              ? Number(row['product_size_id'])
              : null,
      };
    });
  }

  getSizeTypes(): Observable<SizeTypeOption[]> {
    return this.api.get<SizeTypeOption[]>('size-types');
  }

  /** Catálogo global de tallas filtradas por tipo (independiente del producto). */
  getSizesBySizeType(sizeTypeId: number, limit = 100): Observable<Size[]> {
    return this.api
      .get<SizeListResponse>(
        `sizes?limit=${limit}&page=1&sizeTypeId=${sizeTypeId}`,
      )
      .pipe(map(res => res.data ?? []));
  }

  /** Búsqueda de proveedores sin mutar el estado global de `VendorsService`. */
  searchVendors(term: string, limit = 15): Observable<Vendor[]> {
    const q = encodeURIComponent(term.trim());
    return this.api
      .get<VendorListResponse>(`vendors?limit=${limit}&page=1&search=${q}`)
      .pipe(map(res => res.data ?? []));
  }

  /**
   * Catálogo global de colores (GET `/colors` paginado, `limit` por defecto 10 en backend).
   * Concatena todas las páginas para armar el listado completo (p. ej. 70+ colores).
   */
  getColorsCatalogAll(pageSize = 80): Observable<ProductColorOption[]> {
    const url = (page: number) => `colors?limit=${pageSize}&page=${page}`;
    return this.api
      .get<{
        data?: unknown[];
        paginate?: { total?: number; pages?: number };
      }>(url(1))
      .pipe(
        switchMap(first => {
          const rows = first.data ?? [];
          const total = Number(first.paginate?.total);
          const explicitPages = Number(first.paginate?.pages);
          let pages =
            Number.isFinite(explicitPages) && explicitPages > 0
              ? explicitPages
              : 0;
          if (
            pages < 1 &&
            Number.isFinite(total) &&
            total > 0 &&
            pageSize > 0
          ) {
            pages = Math.ceil(total / pageSize);
          }
          if (pages < 1) {
            pages = 1;
          }
          pages = Math.min(pages, 80);
          if (pages <= 1) {
            return of(this.normalizeCatalogColorRows(rows));
          }
          const restCalls: Observable<{ data?: unknown[] }>[] = [];
          for (let p = 2; p <= pages; p++) {
            restCalls.push(this.api.get<{ data?: unknown[] }>(url(p)));
          }
          return forkJoin(restCalls).pipe(
            map(restResponses => {
              const merged = [
                ...this.normalizeCatalogColorRows(rows),
                ...restResponses.flatMap(r =>
                  this.normalizeCatalogColorRows(r.data),
                ),
              ];
              const byId = new Map<number, ProductColorOption>();
              for (const c of merged) {
                if (c.id > 0) {
                  byId.set(c.id, c);
                }
              }
              return Array.from(byId.values()).sort((a, b) =>
                a.description.localeCompare(b.description, 'es', {
                  sensitivity: 'base',
                }),
              );
            }),
          );
        }),
      );
  }

  private normalizeCatalogColorRows(
    raw: unknown[] | undefined,
  ): ProductColorOption[] {
    if (!Array.isArray(raw)) {
      return [];
    }
    return raw.map(r => {
      const row = r as Record<string, unknown>;
      return {
        id: Number(row['id']) || 0,
        description: String(row['description'] ?? ''),
        hash: (row['hash'] as string | null) ?? null,
        isExists: false,
        stock: null,
        productSizeId: null,
      } satisfies ProductColorOption;
    });
  }

  /** Crea proveedor solo con nombre (dirección/teléfono se completan después en directorio). */
  createVendorMinimal(name: string): Observable<Vendor> {
    const body = { name: name.trim() };
    return this.api
      .post<Record<string, unknown>>('vendors', body)
      .pipe(map(raw => this.normalizeVendorRow(raw)));
  }

  /**
   * Si ya existe un proveedor con el mismo nombre (insensible a mayúsculas), devuelve ese;
   * si no, lo crea.
   */
  resolveOrCreateVendor(name: string): Observable<Vendor> {
    const trimmed = name.trim();
    return this.searchVendors(trimmed, 25).pipe(
      switchMap(rows => {
        const exact = rows.find(
          r => (r.name ?? '').trim().toLowerCase() === trimmed.toLowerCase(),
        );
        if (exact) {
          return of(exact);
        }
        return this.createVendorMinimal(trimmed);
      }),
    );
  }

  private normalizeVendorRow(raw: Record<string, unknown>): Vendor {
    return new Vendor({
      id: Number(raw['id']) || 0,
      name: String(raw['name'] ?? ''),
      address: raw['address'] != null ? String(raw['address']) : undefined,
      local: raw['local'] != null ? String(raw['local']) : undefined,
      phone: raw['phone'] != null ? String(raw['phone']) : undefined,
    });
  }
}
