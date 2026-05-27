import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../services/api.service';

export type PayrollPeriod = 'full' | 'q1' | 'q2';

export interface PayrollTardanza {
  days: number;
  hours: number;
  minutes: number;
}

export type SaldoSentido = 'favor' | 'debe' | 'cero';

export interface PayrollDeudaDia {
  date: string;
  status: string;
  checkIn: string | null;
  checkOut: string | null;
  deudaEntradaTardeMinutos: number;
  deudaSalidaAnticipadaMinutos: number;
  favorLlegadaTempranaMinutos: number;
  favorSalidaTardeMinutos: number;
  saldoNetoMinutos: number;
  saldoNetoSentido: SaldoSentido;
}

export interface PayrollAttendanceSlice {
  falta: number;
  valdeo: number;
  recuperacion: number;
  faltasEquivalentes: number;
  faltasADescontar: number;
  /** Solo Falta/Valdeo netos (días × valor día). */
  descuentoPorAusencias: number;
  /** Prorrateo (min. de deuda tiempo ÷ 690 min de jornada) × valor día. */
  descuentoPorTiempoNoCumplido: number;
  /** Ausencias + tiempo no cumplido (total que resta del pago). */
  descuentoPorFaltas: number;
  /** Días con retraso a entrada después de la tolerancia. */
  diasConRetraso: number;
  /** Retraso respecto a las 8:11 (tras 10 min de tolerancia desde las 8:00). */
  deudaEntradaTardeMinutos: number;
  /** Tiempo no cumplido por salir antes de las 19:30 (cierre oficial). */
  deudaSalidaAnticipadaMinutos: number;
  /** Retraso entrada + salida anticipada (debe bruto). */
  deudaTiempoTotalMinutos: number;
  /** Minutos de llegada antes de las 8:00. */
  favorLlegadaTempranaTotalMinutos: number;
  /** Minutos de salida después de las 19:30. */
  favorSalidaTardeTotalMinutos: number;
  favorTiempoTotalMinutos: number;
  /** Positivo: a favor del colaborador; negativo: neto a deber. */
  saldoTiempoNetoMinutos: number;
  saldoTiempoNetoSentido: SaldoSentido;
  saldoTiempoNetoMagnitud: PayrollTardanza;
  deudaEntradaTarde: PayrollTardanza;
  deudaSalidaAnticipada: PayrollTardanza;
  deudaTiempo: PayrollTardanza;
  favorLlegadaTemprana: PayrollTardanza;
  favorSalidaTarde: PayrollTardanza;
  deudaPorDia: PayrollDeudaDia[];
}

export interface PayrollMovements {
  advances: number;
  payments: number;
  deductions: number;
}

export interface PayrollPaymentItem {
  id: number;
  type: 'PAYMENT' | 'ADVANCE' | 'DEDUCTION';
  typeLabel: string;
  amount: number;
  date: string;
  description: string | null;
  syncedToAdmin: boolean;
  cashMovementId: number | null;
  paymentMethod: string | null;
  voucherPath: string | null;
  adminExpenseDescription: string | null;
}

export interface PayrollEstimates {
  salarioBase: number;
  descuentoAsistenciaMesCompleto: number;
  salarioTrasDescuentoFaltas: number;
  estimadoAPagarFinMes: number;
  nota: string;
}

export interface PayrollLiquidacionPeriodo {
  period: PayrollPeriod;
  diasEnPeriodo: number;
  proporcionSalarioPeriodo: number;
  descuentoAsistenciaEnAmbito: number;
  descuentoPorAusenciasEnAmbito?: number;
  descuentoPorTiempoNoCumplidoEnAmbito?: number;
  netoTrasFaltasPeriodo: number;
  adelantosPeriodo: number;
  pagosRegistradosPeriodo: number;
  descuentosManualesPeriodo: number;
  totalMovimientosSalida: number;
  restanteEstimadoAlCierre: number;
  fechaCierreLegible: string;
}

export interface PayrollData {
  team: {
    id: number;
    name: string;
    surname: string;
    dni: string;
    salary: number;
  };
  calendar: {
    month: number;
    year: number;
    daysInMonth: number;
    period: PayrollPeriod;
    periodLabel: string;
  };
  rates: {
    dailyRate: number;
    halfMonthReference: number;
  };
  attendanceVista: PayrollAttendanceSlice;
  attendanceMesCompleto: PayrollAttendanceSlice;
  movementsMonth: PayrollMovements;
  movementsQuincena1: PayrollMovements;
  movementsQuincena2: PayrollMovements;
  movementsVistaPeriodo: PayrollMovements;
  paymentItems: PayrollPaymentItem[];
  estimates: PayrollEstimates;
  liquidacionPeriodo?: PayrollLiquidacionPeriodo;
}

export interface PayrollApiResponse {
  success: boolean;
  data: PayrollData;
}

@Injectable({ providedIn: 'root' })
export class TeamPayrollService {
  constructor(private readonly apiService: ApiService) {}

  getPayroll(
    teamId: number,
    month: number,
    year: number,
    period: PayrollPeriod,
  ): Observable<PayrollApiResponse> {
    const q = new URLSearchParams({
      team_id: String(teamId),
      month: String(month),
      year: String(year),
      period,
    });
    return this.apiService.get<PayrollApiResponse>(
      `payments/payroll?${q.toString()}`,
    );
  }

  registerPayment(payload: {
    teamId: number;
    type: 'PAYMENT' | 'ADVANCE' | 'DEDUCTION';
    amount: number;
    /** ISO date string for Laravel */
    date: string;
    description: string;
    payment_method: string;
    sync_cash_movement: boolean;
    image: File | null;
  }): Observable<{ message: string; data: unknown }> {
    const formData = new FormData();
    formData.append('team_id', String(payload.teamId));
    formData.append('type', payload.type);
    formData.append('amount', String(payload.amount));
    formData.append('date', payload.date);
    formData.append('description', payload.description ?? '');
    formData.append('payment_method', payload.payment_method);
    formData.append(
      'sync_cash_movement',
      payload.sync_cash_movement ? '1' : '0',
    );
    if (payload.image) {
      formData.append('image', payload.image);
    }
    return this.apiService.post<{ message: string; data: unknown }>(
      'payments',
      formData,
    );
  }
}
