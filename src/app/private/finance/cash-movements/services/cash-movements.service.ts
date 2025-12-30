import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { ApiService } from '../../../../services/api.service'; // Ajusta la ruta a tu ApiService

@Injectable({ providedIn: 'root' })
export class CashflowService {
  private apiService = inject(ApiService);
  private apiUrl = 'cash-flow'; // Base URL del módulo

  // --- STATE MANAGEMENT (Como ColorsService) ---
  // Guardamos el estado del reporte actual en un BehaviorSubject
  private reportSubject = new BehaviorSubject<any>({
    lists: { sales: [], incomes: [], expenses: [] },
    summary: { opening_balance: 100, final_balance: 0 },
  });

  // Exponemos el Observable para que el componente se suscriba
  report$ = this.reportSubject.asObservable();

  constructor() {}

  /**
   * Carga el reporte desde la API y actualiza el Subject local.
   * El componente reaccionará automáticamente a este cambio.
   */
  loadDailyReport(date: string): Observable<void> {
    const url = `${this.apiUrl}/daily?date=${date}`;

    return this.apiService.get<any>(url).pipe(
      map(response => {
        if (response.success) {
          // Actualizamos el estado interno
          this.updateReport(response.data);
        }
      }),
    );
  }

  /**
   * Obtiene el Observable del reporte actual
   */
  getReport(): Observable<any> {
    return this.report$;
  }

  /**
   * Registra movimiento y REFRESCA automáticamente el reporte
   * usando switchMap (Patrón Reactivo)
   */
  registerMovement(
    movement: { type: string; amount: number; description: string },
    currentDate: string,
  ): Observable<void> {
    return this.apiService.post(this.apiUrl, movement).pipe(
      // Después de guardar con éxito, recargamos los datos inmediatamente
      switchMap(() => this.loadDailyReport(currentDate)),
    );
  }

  // Helper para actualizar el BehaviorSubject
  private updateReport(data: any): void {
    this.reportSubject.next(data);
  }
}
