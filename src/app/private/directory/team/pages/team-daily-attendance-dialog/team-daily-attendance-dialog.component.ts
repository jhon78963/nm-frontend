import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';
import { AttendanceService } from '../../services/attendance.service';

export interface DailyAttendanceRow {
  teamId: number;
  name: string;
  surname: string;
  date: string;
  attendance: {
    status: string;
    check_in_time: string | null;
    check_out_time: string | null;
    delay_minutes: number;
    notes: string | null;
  } | null;
}

@Component({
  selector: 'app-team-daily-attendance-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CalendarModule,
    ButtonModule,
    ProgressSpinnerModule,
    TagModule,
  ],
  providers: [DatePipe],
  templateUrl: './team-daily-attendance-dialog.component.html',
  styleUrl: './team-daily-attendance-dialog.component.scss',
})
export class TeamDailyAttendanceDialogComponent implements OnInit {
  private attendanceService = inject(AttendanceService);
  private datePipe = inject(DatePipe);
  ref = inject(DynamicDialogRef);

  selectedDate: Date = new Date();
  loading = false;
  rows: DailyAttendanceRow[] = [];
  dateStr = '';

  ngOnInit(): void {
    this.syncDateStr();
    this.loadSummary();
  }

  onDateChange(): void {
    this.syncDateStr();
    this.loadSummary();
  }

  goToday(): void {
    this.selectedDate = new Date();
    this.syncDateStr();
    this.loadSummary();
  }

  severityFor(
    status: string | null | undefined,
  ): 'success' | 'info' | 'warning' | 'danger' | 'secondary' {
    if (!status) {
      return 'secondary';
    }
    const m: Record<
      string,
      'success' | 'info' | 'warning' | 'danger' | 'secondary'
    > = {
      PUNTUAL: 'success',
      TOLERANCIA: 'info',
      TARDE: 'warning',
      FALTA: 'danger',
      FALTA_INJUSTIFICADA: 'danger',
      DESCANSO: 'info',
      VACACIONES: 'secondary',
      RECUPERACION: 'success',
      VALDEO: 'info',
    };
    return m[status] ?? 'secondary';
  }

  statusText(status: string): string {
    const labels: Record<string, string> = {
      PUNTUAL: 'Puntual',
      TOLERANCIA: 'Presente (tolerancia)',
      TARDE: 'Tarde',
      FALTA: 'Falta',
      FALTA_INJUSTIFICADA: 'Falta injustificada',
      DESCANSO: 'Descanso',
      VACACIONES: 'Vacaciones',
      RECUPERACION: 'Día recuperado',
      VALDEO: 'Valdeo',
    };
    return labels[status] ?? status;
  }

  summaryLine(row: DailyAttendanceRow): string {
    const fullName = `${row.name} ${row.surname}`.trim();
    if (!row.attendance) {
      return `${fullName}: sin registro de asistencia.`;
    }
    const a = row.attendance;
    const parts: string[] = [this.statusText(a.status)];
    if (a.check_in_time) {
      parts.push(`entrada ${a.check_in_time}`);
    }
    if (a.check_out_time) {
      parts.push(`salida ${a.check_out_time}`);
    }
    if (a.delay_minutes > 0) {
      parts.push(`+${a.delay_minutes} min vs 8:00`);
    }
    return `${fullName}: ${parts.join(' · ')}.`;
  }

  private syncDateStr(): void {
    this.dateStr =
      this.datePipe.transform(this.selectedDate, 'yyyy-MM-dd') ?? '';
  }

  private loadSummary(): void {
    if (!this.dateStr) {
      return;
    }
    this.loading = true;
    this.attendanceService.getDailySummary(this.dateStr).subscribe({
      next: (res: any) => {
        this.rows = res?.data ?? [];
        this.loading = false;
      },
      error: () => {
        this.rows = [];
        this.loading = false;
      },
    });
  }
}
