import { Component, OnInit } from '@angular/core';
import { AttendanceService } from '../../services/attendance.service';
import { CalendarModule } from 'primeng/calendar';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';

@Component({
  selector: 'app-attendance-form',
  standalone: true,
  imports: [
    CommonModule,
    CalendarModule,
    FormsModule,
    DropdownModule,
    InputTextModule,
  ],
  templateUrl: './attendance-form.component.html',
  styleUrl: './attendance-form.component.scss',
})
export class AttendanceFormComponent implements OnInit {
  selectedDate: Date = new Date();
  attendanceData: any[] = [];
  statusOptions = [
    { label: 'Presente', value: 'PUNTUAL' },
    { label: 'Falta', value: 'FALTA' },
    { label: 'Tardanza', value: 'TARDE' },
    { label: 'Descanzo', value: 'DESCANSO' },
    { label: 'Vacaciones', value: 'VACACIONES' },
  ];
  selectedStatus: string = '';

  constructor(
    private attendanceService: AttendanceService,
    private readonly dynamicDialogConfig: DynamicDialogConfig,
    private datePipe: DatePipe,
  ) {}

  ngOnInit() {
    this.loadAttendance();
  }

  loadAttendance() {
    if (this.dynamicDialogConfig.data.id) {
      const teamId = this.dynamicDialogConfig.data.id;
      const month = this.selectedDate.getMonth() + 1;
      const year = this.selectedDate.getFullYear();

      this.attendanceService
        .getAttendance(teamId, month, year)
        .subscribe(res => {
          const rawData = res.data;
          const formattedDate =
            this.datePipe.transform(this.selectedDate, 'yyyy-MM-dd') +
            ' 00:00:00';

          const recordToday = rawData[formattedDate];
          if (recordToday) {
            this.selectedStatus = recordToday.status;
          } else {
            this.selectedStatus = '';
          }

          this.attendanceData = Object.values(rawData);
        });
    }
  }

  onSave() {
    const payload = {
      date: this.selectedDate,
      status: this.selectedStatus,
      team_id: this.dynamicDialogConfig.data.id,
      check_in_time: null,
      delay_minutes: 0,
      notes: '',
    };
    this.attendanceService.create(payload).subscribe(() => {
      this.loadAttendance();
    });
  }
}
