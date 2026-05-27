import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { DividerModule } from 'primeng/divider';
import { DropdownModule } from 'primeng/dropdown';
import { FileUploadModule } from 'primeng/fileupload';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { Subscription, finalize } from 'rxjs';
import { SafeUrlPipe } from '../../../../finance/cash-movements/pipes/safe-url.pipe';
import { CashflowService } from '../../../../finance/cash-movements/services/cash-movements.service';
import { ITeam, Team } from '../../models/team.model';
import {
  PayrollAttendanceSlice,
  PayrollData,
  PayrollDeudaDia,
  PayrollPaymentItem,
  PayrollPeriod,
  PayrollTardanza,
  SaldoSentido,
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
    CalendarModule,
    CardModule,
    CheckboxModule,
    DividerModule,
    DropdownModule,
    FileUploadModule,
    InputNumberModule,
    InputTextModule,
    InputTextareaModule,
    ProgressSpinnerModule,
    SelectButtonModule,
    TagModule,
    TableModule,
    ToastModule,
    TooltipModule,
    DialogModule,
    SafeUrlPipe,
  ],
  providers: [MessageService, DatePipe],
  templateUrl: './team-payroll.component.html',
  styleUrl: './team-payroll.component.scss',
})
export class TeamPayrollComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly teamService = inject(TeamService);
  private readonly payrollService = inject(TeamPayrollService);
  private readonly cashflowService = inject(CashflowService);
  private readonly messageService = inject(MessageService);
  private readonly datePipe = inject(DatePipe);

  displayPreview = signal(false);
  previewUrl = signal('');
  isPdf = signal(false);
  previewLoading = signal(false);
  private previewObjectUrl: string | null = null;

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
    { label: '1.ª quincena (1-15)', value: 'q1' as PayrollPeriod },
    { label: '2.ª quincena (16-fin)', value: 'q2' as PayrollPeriod },
  ];

  /** Registro de movimiento de nómina (team_payments + opcional caja admin). */
  savingPayment = false;
  paymentForm = {
    type: 'PAYMENT' as 'PAYMENT' | 'ADVANCE' | 'DEDUCTION',
    amount: null as number | null,
    date: new Date(),
    description: '',
    payment_method: 'CASH',
    sync_cash_movement: true,
  };
  paymentVoucherFile: File | null = null;

  paymentTypeOptions = [
    {
      label: 'Pago quincenal (cierre)',
      value: 'PAYMENT' as const,
    },
    { label: 'Adelanto', value: 'ADVANCE' as const },
    { label: 'Descuento manual', value: 'DEDUCTION' as const },
  ];

  paymentMethodOptions = [
    { label: 'Efectivo', value: 'CASH' },
    { label: 'Yape/Plin', value: 'YAPE' },
    { label: 'Tarjeta', value: 'CARD' },
    { label: 'Transferencia', value: 'TRANSFER' },
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
    this.revokePreviewUrl();
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

  get heroTitle(): string {
    const liq = this.data?.liquidacionPeriodo;
    if (!liq) {
      return 'Restante estimado · fin de mes';
    }
    if (liq.period === 'full') {
      return 'Restante estimado · cierre de mes';
    }
    return `Restante estimado · cierre ${liq.fechaCierreLegible}`;
  }

  get heroAmount(): number {
    const liq = this.data?.liquidacionPeriodo?.restanteEstimadoAlCierre;
    if (liq !== undefined && liq !== null) {
      return liq;
    }
    return this.data?.estimates.estimadoAPagarFinMes ?? 0;
  }

  get heroBreakdownLines(): string[] {
    const liq = this.data?.liquidacionPeriodo;
    const att = this.data?.attendanceVista;
    if (!liq || !att) {
      return [];
    }
    const descAus =
      liq.descuentoPorAusenciasEnAmbito ?? att.descuentoPorAusencias ?? 0;
    const descTiempo =
      liq.descuentoPorTiempoNoCumplidoEnAmbito ??
      att.descuentoPorTiempoNoCumplido ??
      0;
    const p = liq.period;
    const baseLine =
      p === 'q1' || p === 'q2'
        ? `Base quincenal fija (50 % del salario): S/ ${this.money(liq.proporcionSalarioPeriodo)}`
        : `Base mes completo (100 % del salario): S/ ${this.money(liq.proporcionSalarioPeriodo)}`;
    const tiempoLine = `Descuento por tiempo no cumplido ((min. de deuda ÷ 690) × valor día): − S/ ${this.money(
      descTiempo,
    )}`;
    return [
      baseLine,
      `Descuento por ausencias (Falta/Valdeo): − S/ ${this.money(descAus)}`,
      tiempoLine,
      `Tras descuentos de asistencia: S/ ${this.money(liq.netoTrasFaltasPeriodo)}`,
      `Movimientos del período (adelantos · pagos · desc. manual): − S/ ${this.money(
        liq.adelantosPeriodo +
          liq.pagosRegistradosPeriodo +
          liq.descuentosManualesPeriodo,
      )}`,
    ];
  }

  onPaymentTypeChange(): void {
    if (this.paymentForm.type === 'DEDUCTION') {
      this.paymentForm.sync_cash_movement = false;
    } else {
      this.paymentForm.sync_cash_movement = true;
    }
  }

  onVoucherSelect(event: { files: File[] }): void {
    this.paymentVoucherFile = event.files?.[0] ?? null;
  }

  clearVoucher(upload: { clear: () => void }): void {
    this.paymentVoucherFile = null;
    upload.clear();
  }

  submitPayment(voucherUpload: { clear: () => void }): void {
    if (
      !this.teamId ||
      !this.paymentForm.amount ||
      this.paymentForm.amount <= 0
    ) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Datos incompletos',
        detail: 'Indica un monto válido.',
      });
      return;
    }
    const dateStr = this.datePipe.transform(
      this.paymentForm.date,
      'yyyy-MM-dd HH:mm:ss',
    )!;
    this.savingPayment = true;
    this.payrollService
      .registerPayment({
        teamId: this.teamId,
        type: this.paymentForm.type,
        amount: this.paymentForm.amount,
        date: dateStr,
        description: this.paymentForm.description,
        payment_method: this.paymentForm.payment_method,
        sync_cash_movement: this.paymentForm.sync_cash_movement,
        image: this.paymentVoucherFile,
      })
      .pipe(finalize(() => (this.savingPayment = false)))
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Registrado',
            detail:
              'Movimiento de nómina guardado' +
              (this.paymentForm.sync_cash_movement
                ? ' y reflejado en gastos administrativos.'
                : '.'),
          });
          this.resetPaymentForm(voucherUpload);
          this.loadPayroll();
        },
        error: err => {
          console.error(err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo registrar el movimiento.',
          });
        },
      });
  }

  private resetPaymentForm(voucherUpload: { clear: () => void }): void {
    this.paymentForm = {
      type: 'PAYMENT',
      amount: null,
      date: new Date(),
      description: '',
      payment_method: 'CASH',
      sync_cash_movement: true,
    };
    this.paymentVoucherFile = null;
    voucherUpload.clear();
  }

  paymentMethodLabel(method: string | null | undefined): string {
    return (
      this.paymentMethodOptions.find(option => option.value === method)
        ?.label ??
      method ??
      '—'
    );
  }

  paymentTypeTagSeverity(
    type: PayrollPaymentItem['type'],
  ): 'success' | 'info' | 'warning' | 'danger' | 'secondary' {
    const map: Record<
      PayrollPaymentItem['type'],
      'success' | 'info' | 'warning' | 'danger' | 'secondary'
    > = {
      PAYMENT: 'info',
      ADVANCE: 'warning',
      DEDUCTION: 'danger',
    };
    return map[type] ?? 'secondary';
  }

  showPaymentVoucher(item: PayrollPaymentItem): void {
    const path = item.voucherPath;
    if (!path) {
      return;
    }

    this.revokePreviewUrl();
    this.isPdf.set(path.toLowerCase().endsWith('.pdf'));
    this.displayPreview.set(true);
    this.previewLoading.set(true);

    this.cashflowService.getVoucherPreview(path).subscribe({
      next: blob => {
        this.previewObjectUrl = URL.createObjectURL(blob);
        this.previewUrl.set(this.previewObjectUrl);
        this.previewLoading.set(false);
      },
      error: () => {
        this.previewLoading.set(false);
        this.displayPreview.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar el comprobante.',
        });
      },
    });
  }

  onPreviewVisibleChange(visible: boolean): void {
    this.displayPreview.set(visible);
    if (!visible) {
      this.revokePreviewUrl();
    }
  }

  private revokePreviewUrl(): void {
    if (this.previewObjectUrl) {
      URL.revokeObjectURL(this.previewObjectUrl);
      this.previewObjectUrl = null;
    }
    this.previewUrl.set('');
  }

  money(n: number | null | undefined): string {
    const x = Number(n ?? 0);
    return new Intl.NumberFormat('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(x);
  }

  minutesToBlock(total: number): PayrollTardanza {
    const n = Math.max(0, Math.floor(total));
    return {
      days: Math.floor(n / 1440),
      hours: Math.floor((n % 1440) / 60),
      minutes: n % 60,
    };
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

  saldoNetoResumen(slice: PayrollAttendanceSlice): string {
    const n = slice.saldoTiempoNetoMinutos;
    const mag = this.splitTimeLabel(slice.saldoTiempoNetoMagnitud);
    if (n === 0) {
      return 'Saldo neto del período: equilibrado (0).';
    }
    if (n > 0) {
      return `Saldo neto del período: +${mag} a favor del colaborador (${n} min).`;
    }
    return `Saldo neto del período: −${mag} neto a deber (${Math.abs(n)} min).`;
  }

  saldoTagSeverity(
    s: SaldoSentido,
  ): 'success' | 'danger' | 'secondary' | 'info' {
    if (s === 'favor') {
      return 'success';
    }
    if (s === 'debe') {
      return 'danger';
    }
    return 'secondary';
  }

  formatoSaldoCelda(row: PayrollDeudaDia): string {
    if (row.saldoNetoMinutos === 0) {
      return '0';
    }
    const sign = row.saldoNetoMinutos > 0 ? '+' : '−';
    return `${sign}${Math.abs(row.saldoNetoMinutos)} min`;
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
      userEmail: (o['userEmail'] ?? o['user_email']) as
        | string
        | null
        | undefined,
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
            this.data = {
              ...res.data,
              paymentItems: res.data.paymentItems ?? [],
            };
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
