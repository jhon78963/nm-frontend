import { Customer } from './customer.model';

export interface IBooking {
  id?: number;
  startDate?: string | null;
  endDate?: string | null;
  total: number;
  totalPaid: number;
  totalLeft?: number;
  customerId: number;
  facilitiesImport: number;
  peopleExtraImport: number;
  consumptionsImport: number;
  description: string;
  customer?: Customer;
  products?: any[];
  services?: any[];
  facilities?: any[];
  paymentTypes?: any[];
  notes?: string;
  status?: string;
  statusLabel?: string;
}

export class Booking {
  id?: number;
  startDate?: string | null;
  endDate?: string | null;
  total: number;
  totalPaid: number;
  totalLeft?: number;
  customerId: number;
  facilitiesImport: number;
  peopleExtraImport: number;
  consumptionsImport: number;
  description: string;
  customer?: Customer;
  products?: any[];
  services?: any[];
  facilities?: any[];
  paymentTypes?: any[];
  notes?: string;
  status?: string;
  statuslabel?: string;
  constructor(booking: IBooking) {
    this.startDate = booking.startDate;
    this.total = booking.total;
    this.totalPaid = booking.totalPaid;
    this.customerId = booking.customerId;
    this.facilitiesImport = booking.facilitiesImport;
    this.peopleExtraImport = booking.peopleExtraImport;
    this.consumptionsImport = booking.consumptionsImport;
    this.description = booking.description;
    this.products = booking.products;
    this.services = booking.services;
    this.notes = booking.notes;
  }
}

export interface CreatedBooking {
  message: string;
  bookingId: number;
}

export interface Paginate {
  total: number;
  pages: number;
}

export interface BookingListResponse {
  data: Booking[];
  paginate: Paginate;
}

export interface CheckSchedule {
  conflict: boolean;
  conflictingStartDate: Date;
  conflictingEndDate: Date;
}
