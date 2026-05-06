import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { Subscription } from 'rxjs';
import { Team } from '../../models/team.model';
import { AttendanceService } from '../../services/attendance.service';
import { TeamService } from '../../services/team.service';

export interface AttendanceDayRow {
  dateStr: string;
  day: number;
  weekdayLabel: string;
  weekday: number;
  isSunday: boolean;
  isValdeo: boolean;
  /** Domingo que trabajó para recuperar (solo UI + localStorage). */
  domingoTrabajoRecuperacion: boolean;
  status: string;
  checkInTime: Date | null;
  checkOutTime: Date | null;
  delayMinutes: number;
  owedMinutes: number;
  note: string;
  saving: boolean;
  targetExitTimeStr: string;
  hasRecord: boolean;
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

const WEEKDAY_SHORT_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

@Component({
  selector: 'app-attendance-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CalendarModule,
    DropdownModule,
    InputTextareaModule,
    InputNumberModule,
    ButtonModule,
    CheckboxModule,
    SelectButtonModule,
    TagModule,
    ToastModule,
    TooltipModule,
  ],
  providers: [DatePipe, MessageService],
  templateUrl: './attendance-form.component.html',
  styleUrl: './attendance-form.component.scss',
})
export class AttendanceFormComponent implements OnInit, OnDestroy {
  private attendanceService = inject(AttendanceService);
  private teamService = inject(TeamService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private datePipe = inject(DatePipe);
  private messageService = inject(MessageService);

  teamId = 0;
  team: Team | null = null;
  private routeSub?: Subscription;

  /** Mes visible (0–11) y año */
  viewMonth = new Date().getMonth();
  viewYear = new Date().getFullYear();

  monthRows: AttendanceDayRow[] = [];
  private attendanceCache: Record<string, any> = {};
  private loadedMonthKey = '';
  /** Mapa fecha → marcó domingo recuperación (localStorage). */
  private domingoRecuperaMap: Record<string, boolean> = {};

  stats = {
    puntual: 0,
    tolerancia: 0,
    tarde: 0,
    falta: 0,
    descanso: 0,
    vacaciones: 0,
    recuperacion: 0,
    valdeo: 0,
    domingosEnPeriodo: 0,
    domingoTrabajoRecuperacion: 0,
  };

  /** Pago quincenal: filtra tabla e indicadores. */
  quincenaView: 'full' | 'q1' | 'q2' = 'full';

  quincenaOptions = [
    { label: 'Mes completo', value: 'full' },
    { label: '1ª quincena (1–15)', value: 'q1' },
    { label: '2ª quincena (16–fin)', value: 'q2' },
  ];

  /** 1 = primer miércoles Valdeo, 2 = segundo miércoles (persistido por mes). */
  valdeoWednesdayNth: 1 | 2 = 1;

  valdeoNthOptions = [
    { label: 'Valdeo: 1.er miércoles', value: 1 },
    { label: 'Valdeo: 2.º miércoles', value: 2 },
  ];

  statusOptions = [
    { label: 'Presente (puntual)', value: 'PUNTUAL' },
    { label: 'Presente (tolerancia 8:00–8:10)', value: 'TOLERANCIA' },
    { label: 'Tardanza', value: 'TARDE' },
    { label: 'Falta', value: 'FALTA' },
    { label: 'Descanso', value: 'DESCANSO' },
    { label: 'Vacaciones', value: 'VACACIONES' },
    { label: 'Día recuperado', value: 'RECUPERACION' },
    { label: 'Valdeo (mensual)', value: 'VALDEO' },
  ];

  readonly SHIFT_DURATION_MINUTES = 11 * 60 + 30;

  /** Borra cualquier sufijo [Debe: …] (minutos solo o h + min). */
  private readonly debtNotePattern = /\s*\[Debe:[^\]]+\]/g;

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
        this.resetMonthToCurrent();
        this.loadedMonthKey = '';
        this.attendanceCache = {};
      }
      this.loadTeam();
      this.loadAttendanceMonth();
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }

  get monthTitle(): string {
    return `${MONTH_NAMES_ES[this.viewMonth]} ${this.viewYear}`;
  }

  get visibleMonthRows(): AttendanceDayRow[] {
    const { start, end } = this.quincenaDayRange();
    return this.monthRows.filter(r => r.day >= start && r.day <= end);
  }

  get quincenaLabel(): string {
    if (this.quincenaView === 'q1') {
      return '1ª quincena (días 1–15)';
    }
    if (this.quincenaView === 'q2') {
      const last = new Date(this.viewYear, this.viewMonth + 1, 0).getDate();
      return `2ª quincena (días 16–${last})`;
    }
    return 'Mes completo';
  }

  quincenaDayRange(): { start: number; end: number } {
    const last = new Date(this.viewYear, this.viewMonth + 1, 0).getDate();
    if (this.quincenaView === 'q1') {
      return { start: 1, end: 15 };
    }
    if (this.quincenaView === 'q2') {
      return { start: 16, end: last };
    }
    return { start: 1, end: last };
  }

  onQuincenaViewChange(): void {
    const raw = this.quincenaView as string;
    this.quincenaView =
      raw === 'q1' || raw === 'q2' || raw === 'full' ? (raw as 'q1' | 'q2' | 'full') : 'full';
    this.saveQuincenaViewForMonth();
    this.recalcStatsFromCache();
  }

  onDomingoRecuperaChange(row: AttendanceDayRow): void {
    const map = { ...this.domingoRecuperaMap };
    if (row.domingoTrabajoRecuperacion) {
      map[row.dateStr] = true;
    } else {
      delete map[row.dateStr];
    }
    this.domingoRecuperaMap = map;
    localStorage.setItem(
      this.domingoRecuperaStorageKey(),
      JSON.stringify(this.domingoRecuperaMap),
    );
    this.recalcStatsFromCache();
  }

  goBack(): void {
    void this.router.navigate(['/directory/team']);
  }

  prevMonth(): void {
    if (this.viewMonth === 0) {
      this.viewMonth = 11;
      this.viewYear--;
    } else {
      this.viewMonth--;
    }
    this.loadValdeoNthForMonth();
    this.loadAttendanceMonth();
  }

  nextMonth(): void {
    if (this.viewMonth === 11) {
      this.viewMonth = 0;
      this.viewYear++;
    } else {
      this.viewMonth++;
    }
    this.loadValdeoNthForMonth();
    this.loadAttendanceMonth();
  }

  onValdeoNthChange(): void {
    this.valdeoWednesdayNth = Number(this.valdeoWednesdayNth) === 2 ? 2 : 1;
    this.saveValdeoNthForMonth();
    this.buildMonthRows();
  }

  onStatusChange(row: AttendanceDayRow): void {
    if (row.isSunday && row.status !== 'DESCANSO' && row.status !== 'VACACIONES') {
      this.messageService.add({
        severity: 'info',
        summary: 'Domingo',
        detail: 'Los domingos suelen registrarse como descanso fijo.',
        life: 2500,
      });
    }
    this.calculateDelayForRow(row, false);
  }

  onTimeChange(row: AttendanceDayRow): void {
    this.calculateDelayForRow(row, true);
  }

  saveRow(row: AttendanceDayRow): void {
    this.calculateDelayForRow(row, true);
    const timeInStr = row.checkInTime
      ? this.datePipe.transform(row.checkInTime, 'HH:mm')
      : null;
    const timeOutStr = row.checkOutTime
      ? this.datePipe.transform(row.checkOutTime, 'HH:mm')
      : null;

    const payload = {
      team_id: this.teamId,
      date: row.dateStr,
      status: row.status,
      check_in_time: timeInStr,
      check_out_time: timeOutStr,
      delay_minutes: row.delayMinutes,
      notes: row.note,
    };

    row.saving = true;
    this.attendanceService.create(payload).subscribe({
      next: (res: any) => {
        row.saving = false;
        if (res?.data) {
          this.attendanceCache[row.dateStr] = res.data;
          this.applyRecordToRow(row, res.data);
          this.recalcStatsFromCache();
          this.messageService.add({
            severity: 'success',
            summary: 'Guardado',
            detail: `${row.dateStr} actualizado.`,
            life: 2000,
          });
        } else {
          this.loadedMonthKey = '';
          this.loadAttendanceMonth();
        }
      },
      error: err => {
        row.saving = false;
        console.error(err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo guardar la asistencia.',
        });
      },
    });
  }

  showTimesFor(row: AttendanceDayRow): boolean {
    return (
      row.status === 'PUNTUAL' ||
      row.status === 'TARDE' ||
      row.status === 'TOLERANCIA' ||
      row.status === 'RECUPERACION'
    );
  }

  private loadTeam(): void {
    this.teamService.getOne(this.teamId).subscribe({
      next: (t: Team) => (this.team = new Team(t)),
      error: () => {
        this.messageService.add({
          severity: 'warn',
          summary: 'Colaborador',
          detail: 'No se pudo cargar el nombre del colaborador.',
        });
      },
    });
  }

  private resetMonthToCurrent(): void {
    const n = new Date();
    this.viewMonth = n.getMonth();
    this.viewYear = n.getFullYear();
  }

  private loadAttendanceMonth(): void {
    this.loadValdeoNthForMonth();
    this.loadQuincenaViewForMonth();
    this.domingoRecuperaMap = this.readDomingoRecuperaMap();
    const key = `${this.viewYear}-${this.viewMonth}`;
    if (this.loadedMonthKey === key) {
      this.buildMonthRows();
      this.recalcStatsFromCache();
      return;
    }

    this.attendanceService
      .getAttendance(this.teamId, this.viewMonth + 1, this.viewYear)
      .subscribe({
        next: (res: any) => {
          this.attendanceCache = res?.data ?? {};
          this.loadedMonthKey = key;
          this.buildMonthRows();
          this.recalcStatsFromCache();
        },
        error: err => {
          console.error(err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo cargar el mes.',
          });
        },
      });
  }

  private buildMonthRows(): void {
    const lastDay = new Date(this.viewYear, this.viewMonth + 1, 0).getDate();
    const valdeoDate = this.nthWednesdayOfMonth(
      this.viewYear,
      this.viewMonth,
      this.valdeoWednesdayNth,
    );
    const valdeoStr = this.datePipe.transform(valdeoDate, 'yyyy-MM-dd');
    const domingoMap = this.readDomingoRecuperaMap();
    this.domingoRecuperaMap = domingoMap;

    const rows: AttendanceDayRow[] = [];
    for (let d = 1; d <= lastDay; d++) {
      const date = new Date(this.viewYear, this.viewMonth, d);
      const dateStr = this.datePipe.transform(date, 'yyyy-MM-dd')!;
      const wd = date.getDay();
      const isSunday = wd === 0;
      const isValdeo = dateStr === valdeoStr;

      let record = this.attendanceCache[dateStr];
      if (!record) {
        record = this.attendanceCache[dateStr + ' 00:00:00'];
      }

      const row: AttendanceDayRow = {
        dateStr,
        day: d,
        weekdayLabel: WEEKDAY_SHORT_ES[wd],
        weekday: wd,
        isSunday,
        isValdeo,
        domingoTrabajoRecuperacion: !!domingoMap[dateStr],
        status: 'PUNTUAL',
        checkInTime: null,
        checkOutTime: null,
        delayMinutes: 0,
        owedMinutes: 0,
        note: '',
        saving: false,
        targetExitTimeStr: '',
        hasRecord: false,
      };

      this.applyRecordToRow(row, record);
      rows.push(row);
    }

    this.monthRows = rows;
  }

  private applyRecordToRow(row: AttendanceDayRow, record: any | undefined): void {
    if (!record) {
      row.hasRecord = false;
      if (row.isSunday) {
        row.status = 'DESCANSO';
        row.checkInTime = null;
        row.checkOutTime = null;
      } else {
        row.status = 'PUNTUAL';
        row.checkInTime = this.defaultMorning();
        row.checkOutTime = null;
      }
      row.note = '';
      row.delayMinutes = 0;
      row.owedMinutes = 0;
      row.targetExitTimeStr = '';
      this.calculateDelayForRow(row, false);
      return;
    }

    row.hasRecord = true;
    row.status = record.status;
    row.note = record.notes || '';
    row.checkInTime = record.check_in_time
      ? this.parseTimeString(record.check_in_time)
      : null;
    row.checkOutTime = record.check_out_time
      ? this.parseTimeString(record.check_out_time)
      : null;
    row.delayMinutes = record.delay_minutes || 0;
    this.calculateDelayForRow(row, false);
  }

  private recalcStatsFromCache(): void {
    const { start, end } = this.quincenaDayRange();

    this.stats = {
      puntual: 0,
      tolerancia: 0,
      tarde: 0,
      falta: 0,
      descanso: 0,
      vacaciones: 0,
      recuperacion: 0,
      valdeo: 0,
      domingosEnPeriodo: 0,
      domingoTrabajoRecuperacion: 0,
    };

    for (let d = start; d <= end; d++) {
      const dt = new Date(this.viewYear, this.viewMonth, d);
      if (dt.getDay() === 0) {
        this.stats.domingosEnPeriodo++;
      }
    }

    for (const key of Object.keys(this.attendanceCache)) {
      const dayKey = key.includes(' ') ? key.slice(0, 10) : key;
      if (!this.dateStrInVisibleMonth(dayKey)) {
        continue;
      }
      const dom = this.dayOfMonthFromDateStr(dayKey);
      if (dom < start || dom > end) {
        continue;
      }
      const rec = this.attendanceCache[key];
      const st = rec?.status;
      if (st === 'PUNTUAL') {
        this.stats.puntual++;
      } else if (st === 'TOLERANCIA') {
        this.stats.tolerancia++;
      } else if (st === 'TARDE') {
        this.stats.tarde++;
      } else if (st === 'FALTA') {
        this.stats.falta++;
      } else if (st === 'DESCANSO') {
        this.stats.descanso++;
      } else if (st === 'VACACIONES') {
        this.stats.vacaciones++;
      } else if (st === 'RECUPERACION') {
        this.stats.recuperacion++;
      } else if (st === 'VALDEO') {
        this.stats.valdeo++;
      }
    }

    for (let d = start; d <= end; d++) {
      const dt = new Date(this.viewYear, this.viewMonth, d);
      if (dt.getDay() !== 0) {
        continue;
      }
      const ds = this.datePipe.transform(dt, 'yyyy-MM-dd')!;
      const flagged = !!this.domingoRecuperaMap[ds];
      let rec = this.attendanceCache[ds];
      if (!rec) {
        rec = this.attendanceCache[ds + ' 00:00:00'];
      }
      const worked =
        rec &&
        ['PUNTUAL', 'TARDE', 'TOLERANCIA', 'RECUPERACION'].includes(
          rec.status as string,
        );
      if (flagged || worked) {
        this.stats.domingoTrabajoRecuperacion++;
      }
    }
  }

  private dayOfMonthFromDateStr(dateStr: string): number {
    return Number(dateStr.slice(8, 10));
  }

  private dateStrInVisibleMonth(dateStr: string): boolean {
    const parts = dateStr.split('-');
    if (parts.length < 3) {
      return false;
    }
    const y = Number(parts[0]);
    const m = Number(parts[1]);
    return y === this.viewYear && m === this.viewMonth + 1;
  }

  private nthWednesdayOfMonth(
    year: number,
    month: number,
    nth: 1 | 2,
  ): Date {
    let count = 0;
    for (let d = 1; d <= 31; d++) {
      const dt = new Date(year, month, d);
      if (dt.getMonth() !== month) {
        break;
      }
      if (dt.getDay() === 3) {
        count++;
        if (count === nth) {
          return dt;
        }
      }
    }
    return new Date(year, month, 1);
  }

  private valdeoNthStorageKey(): string {
    return `nm-valdeo-nth-${this.viewYear}-${String(this.viewMonth + 1).padStart(2, '0')}`;
  }

  private loadValdeoNthForMonth(): void {
    const raw = localStorage.getItem(this.valdeoNthStorageKey());
    this.valdeoWednesdayNth = raw === '2' ? 2 : 1;
  }

  private saveValdeoNthForMonth(): void {
    localStorage.setItem(this.valdeoNthStorageKey(), String(this.valdeoWednesdayNth));
  }

  private domingoRecuperaStorageKey(): string {
    return `nm-domingo-recupera-${this.teamId}-${this.viewYear}-${String(this.viewMonth + 1).padStart(2, '0')}`;
  }

  private readDomingoRecuperaMap(): Record<string, boolean> {
    try {
      const raw = localStorage.getItem(this.domingoRecuperaStorageKey());
      return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
    } catch {
      return {};
    }
  }

  private quincenaViewStorageKey(): string {
    return `nm-quincena-view-${this.teamId}-${this.viewYear}-${String(this.viewMonth + 1).padStart(2, '0')}`;
  }

  private loadQuincenaViewForMonth(): void {
    const raw = localStorage.getItem(this.quincenaViewStorageKey());
    this.quincenaView =
      raw === 'q1' || raw === 'q2' || raw === 'full' ? raw : 'full';
  }

  private saveQuincenaViewForMonth(): void {
    localStorage.setItem(this.quincenaViewStorageKey(), this.quincenaView);
  }

  private defaultMorning(): Date {
    const t = new Date();
    t.setHours(8, 0, 0, 0);
    return t;
  }

  /**
   * @param autoStatusFromTime si es true, ajusta PUNTUAL / TOLERANCIA / TARDE según 8:00 y ventana de 10 min (al cambiar hora o al guardar).
   */
  private calculateDelayForRow(
    row: AttendanceDayRow,
    autoStatusFromTime = true,
  ): void {
    row.targetExitTimeStr = '';
    row.owedMinutes = 0;

    const usesEntryRules =
      row.status === 'PUNTUAL' ||
      row.status === 'TARDE' ||
      row.status === 'TOLERANCIA';

    if (row.checkInTime && usesEntryRules) {
      const entryTime = new Date(row.checkInTime);
      const limit = new Date(entryTime);
      limit.setHours(8, 0, 0, 0);
      const toleranceEnd = new Date(limit);
      toleranceEnd.setMinutes(toleranceEnd.getMinutes() + 10);

      if (entryTime <= limit) {
        row.delayMinutes = 0;
        if (autoStatusFromTime) {
          row.status = 'PUNTUAL';
        }
      } else if (entryTime <= toleranceEnd) {
        row.delayMinutes = Math.floor(
          (entryTime.getTime() - limit.getTime()) / 60000,
        );
        if (autoStatusFromTime) {
          row.status = 'TOLERANCIA';
        }
      } else {
        row.delayMinutes = Math.floor(
          (entryTime.getTime() - limit.getTime()) / 60000,
        );
        if (autoStatusFromTime) {
          row.status = 'TARDE';
        }
      }
    } else if (!row.checkInTime && usesEntryRules) {
      row.delayMinutes = 0;
    } else if (!usesEntryRules) {
      row.delayMinutes = 0;
    }

    const usesShiftExit =
      row.status === 'PUNTUAL' ||
      row.status === 'TARDE' ||
      row.status === 'TOLERANCIA' ||
      row.status === 'RECUPERACION';

    if (row.checkInTime && usesShiftExit) {
      const entryTime = new Date(row.checkInTime);
      const targetExitTime = new Date(
        entryTime.getTime() + this.SHIFT_DURATION_MINUTES * 60000,
      );
      row.targetExitTimeStr =
        this.datePipe.transform(targetExitTime, 'h:mm a') || '';

      if (row.checkOutTime) {
        const actualExitTime = new Date(row.checkOutTime);
        if (actualExitTime < targetExitTime) {
          const diffMs = targetExitTime.getTime() - actualExitTime.getTime();
          row.owedMinutes = Math.floor(diffMs / 60000);
        }
      }
    }

    this.syncOwedMinutesNote(row);
  }

  /** Convierte minutos totales a texto legible (ej. 257 → «4 h 17 min»). */
  formatOwedHuman(totalMinutes: number): string {
    const n = Math.max(0, Math.floor(totalMinutes));
    if (n === 0) {
      return '';
    }
    const h = Math.floor(n / 60);
    const m = n % 60;
    if (h === 0) {
      return `${m} min`;
    }
    if (m === 0) {
      return `${h} h`;
    }
    return `${h} h ${m} min`;
  }

  /** Quita y vuelve a escribir el sufijo [Debe: …] según horas actuales. */
  private syncOwedMinutesNote(row: AttendanceDayRow): void {
    const base = (row.note || '').replace(this.debtNotePattern, '').trimEnd();
    if (row.owedMinutes > 0) {
      const debt = this.formatOwedHuman(row.owedMinutes);
      row.note = base ? `${base} [Debe: ${debt}]` : `[Debe: ${debt}]`;
    } else {
      row.note = base;
    }
  }

  private parseTimeString(timeStr: string): Date {
    const date = new Date();
    const normalized = timeStr.length > 5 ? timeStr.slice(0, 5) : timeStr;
    const [hours, minutes] = normalized.split(':');
    date.setHours(+hours, +minutes || 0, 0, 0);
    return date;
  }
}
