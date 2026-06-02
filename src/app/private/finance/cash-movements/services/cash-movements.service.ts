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
  category: 'STORE' | 'ADMINISTRATIVE';
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
    formData.append('payment_method', data.payment_method);

    const fileArray = files instanceof File ? [files] : (files ?? []);
    fileArray.forEach(f => formData.append('images[]', f));

    return this.apiService.post(this.apiUrl, formData).pipe(
      switchMap(() => {
        // REFRESCO INTELIGENTE:
        // Si es administrativo, refresca la lista mensual, si no, la diaria.
        if (data.category === 'ADMINISTRATIVE') {
          const month = currentDate.substring(0, 7); // Extrae 'YYYY-MM'
          return this.loadMonthlyAdminExpenses(month);
        } else {
          return this.loadDailyReport(currentDate);
        }
      }),
    );
  }

  updateMovement(
    id: number,
    data: any,
    files: File[] | File | null,
    currentDate: string,
  ): Observable<any[]> {
    const formData = new FormData();

    // Spoofing de método para que Laravel acepte archivos en PUT
    formData.append('_method', 'PUT');

    formData.append('type', data.type);
    formData.append('category', data.category);
    formData.append('amount', data.amount.toString());
    formData.append('description', data.description);
    formData.append('date', data.date);
    formData.append('payment_method', data.payment_method);

    const fileArray = files instanceof File ? [files] : (files ?? []);
    fileArray.forEach(f => formData.append('images[]', f));

    return this.apiService
      .post(`${this.apiUrl}/${id}`, formData) // Laravel recibirá esto como PUT /{id}
      .pipe(
        switchMap(() => {
          const month = currentDate.substring(0, 7);
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

  getVoucherPreview(voucherPath: string): Observable<Blob> {
    const params = new HttpParams().set('path', voucherPath);

    return this.apiService.getBlob(`${this.apiUrl}/vouchers/preview`, {
      params,
    });
  }
}
