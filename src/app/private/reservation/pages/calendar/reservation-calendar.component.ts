import { Component, OnInit } from '@angular/core';
// @fullcalendar plugins
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import { CommonModule, DatePipe } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { FormsModule } from '@angular/forms';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { ToastModule } from 'primeng/toast';
import { RippleModule } from 'primeng/ripple';
import { FullCalendarModule } from '@fullcalendar/angular';
import esLocale from '@fullcalendar/core/locales/es';
import { currentDateTime } from '../../../../utils/dates';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    InputTextareaModule,
    ButtonModule,
    CalendarModule,
    InputTextModule,
    DropdownModule,
    ToastModule,
    RippleModule,
    FullCalendarModule,
  ],
  templateUrl: './reservation-calendar.component.html',
  styleUrls: ['./reservation-calendar.component.scss'],
  providers: [DatePipe, DialogModule],
})
export class ReservationCalendarComponent implements OnInit {
  events: any[] = [];

  today: string | null = '';

  calendarOptions: any = {
    initialView: 'dayGridMonth',
  };

  showDialog: boolean = false;

  clickedEvent: any = null;

  dateClicked: boolean = false;

  edit: boolean = false;

  tags: any[] = [];

  view: string = '';

  changedEvent: any;

  constructor(private readonly datePipe: DatePipe) {}

  ngOnInit(): void {
    this.today = currentDateTime(this.datePipe);

    this.events = [];
    this.calendarOptions = { ...this.calendarOptions, ...{ events: [] } };
    this.tags = this.events.map(item => item.tag);

    this.calendarOptions = {
      plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
      height: 720,
      initialDate: this.today,
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay',
      },
      editable: true,
      selectable: true,
      selectMirror: true,
      dayMaxEvents: true,
      locale: esLocale,
      eventClick: (e: MouseEvent) => this.onEventClick(e),
      select: (e: MouseEvent) => this.onDateSelect(e),
    };
  }

  onEventClick(e: any) {
    this.clickedEvent = e.event;
    const plainEvent = e.event.toPlainObject({
      collapseExtendedProps: true,
      collapseColor: true,
    });
    this.view = 'display';
    this.showDialog = true;

    this.changedEvent = { ...plainEvent, ...this.clickedEvent };
    this.changedEvent.start = this.clickedEvent.start;
    this.changedEvent.end = this.clickedEvent.end
      ? this.clickedEvent.end
      : this.clickedEvent.start;
  }

  onDateSelect(e: any) {
    this.view = 'new';
    this.showDialog = true;
    this.changedEvent = {
      ...e,
      title: null,
      description: null,
      location: null,
      backgroundColor: null,
      borderColor: null,
      textColor: null,
      tag: { color: null, name: null },
    };
  }

  handleSave() {
    if (!this.validate()) {
      return;
    } else {
      this.showDialog = false;
      this.clickedEvent = {
        ...this.changedEvent,
        backgroundColor: this.changedEvent.tag.color,
        borderColor: this.changedEvent.tag.color,
        textColor: '#212121',
      };

      if (Object.prototype.hasOwnProperty.call(this.clickedEvent, 'id')) {
        this.events = this.events.map(i =>
          i.id.toString() === this.clickedEvent.id.toString()
            ? (i = this.clickedEvent)
            : i,
        );
      } else {
        this.events = [
          ...this.events,
          { ...this.clickedEvent, id: Math.floor(Math.random() * 10000) },
        ];
      }
      this.calendarOptions = {
        ...this.calendarOptions,
        ...{ events: this.events },
      };
      this.clickedEvent = null;
    }
  }

  onEditClick() {
    this.view = 'edit';
  }

  delete() {
    this.events = this.events.filter(
      i => i.id.toString() !== this.clickedEvent.id.toString(),
    );
    this.calendarOptions = {
      ...this.calendarOptions,
      ...{ events: this.events },
    };
    this.showDialog = false;
  }

  validate() {
    const { start, end } = this.changedEvent;
    return start && end;
  }
}
