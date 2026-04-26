import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { Subscription, finalize } from 'rxjs';
import { ITeam, Team } from '../../models/team.model';
import {
  PayrollData,
  PayrollPeriod,
  PayrollTardanza,
  TeamPayrollService,
} from '../../services/team-payroll.service';
import { TeamService } from '../../services/team.service';

/** Payload mínimo desde API (camelCase o mixto). */
interface ITeamLike {
  id?: number;
  dni?: string | number;
  name?: string;
  surname?: string;
  salary?: string | number | null;
  warehouseId?: number;
  warehouse_id?: number;
}

const MONTH_NAMES_ES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

@Component({
  selector: 'app-team-payroll',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CardModule,
    DividerModule,
    ProgressSpinnerModule,
    SelectButtonModule,
    TagModule,
    TableModule,
    ToastModule,
    TooltipModule,
  ],
  providers: [MessageService],
  templateUrl: './team-payroll.component.html',
  styleUrl: './team-payroll.component.scss',
})
export class TeamPayrollComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly teamService = inject(TeamService);
  private readonly payrollService = inject(TeamPayrollService);
  private readonly messageService = inject(MessageService);

  private routeSub?: Subscription;

  teamId = 0;
  team: Team | null = null;
  viewMonth = new Date().getMonth();
  viewYear = new Date().getFullYear();
  period: PayrollPeriod = 'full';
  loading = false;
  data: PayrollData | null = null;

  periodOptions = [
    { label: 'Mes completo', value: 'full' as PayrollPeriod },
    { label: '1.ª quincena (1–15)', value: 'q1' as PayrollPeriod },
    { label: '2.ª quincena (16–fin)', value: 'q2' as PayrollPeriod },
  ];

  ngOnInit(): void {
    this.routeSub = this.route.paramMap.subscribe(params => {
      const raw = params.get('teamId');
      const id = raw ? Number(raw) : 0;
      if (!id || Number.isNaN(id)) {
        this.messageService.add({
          severity: 'error',
          summary: 'Ruta inválida',
          detail: 'No se indicó un colaborador.',
        });
        return;
      }
      const changed = this.teamId !== id;
      this.teamId = id;
      if (changed) {
        const n = new Date();
        this.viewMonth = n.getMonth();
        this.viewYear = n.getFullYear();
        this.period = 'full';
      }
      this.loadTeam();
      this.loadPayroll();
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }

  get monthTitle(): string {
    return `${MONTH_NAMES_ES[this.viewMonth]} ${this.viewYear}`;
  }

  get vistaMovimientosCardTitle(): string {
    if (this.period === 'q1') {
      return 'Movimientos en 1.ª quincena';
    }
    if (this.period === 'q2') {
      return 'Movimientos en 2.ª quincena';
    }
    return 'Movimientos en el período seleccionado';
  }

  goBack(): void {
    void this.router.navigate(['/directory/team']);
  }

  goAttendance(): void {
    void this.router.navigate(['/directory/team/asistencia', this.teamId]);
  }

  prevMonth(): void {
    if (this.viewMonth === 0) {
      this.viewMonth = 11;
      this.viewYear--;
    } else {
      this.viewMonth--;
    }
    this.loadPayroll();
  }

  nextMonth(): void {
    if (this.viewMonth === 11) {
      this.viewMonth = 0;
      this.viewYear++;
    } else {
      this.viewMonth++;
    }
    this.loadPayroll();
  }

  onPeriodChange(): void {
    const v = this.period as string;
    this.period =
      v === 'q1' || v === 'q2' || v === 'full' ? (v as PayrollPeriod) : 'full';
    this.loadPayroll();
  }

  money(n: number | null | undefined): string {
    const x = Number(n ?? 0);
    return new Intl.NumberFormat('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(x);
  }

  splitTimeLabel(block: PayrollTardanza | null | undefined): string {
    if (!block) {
      return '—';
    }
    const { days, hours, minutes } = block;
    const parts: string[] = [];
    if (days > 0) {
      parts.push(`${days} día${days === 1 ? '' : 's'}`);
    }
    if (hours > 0) {
      parts.push(`${hours} h`);
    }
    if (minutes > 0) {
      parts.push(`${minutes} min`);
    }
    if (parts.length === 0) {
      return '0 min';
    }
    return parts.join(' · ');
  }

  formatFechaCorta(ymd: string): string {
    const p = ymd.split('-').map(Number);
    if (p.length !== 3 || p.some(n => Number.isNaN(n))) {
      return ymd;
    }
    const [y, m, d] = p;
    const dt = new Date(y, m - 1, d);
    return dt.toLocaleDateString('es-PE', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  }

  minutosOGuion(n: number): string {
    return n > 0 ? `${n} min` : '—';
  }

  statusTagSeverity(
    status: string,
  ): 'success' | 'info' | 'warning' | 'danger' | 'secondary' | 'contrast' {
    const map: Record<
      string,
      'success' | 'info' | 'warning' | 'danger' | 'secondary'
    > = {
      PUNTUAL: 'success',
      TARDE: 'warning',
      TOLERANCIA: 'info',
      RECUPERACION: 'secondary',
    };
    return map[status] ?? 'secondary';
  }

  private loadTeam(): void {
    this.teamService.getOne(this.teamId).subscribe({
      next: (t: Team | ITeamLike) => {
        this.team = new Team(this.normalizeTeamPayload(t));
      },
      error: () => {
        this.messageService.add({
          severity: 'warn',
          summary: 'Colaborador',
          detail: 'No se pudo cargar el perfil.',
        });
      },
    });
  }

  private normalizeTeamPayload(t: Team | ITeamLike): ITeam {
    const o = t as Record<string, unknown>;
    return {
      id: Number(o['id']),
      dni: (o['dni'] as string | number) ?? '',
      name: String(o['name'] ?? ''),
      surname: String(o['surname'] ?? ''),
      salary: (o['salary'] as string | number | null) ?? null,
      warehouseId: Number(o['warehouseId'] ?? o['warehouse_id'] ?? 0),
      userId: (o['userId'] ?? o['user_id']) as number | null | undefined,
      userEmail: (o['userEmail'] ?? o['user_email']) as string | null | undefined,
    };
  }

  private loadPayroll(): void {
    this.loading = true;
    this.payrollService
      .getPayroll(this.teamId, this.viewMonth + 1, this.viewYear, this.period)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: res => {
          if (res?.success && res.data) {
            this.data = res.data;
          } else {
            this.data = null;
            this.messageService.add({
              severity: 'warn',
              summary: 'Pagos',
              detail: 'Respuesta sin datos.',
            });
          }
        },
        error: err => {
          console.error(err);
          this.data = null;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo cargar la vista de pagos.',
          });
        },
      });
  }
}
