import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../services/api.service';

export type PayrollPeriod = 'full' | 'q1' | 'q2';

export interface PayrollTardanza {
  days: number;
  hours: number;
  minutes: number;
}

export interface PayrollAttendanceSlice {
  falta: number;
  valdeo: number;
  recuperacion: number;
  faltasEquivalentes: number;
  faltasADescontar: number;
  descuentoPorFaltas: number;
  tardanzaTotalMinutes: number;
  tardanza: PayrollTardanza;
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
