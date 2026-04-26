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
  descuentoPorFaltas: number;
  /** Retraso respecto a las 8:00 (incluye ventana de tolerancia como minutos después de 8:00). */
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

export interface PayrollEstimates {
  salarioBase: number;
  descuentoAsistenciaMesCompleto: number;
  salarioTrasDescuentoFaltas: number;
  estimadoAPagarFinMes: number;
  nota: string;
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
  estimates: PayrollEstimates;
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
}
