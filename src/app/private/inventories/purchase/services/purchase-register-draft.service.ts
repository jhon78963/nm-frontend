import { Injectable, signal } from '@angular/core';

/** Snapshot en RAM del formulario de registro de compras (solo sesión activa). */
export interface PurchaseRegisterDraftSnapshot {
  version: 2;
  header: Record<string, unknown>;
  /** Incluye `draftColorQueue[]` (FormArray serializado). */
  lineDraft: Record<string, unknown>;
  lines: Record<string, unknown>[];
  useExistingProduct: boolean;
  /** Solo el id; el producto completo se obtiene con `getOne` al rehidratar. */
  selectedProductId: number | null;
  activeNewProductTempId: string | null;
  isEditingLine: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class PurchaseRegisterDraftService {
  /** Borrador en memoria mientras la SPA permanece abierta (no persiste en el navegador). */
  readonly snapshot = signal<PurchaseRegisterDraftSnapshot | null>(null);

  read(): PurchaseRegisterDraftSnapshot | null {
    return this.snapshot();
  }

  save(draft: PurchaseRegisterDraftSnapshot): void {
    this.snapshot.set(draft);
  }

  clear(): void {
    this.snapshot.set(null);
  }
}
