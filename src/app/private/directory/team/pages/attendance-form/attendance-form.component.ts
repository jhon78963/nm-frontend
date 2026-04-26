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
  /** Etiqueta libre (ej. falta entre semana); se guarda en el navegador por mes. */
  customMarcacionLabel: string;
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
    InputTextModule,
    InputNumberModule,
    ButtonModule,
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

  stats = {
    puntual: 0,
    tolerancia: 0,
    tarde: 0,
    falta: 0,
    descanso: 0,
    vacaciones: 0,
    recuperacion: 0,
    valdeo: 0,
    domingosMes: 0,
  };

  /** 1 = primer miércoles Valdeo, 2 = segundo miércoles (persistido por mes). */
  valdeoWednesdayNth: 1 | 2 = 1;

  valdeoNthOptions = [
    { label: 'Valdeo: 1.er miércoles', value: 1 },
    { label: 'Valdeo: 2.º miércoles', value: 2 },
  ];

  statusOptions = [
    { label: 'Presente (puntual)', value: 'PUNTUAL' },
    { label: 'Presente (tolerancia 8:00–8:15)', value: 'TOLERANCIA' },
    { label: 'Tardanza', value: 'TARDE' },
    { label: 'Falta', value: 'FALTA' },
    { label: 'Descanso', value: 'DESCANSO' },
    { label: 'Vacaciones', value: 'VACACIONES' },
    { label: 'Día recuperado', value: 'RECUPERACION' },
    { label: 'Valdeo (mensual)', value: 'VALDEO' },
  ];

  readonly SHIFT_DURATION_MINUTES = 11 * 60 + 30;

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

  marcacionHint(row: AttendanceDayRow): string {
    const parts: string[] = [];
    if (row.isSunday) {
      parts.push('Domingo · descanso habitual (editable si hubo excepción)');
    }
    if (row.isValdeo) {
      parts.push(
        this.valdeoWednesdayNth === 2
          ? '2.º miércoles Valdeo (sugerido)'
          : '1.er miércoles Valdeo (sugerido)',
      );
    }
    if (parts.length === 0) {
      parts.push('Opcional: falta entre semana, permiso, etc.');
    }
    return parts.join(' · ');
  }

  persistMarcacionLabels(): void {
    const map: Record<string, string> = {};
    for (const r of this.monthRows) {
      const v = (r.customMarcacionLabel || '').trim();
      if (v) {
        map[r.dateStr] = v;
      }
    }
    localStorage.setItem(this.marcacionLabelsStorageKey(), JSON.stringify(map));
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

    let finalNote = row.note;
    if (row.owedMinutes > 0) {
      const debtInfo = ` [Debe: ${row.owedMinutes} min]`;
      if (!finalNote.includes('[Debe:')) {
        finalNote = finalNote ? `${finalNote}${debtInfo}` : debtInfo.trim();
      }
    }

    const payload = {
      team_id: this.teamId,
      date: row.dateStr,
      status: row.status,
      check_in_time: timeInStr,
      check_out_time: timeOutStr,
      delay_minutes: row.delayMinutes,
      notes: finalNote,
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
      row.status === 'TOLERANCIA'
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
    const labels = this.readMarcacionLabelsMap();

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
        customMarcacionLabel: labels[dateStr] ?? '',
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
    this.stats = {
      puntual: 0,
      tolerancia: 0,
      tarde: 0,
      falta: 0,
      descanso: 0,
      vacaciones: 0,
      recuperacion: 0,
      valdeo: 0,
      domingosMes: this.countSundaysInMonth(this.viewYear, this.viewMonth),
    };

    for (const key of Object.keys(this.attendanceCache)) {
      const dayKey = key.includes(' ') ? key.slice(0, 10) : key;
      if (!this.dateStrInVisibleMonth(dayKey)) {
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

  private countSundaysInMonth(year: number, month: number): number {
    const last = new Date(year, month + 1, 0).getDate();
    let n = 0;
    for (let d = 1; d <= last; d++) {
      if (new Date(year, month, d).getDay() === 0) {
        n++;
      }
    }
    return n;
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

  private marcacionLabelsStorageKey(): string {
    return `nm-marcacion-${this.teamId}-${this.viewYear}-${String(this.viewMonth + 1).padStart(2, '0')}`;
  }

  private loadValdeoNthForMonth(): void {
    const raw = localStorage.getItem(this.valdeoNthStorageKey());
    this.valdeoWednesdayNth = raw === '2' ? 2 : 1;
  }

  private saveValdeoNthForMonth(): void {
    localStorage.setItem(this.valdeoNthStorageKey(), String(this.valdeoWednesdayNth));
  }

  private readMarcacionLabelsMap(): Record<string, string> {
    try {
      const raw = localStorage.getItem(this.marcacionLabelsStorageKey());
      return raw ? (JSON.parse(raw) as Record<string, string>) : {};
    } catch {
      return {};
    }
  }

  private defaultMorning(): Date {
    const t = new Date();
    t.setHours(8, 0, 0, 0);
    return t;
  }

  /**
   * @param autoStatusFromTime si es true, ajusta PUNTUAL / TOLERANCIA / TARDE según 8:00 y ventana de 15 min (al cambiar hora o al guardar).
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
      toleranceEnd.setMinutes(toleranceEnd.getMinutes() + 15);

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

    if (row.checkInTime && usesEntryRules) {
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
  }

  private parseTimeString(timeStr: string): Date {
    const date = new Date();
    const normalized = timeStr.length > 5 ? timeStr.slice(0, 5) : timeStr;
    const [hours, minutes] = normalized.split(':');
    date.setHours(+hours, +minutes || 0, 0, 0);
    return date;
  }
}
