import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { ApiService } from '../../../../services/api.service';

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
      tap(result => this.accumulatedExpensesSubject.next(result.expenses)),
    );
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
    category: 'ADMINISTRATIVE' | 'ACCUMULATED' = 'ADMINISTRATIVE',
  ): Observable<any[]> {
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
        const month = currentDate.substring(0, 7);
        if (category === 'ACCUMULATED') {
          return this.loadMonthlyAccumulatedExpenses(month).pipe(
            map(result => result.expenses),
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

    return this.apiService.getBlob(`${this.apiUrl}/vouchers/preview`, {
      params,
    });
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
}
