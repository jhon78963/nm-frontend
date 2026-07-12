import { computed, Injectable, inject, signal } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { ApiService } from '../../../../services/api.service';
import type {
  MonthEndTransferPayload,
  MonthEndTransferPreview,
  MonthEndTransferRecord,
} from '../models/month-end-transfer.model';

export interface AccumulatedExpensesSnapshot {
  month: string;
  expenses: any[];
  total: number;
}

type SummaryMovementCategory =
  | string
  | {
      id?: number;
      name: string;
    };

export interface SummaryMovementInput {
  type: 'INGRESO' | 'GASTO' | string;
  amount: number;
  category?: SummaryMovementCategory;
  description?: string;
  date?: string;
}

interface CashflowStorePayload {
  type: 'INCOME' | 'EXPENSE';
  category: 'STORE' | 'ADMINISTRATIVE' | 'ACCUMULATED';
  amount: number;
  description: string;
  date: string;
  payment_method: string;
}

@Injectable({ providedIn: 'root' })
export class CashflowService {
  private apiService = inject(ApiService);
  private apiUrl = 'cash-flow';

  // --- STATE 1: Reporte Diario de Tienda ---
  private reportSubject = new BehaviorSubject<any>({
    lists: { sales: [], incomes: [], expenses: [] },
    summary: { opening_balance: 100, final_balance: 0 },
  });
  report$ = this.reportSubject.asObservable();

  // --- STATE 2: Gastos Administrativos Mensuales ---
  private adminExpensesSubject = new BehaviorSubject<any[]>([]);
  adminExpenses$ = this.adminExpensesSubject.asObservable();

  // --- STATE 3: Egresos Cuenta Acumulada ---
  private accumulatedExpensesSubject = new BehaviorSubject<any[]>([]);
  accumulatedExpenses$ = this.accumulatedExpensesSubject.asObservable();

  private readonly accumulatedExpensesSnapshot = signal<AccumulatedExpensesSnapshot>(
    { month: '', expenses: [], total: 0 },
  );

  /** Egresos del mes cargado (reactivo vía Signals). */
  readonly accumulatedExpenses = computed(
    () => this.accumulatedExpensesSnapshot().expenses,
  );

  readonly accumulatedExpensesTotal = computed(
    () => this.accumulatedExpensesSnapshot().total,
  );

  readonly accumulatedExpensesMonth = computed(
    () => this.accumulatedExpensesSnapshot().month,
  );

  constructor() {}

  // --- MÉTODOS DE TIENDA (DIARIO) ---
  loadDailyReport(date: string, filters: string[] = []): Observable<void> {
    const activeFilters =
      filters.length > 0 ? filters : ['CASH', 'YAPE', 'CARD'];
    const filterParams = activeFilters.map(f => `filters[]=${f}`).join('&');
    const url = `${this.apiUrl}/daily?date=${date}&${filterParams}`;

    return this.apiService.get<any>(url).pipe(
      map(response => {
        if (response && response.data) {
          this.reportSubject.next(response.data);
        }
      }),
    );
  }

  // --- MÉTODOS ADMINISTRATIVOS (MENSUAL) ---
  loadMonthlyAdminExpenses(month: string): Observable<any[]> {
    const url = `${this.apiUrl}/admin/monthly?month=${month}`;
    return this.apiService.get<any>(url).pipe(
      map(response => {
        if (!response?.success) {
          return [];
        }
        return response.data?.expenses ?? [];
      }),
      tap(expenses => this.adminExpensesSubject.next(expenses)),
    );
  }

  loadMonthlyAccumulatedExpenses(
    month: string,
  ): Observable<{ expenses: any[]; total: number }> {
    const url = `${this.apiUrl}/accumulated/monthly?month=${month}`;
    return this.apiService.get<any>(url).pipe(
      map(response => {
        if (!response?.success) {
          return { expenses: [], total: 0 };
        }
        return {
          expenses: response.data?.expenses ?? [],
          total: response.data?.total_monthly_accumulated ?? 0,
        };
      }),
      tap(result => this.publishAccumulatedExpenses(month, result)),
    );
  }

  /**
   * Refresca el historial de egresos de la Cuenta Acumulada para el mes de una compra.
   * Llamar tras registrar compra para que la vista de egresos refleje el movimiento al navegar.
   */
  refreshAccumulatedExpensesForPurchaseDate(
    date: Date | string,
  ): Observable<AccumulatedExpensesSnapshot> {
    const month = this.resolveYearMonth(date);
    return this.loadMonthlyAccumulatedExpenses(month).pipe(
      map(result => ({
        month,
        expenses: result.expenses,
        total: result.total,
      })),
    );
  }

  private publishAccumulatedExpenses(
    month: string,
    result: { expenses: any[]; total: number },
  ): void {
    this.accumulatedExpensesSubject.next(result.expenses);
    this.accumulatedExpensesSnapshot.set({
      month,
      expenses: result.expenses,
      total: result.total,
    });
  }

  private resolveYearMonth(date: Date | string): string {
    const parsed = date instanceof Date ? date : new Date(date);
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  registerSummaryMovement(
    movement: SummaryMovementInput,
  ): Observable<{ success: boolean; data?: unknown }> {
    const payload = this.mapSummaryMovementToApiPayload(movement);
    return this.apiService.post(this.apiUrl, payload);
  }

  private mapSummaryMovementToApiPayload(
    movement: SummaryMovementInput,
  ): CashflowStorePayload {
    const type =
      movement.type === 'INGRESO' || movement.type === 'INCOME'
        ? 'INCOME'
        : 'EXPENSE';

    const categoryLabel = this.resolveSummaryCategoryLabel(movement.category);

    return {
      type,
      category: this.resolveSummaryCashflowCategory(movement.category),
      amount: movement.amount,
      description: movement.description?.trim() || categoryLabel,
      date: movement.date ?? this.todayIsoDate(),
      payment_method: 'CASH',
    };
  }

  private resolveSummaryCategoryLabel(
    category: SummaryMovementCategory | undefined,
  ): string {
    if (!category) {
      return 'Movimiento manual';
    }

    if (typeof category === 'string') {
      return category.trim() || 'Movimiento manual';
    }

    return category.name?.trim() || 'Movimiento manual';
  }

  private resolveSummaryCashflowCategory(
    category: SummaryMovementCategory | undefined,
  ): 'STORE' | 'ADMINISTRATIVE' {
    if (typeof category === 'string') {
      const normalized = category.trim().toUpperCase();
      if (normalized === 'ADMINISTRATIVE' || normalized === 'ADMINISTRATIVO') {
        return 'ADMINISTRATIVE';
      }
      if (normalized === 'STORE' || normalized === 'TIENDA') {
        return 'STORE';
      }
    }

    // Movimientos rápidos del resumen financiero operan sobre caja de tienda.
    return 'STORE';
  }

  private todayIsoDate(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Registra movimiento y refresca la vista correspondiente
   */
  registerMovement(
    data: any,
    files: File[] | File | null,
    currentDate: string, // 'yyyy-MM-dd' para tienda o 'yyyy-MM' para admin
  ): Observable<any[] | void> {
    const formData = new FormData();
    formData.append('type', data.type);
    formData.append('category', data.category);
    formData.append('amount', data.amount.toString());
    formData.append('description', data.description);
    formData.append('date', data.date);
    if (data.accounting_month) {
      formData.append('accounting_month', data.accounting_month);
    }
    if (data.payroll_period) {
      formData.append('payroll_period', data.payroll_period);
    }
    formData.append('payment_method', data.payment_method);

    const fileArray = files instanceof File ? [files] : (files ?? []);
    fileArray.forEach(f => formData.append('images[]', f));

    return this.apiService.post(this.apiUrl, formData).pipe(
      switchMap(() => {
        if (data.category === 'ADMINISTRATIVE') {
          const month = currentDate.substring(0, 7);
          return this.loadMonthlyAdminExpenses(month);
        }
        if (data.category === 'ACCUMULATED') {
          const month = currentDate.substring(0, 7);
          return this.loadMonthlyAccumulatedExpenses(month).pipe(
            map(() => undefined),
          );
        }
        return this.loadDailyReport(currentDate);
      }),
    );
  }

  updateMovement(
    id: number,
    data: any,
    files: File[] | File | null,
    currentDate: string,
    category: 'ADMINISTRATIVE' | 'ACCUMULATED' | 'STORE' = 'ADMINISTRATIVE',
  ): Observable<any[] | void> {
    const formData = new FormData();

    // Spoofing de método para que Laravel acepte archivos en PUT
    formData.append('_method', 'PUT');

    formData.append('type', data.type);
    formData.append('category', data.category);
    formData.append('amount', data.amount.toString());
    formData.append('description', data.description);
    formData.append('date', data.date);
    if (data.accounting_month) {
      formData.append('accounting_month', data.accounting_month);
    }
    if (data.payroll_period) {
      formData.append('payroll_period', data.payroll_period);
    }
    formData.append('payment_method', data.payment_method);

    const fileArray = files instanceof File ? [files] : (files ?? []);
    fileArray.forEach(f => formData.append('images[]', f));

    return this.apiService.post(`${this.apiUrl}/${id}`, formData).pipe(
      switchMap(() => {
        const resolvedCategory = data.category ?? category;

        if (resolvedCategory === 'STORE') {
          return this.loadDailyReport(currentDate);
        }

        const month = currentDate.substring(0, 7);
        if (resolvedCategory === 'ACCUMULATED') {
          return this.loadMonthlyAccumulatedExpenses(month).pipe(
            map(() => undefined),
          );
        }
        return this.loadMonthlyAdminExpenses(month);
      }),
    );
  }

  deleteMovement(
    id: number,
    currentDate: string,
    category: 'ADMINISTRATIVE' | 'ACCUMULATED' | 'STORE' = 'ADMINISTRATIVE',
  ): Observable<any[] | void> {
    return this.apiService.delete(`${this.apiUrl}/${id}`).pipe(
      switchMap(() => {
        if (category === 'STORE') {
          return this.loadDailyReport(currentDate);
        }

        const month = currentDate.substring(0, 7);
        if (category === 'ACCUMULATED') {
          return this.loadMonthlyAccumulatedExpenses(month).pipe(
            map(() => undefined),
          );
        }
        return this.loadMonthlyAdminExpenses(month);
      }),
    );
  }

  // Getters para los observables
  getReport() {
    return this.report$;
  }
  getAdminExpenses() {
    return this.adminExpenses$;
  }

  getAccumulatedExpenses() {
    return this.accumulatedExpenses$;
  }

  getVoucherPreview(voucherPath: string): Observable<Blob> {
    const params = new HttpParams().set('path', voucherPath);

    return this.apiService
      .getBlob(`${this.apiUrl}/vouchers/preview`, {
        params,
      })
      .pipe(map(blob => this.ensureVoucherBlobType(blob, voucherPath)));
  }

  /**
   * CORS cross-origin (adm → api) no expone Content-Type de PDF/imagen al JS;
   * el blob queda sin MIME y el iframe/img no renderiza sin este ajuste.
   */
  private ensureVoucherBlobType(blob: Blob, voucherPath: string): Blob {
    const mimeType = this.mimeTypeFromVoucherPath(voucherPath);
    if (!mimeType || blob.type === mimeType) {
      return blob;
    }

    return new Blob([blob], { type: mimeType });
  }

  private mimeTypeFromVoucherPath(path: string): string | null {
    const lower = path.trim().toLowerCase();
    if (lower.endsWith('.pdf')) {
      return 'application/pdf';
    }
    if (lower.endsWith('.png')) {
      return 'image/png';
    }
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) {
      return 'image/jpeg';
    }
    if (lower.endsWith('.webp')) {
      return 'image/webp';
    }

    return null;
  }

  loadAccumulatedAccountSettings(): Observable<{
    cash_balance: number;
    digital_balance: number;
    initial_cash: number;
    initial_digital: number;
    is_initialized: boolean;
    tracking_start_month: string | null;
    current_cash: number;
    current_digital: number;
    current_total: number;
  }> {
    return this.apiService.get<any>('accumulated-account/settings').pipe(
      map(
        response =>
          response?.data ?? {
            cash_balance: 0,
            digital_balance: 0,
            initial_cash: 0,
            initial_digital: 0,
            is_initialized: false,
            tracking_start_month: null,
            current_cash: 0,
            current_digital: 0,
            current_total: 0,
          },
      ),
    );
  }

  initializeAccumulatedAccountSettings(data: {
    initial_cash: number;
    initial_digital: number;
    tracking_start_month: string;
  }): Observable<any> {
    return this.apiService.post('accumulated-account/initialize', data);
  }

  updateAccumulatedAccountSettings(data: {
    cash_balance: number;
    digital_balance: number;
    tracking_start_month: string | null;
  }): Observable<any> {
    return this.apiService.put('accumulated-account/settings', data);
  }

  loadMonthEndTransferPreview(
    month: string,
  ): Observable<MonthEndTransferPreview> {
    return this.apiService
      .get<any>(`accumulated-account/month-end-transfer/preview?month=${month}`)
      .pipe(map(response => this.normalizeTransferPreview(response?.data)));
  }

  listMonthEndTransfers(
    month?: string,
    limit = 12,
  ): Observable<MonthEndTransferRecord[]> {
    let url = `accumulated-account/month-end-transfers?limit=${limit}`;
    if (month) {
      url += `&month=${encodeURIComponent(month)}`;
    }
    return this.apiService.get<any>(url).pipe(
      map(response =>
        (response?.data ?? []).map((row: Record<string, unknown>) =>
          this.normalizeTransferRecord(row),
        ),
      ),
    );
  }

  recordMonthEndTransfer(payload: MonthEndTransferPayload): Observable<{
    preview: MonthEndTransferPreview;
    settings: {
      cash_balance: number;
      digital_balance: number;
      current_cash: number;
      current_digital: number;
      current_total: number;
    };
  }> {
    return this.apiService
      .post<any>('accumulated-account/month-end-transfer', payload)
      .pipe(
        map(response => ({
          preview: this.normalizeTransferPreview(response?.data?.preview),
          settings: response?.data?.settings ?? {},
        })),
      );
  }

  private normalizeTransferPreview(data: Record<string, unknown> | null | undefined): MonthEndTransferPreview {
    const operational = (data?.['operational'] as Record<string, number>) ?? {};
    const suggested = (data?.['suggested'] as Record<string, number>) ?? {};
    const balances = (data?.['balances'] as Record<string, Record<string, number>>) ?? {};
    const current = balances['current'] ?? {};
    const afterSuggested = balances['after_suggested'] ?? balances['afterSuggested'] ?? {};

    return {
      month: String(data?.['month'] ?? ''),
      monthLabel: String(data?.['month_label'] ?? data?.['monthLabel'] ?? ''),
      operational: {
        cash: Number(operational['cash'] ?? 0),
        digital: Number(operational['digital'] ?? 0),
        total: Number(operational['total'] ?? 0),
      },
      suggested: {
        cash: Number(suggested['cash'] ?? 0),
        digital: Number(suggested['digital'] ?? 0),
        total: Number(suggested['total'] ?? 0),
      },
      alreadyTransferred: Boolean(data?.['already_transferred'] ?? data?.['alreadyTransferred']),
      existingTransfer: data?.['existing_transfer'] ?? data?.['existingTransfer']
        ? this.normalizeTransferRecord(
            (data?.['existing_transfer'] ?? data?.['existingTransfer']) as Record<string, unknown>,
          )
        : null,
      balances: {
        current: {
          cash: Number(current['cash'] ?? 0),
          digital: Number(current['digital'] ?? 0),
          total: Number(current['total'] ?? 0),
        },
        afterSuggested: {
          cash: Number(afterSuggested['cash'] ?? 0),
          digital: Number(afterSuggested['digital'] ?? 0),
          total: Number(afterSuggested['total'] ?? 0),
        },
      },
    };
  }

  private normalizeTransferRecord(row: Record<string, unknown>): MonthEndTransferRecord {
    return {
      id: Number(row['id'] ?? 0),
      transferMonth: String(row['transferMonth'] ?? row['transfer_month'] ?? ''),
      monthLabel: String(row['monthLabel'] ?? row['month_label'] ?? ''),
      cashAmount: Number(row['cashAmount'] ?? row['cash_amount'] ?? 0),
      digitalAmount: Number(row['digitalAmount'] ?? row['digital_amount'] ?? 0),
      totalAmount: Number(row['totalAmount'] ?? row['total_amount'] ?? 0),
      operationalCashSnapshot: Number(
        row['operationalCashSnapshot'] ?? row['operational_cash_snapshot'] ?? 0,
      ),
      operationalDigitalSnapshot: Number(
        row['operationalDigitalSnapshot'] ?? row['operational_digital_snapshot'] ?? 0,
      ),
      note: (row['note'] as string | null) ?? null,
      createdAt: (row['createdAt'] as string | null) ?? (row['created_at'] as string | null) ?? null,
    };
  }
}
