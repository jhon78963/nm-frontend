import { DatePipe } from '@angular/common';

export function currentDateTime(datePipe: DatePipe) {
  return datePipe.transform(new Date(), 'yyyy-MM-dd HH:mm:ss');
}

export function currentDate(datePipe: DatePipe) {
  return datePipe.transform(new Date(), 'yyyy-MM-dd');
}

export function formatDateTime(date: Date, datePipe: DatePipe) {
  return datePipe.transform(date, 'yyyy-MM-dd HH:mm:ss');
}

export function formatDateTimeFromLocal(
  date: string,
  datePipe: DatePipe,
): string {
  const [day, month, yearAndTime] = date.split('/');
  const [year, time] = yearAndTime.split(' ');
  const formattedDate = `${year}-${month}-${day}T${time}:00`;

  return datePipe.transform(formattedDate, 'yyyy-MM-dd HH:mm:ss') || '';
}

export function formatDateTimeLocal(date: Date, datePipe: DatePipe) {
  return datePipe.transform(date, 'dd/MM/yyyy HH:mm:ss');
}

export function formatDate(date: Date, datePipe: DatePipe) {
  return datePipe.transform(date, 'yyyy-MM-dd');
}
