import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BASE_URL } from '../../../../utils/constants';

@Injectable({
  providedIn: 'root',
})
export class ReservationExportsService {
  BASE_URL = BASE_URL;
  constructor(private http: HttpClient) {}

  export(
    startDate: string | null,
    endDate: string | null,
    reservationType: string | null,
    schedule: string | null,
  ) {
    const url = `${this.BASE_URL}/reservations/export`;
    const params: { [key: string]: string | null } = {
      startDate: startDate || null,
      endDate: endDate || null,
      reservationType: reservationType !== '0' ? reservationType : null,
      schedule: schedule !== '0' ? schedule : null,
    };
    const filteredParams = Object.fromEntries(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      Object.entries(params).filter(([_, value]) => value !== null),
    );

    return this.http.post(url, filteredParams, { responseType: 'blob' });
  }
}
