import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

// PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { AttendanceService } from '../../services/attendance.service';

@Component({
  selector: 'app-attendance-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CalendarModule,
    DropdownModule,
    InputTextModule,
    InputTextareaModule,
    InputNumberModule,
    ButtonModule,
  ],
  providers: [DatePipe],
  templateUrl: './attendance-form.component.html',
  styleUrl: './attendance-form.component.scss',
})
export class AttendanceFormComponent implements OnInit {
  // Inyecciones
  private attendanceService = inject(AttendanceService);
  private config = inject(DynamicDialogConfig);
  public ref = inject(DynamicDialogRef);
  private datePipe = inject(DatePipe);

  // Variables
  selectedDate: Date = new Date();

  // Datos del Formulario
  selectedStatus: string = 'PUNTUAL';

  // Getters/Setters para cálculo automático al cambiar hora
  private _checkInTime: Date | null = null;
  get checkInTime(): Date | null {
    return this._checkInTime;
  }
  set checkInTime(value: Date | null) {
    this._checkInTime = value;
    this.calculateDelay();
  }

  private _checkOutTime: Date | null = null;
  get checkOutTime(): Date | null {
    return this._checkOutTime;
  }
  set checkOutTime(value: Date | null) {
    this._checkOutTime = value;
    this.calculateDelay();
  }

  delayMinutes: number = 0; // Tardanza administrativa (vs 8:00 AM)
  owedMinutes: number = 0; // Deuda de tiempo (vs Jornada dinámica)
  note: string = '';

  // Texto auxiliar para mostrar la hora de salida esperada
  targetExitTimeStr: string = '';

  statusOptions = [
    { label: 'Presente (Puntual)', value: 'PUNTUAL' },
    { label: 'Tardanza', value: 'TARDE' },
    { label: 'Falta', value: 'FALTA' },
    { label: 'Descanso', value: 'DESCANSO' },
    { label: 'Vacaciones', value: 'VACACIONES' },
  ];

  ngOnInit() {
    this.loadAttendance();
  }

  loadAttendance() {
    if (this.config.data?.id) {
      const teamId = this.config.data.id;
      const month = this.selectedDate.getMonth() + 1;
      const year = this.selectedDate.getFullYear();

      this.attendanceService.getAttendance(teamId, month, year).subscribe({
        next: (res: any) => {
          const dateStr = this.datePipe.transform(
            this.selectedDate,
            'yyyy-MM-dd',
          )!;

          let record = res.data[dateStr];
          // Fallback por si viene con timestamp
          if (!record) {
            record = res.data[dateStr + ' 00:00:00'];
          }

          if (record) {
            this.selectedStatus = record.status;
            this.note = record.notes || '';

            // Asignamos horas (esto disparará calculateDelay, pero luego restauramos delayMinutes guardado)
            this._checkInTime = record.check_in_time
              ? this.parseTimeString(record.check_in_time)
              : null;
            this._checkOutTime = record.check_out_time
              ? this.parseTimeString(record.check_out_time)
              : null;

            // Forzamos el recálculo inicial para ver si debe horas con la salida actual
            this.calculateDelay();

            // Si ya había tardanza guardada manualmente, la respetamos (opcional)
            if (record.delay_minutes > 0) {
              this.delayMinutes = record.delay_minutes;
            }
          } else {
            this.resetForm();
          }
        },
        error: err => console.error('Error cargando asistencia', err),
      });
    }
  }

  /**
   * CÁLCULO DE HORARIOS
   * Regla: Jornada de 11h 30m (8:00 AM a 7:30 PM)
   */
  calculateDelay() {
    this.targetExitTimeStr = '';
    this.owedMinutes = 0;

    // 1. Cálculo Tardanza Entrada (Vs 8:00 AM Fijo)
    if (this._checkInTime) {
      const entryTime = new Date(this._checkInTime);
      const entryLimit = new Date(entryTime);
      entryLimit.setHours(8, 0, 0, 0); // 8:00 AM

      if (entryTime > entryLimit) {
        const diffMs = entryTime.getTime() - entryLimit.getTime();
        this.delayMinutes = Math.floor(diffMs / 60000);
      } else {
        this.delayMinutes = 0;
      }
    } else {
      this.delayMinutes = 0;
    }

    // 2. Cálculo de Salida Dinámica (Entrada + 11h 30m)
    const SHIFT_DURATION_MINUTES = 11 * 60 + 30; // 690 min

    if (this._checkInTime) {
      const entryTime = new Date(this._checkInTime);

      // Calculamos la hora de salida OBJETIVO basada en la hora de entrada REAL
      // Ejemplo: Entra 8:27 -> Salida Objetivo 19:57
      const targetExitTime = new Date(
        entryTime.getTime() + SHIFT_DURATION_MINUTES * 60000,
      );

      this.targetExitTimeStr =
        this.datePipe.transform(targetExitTime, 'h:mm a') || '';

      if (this._checkOutTime) {
        const actualExitTime = new Date(this._checkOutTime);

        // Si salió antes de su hora objetivo personalizada
        if (actualExitTime < targetExitTime) {
          const diffMs = targetExitTime.getTime() - actualExitTime.getTime();
          this.owedMinutes = Math.floor(diffMs / 60000);
        }
      }
    }

    // Actualización automática de estado a TARDE si hay retraso en entrada
    if (this.delayMinutes > 0 && this.selectedStatus === 'PUNTUAL') {
      this.selectedStatus = 'TARDE';
    }
  }

  onSave() {
    const dateStr = this.datePipe.transform(this.selectedDate, 'yyyy-MM-dd');
    const timeInStr = this.checkInTime
      ? this.datePipe.transform(this.checkInTime, 'HH:mm')
      : null;
    const timeOutStr = this.checkOutTime
      ? this.datePipe.transform(this.checkOutTime, 'HH:mm')
      : null;

    // Concatenar deuda en notas automáticamente si existe
    let finalNote = this.note;
    if (this.owedMinutes > 0) {
      const debtInfo = ` [Debe: ${this.owedMinutes} min]`;
      // Evitamos duplicar el texto si guardamos varias veces
      if (!finalNote.includes('[Debe:')) {
        finalNote = finalNote ? `${finalNote}${debtInfo}` : debtInfo.trim();
      }
    }

    const payload = {
      team_id: this.config.data.id,
      date: dateStr,
      status: this.selectedStatus,
      check_in_time: timeInStr,
      check_out_time: timeOutStr,
      delay_minutes: this.delayMinutes, // Solo guardamos la tardanza oficial en la columna numérica
      notes: finalNote,
    };

    this.attendanceService.create(payload).subscribe({
      next: () => {
        this.loadAttendance();
      },
      error: err => console.error('Error guardando', err),
    });
  }

  resetForm() {
    this.selectedStatus = 'PUNTUAL';

    // Por defecto sugerimos el horario ideal
    const defaultIn = new Date();
    defaultIn.setHours(8, 0, 0, 0);
    this._checkInTime = defaultIn;

    const defaultOut = new Date();
    defaultOut.setHours(19, 30, 0, 0);
    this._checkOutTime = defaultOut;

    this.delayMinutes = 0;
    this.owedMinutes = 0;
    this.targetExitTimeStr = '7:30 PM';
    this.note = '';
  }

  private parseTimeString(timeStr: string): Date {
    const date = new Date();
    const [hours, minutes] = timeStr.split(':');
    date.setHours(+hours);
    date.setMinutes(+minutes);
    date.setSeconds(0);
    return date;
  }
}
