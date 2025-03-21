import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Booking } from '../../models/booking.model';
import { BookingsService } from '../../services/bookings/bookings.service';
import { CallToAction, Column } from '../../../../interfaces/table.interface';
import { CommonModule, DatePipe } from '@angular/common';
import { formatDate } from '../../../../utils/dates';
import { LoadingService } from '../../../../services/loading.service';
import { debounceTime, Observable, Subject } from 'rxjs';
import { PaginatorState } from 'primeng/paginator';
import { SharedModule } from '../../../../shared/shared.module';
import { KeyFilterModule } from 'primeng/keyfilter';
import { showSuccess } from '../../../../utils/notifications';
import { MessageService } from 'primeng/api';
import { ReservationFormComponent } from '../form/create/reservation-form.component';
import { DialogService } from 'primeng/dynamicdialog';
import { BookingPaymentTypesService } from '../../services/bookings/booking-payment-types.service';

@Component({
  standalone: true,
  imports: [CommonModule, KeyFilterModule, SharedModule],
  templateUrl: './booking.component.html',
  styleUrls: ['./booking.component.scss'],
  providers: [DatePipe, DialogService, MessageService],
})
export class BookingComponent implements OnInit {
  columns: Column[] = [
    {
      header: 'Fecha de entrada',
      field: 'startDate',
      clickable: false,
      image: false,
      money: false,
    },
    {
      header: 'Fecha de salida',
      field: 'endDate',
      clickable: false,
      image: false,
      money: false,
    },
    {
      header: 'Cliente',
      field: 'title',
      clickable: false,
      image: false,
      money: false,
    },
    {
      header: 'Habitación',
      field: 'facilitiesImport',
      clickable: false,
      image: false,
      money: true,
    },
    {
      header: 'Personas extras',
      field: 'peopleExtraImport',
      clickable: false,
      image: false,
      money: true,
    },
    {
      header: 'Consumo',
      field: 'consumptionsImport',
      clickable: false,
      image: false,
      money: true,
    },
    {
      header: 'Total',
      field: 'total',
      clickable: false,
      image: false,
      money: true,
    },
    {
      header: 'Estado',
      field: 'statusLabel',
      clickable: false,
      image: false,
      money: false,
    },
    {
      field: 'button',
      header: 'Acción',
      clickable: false,
      image: false,
      money: false,
    },
  ];
  cellToAction: any;
  data: any[] = [];
  limit: number = 10;
  page: number = 1;
  startDate: Date = new Date();
  endDate: Date = new Date();
  dni: string | number | null = null;
  private searchDniSubject = new Subject<any>();
  status: string = '';
  callToAction: CallToAction<Booking>[] = [
    {
      type: 'button',
      size: 'small',
      icon: 'pi pi-eye',
      outlined: true,
      pTooltip: 'Ver',
      tooltipPosition: 'bottom',
      click: (rowData: Booking) => this.bookingBookButton(rowData),
    },
    {
      type: 'button',
      size: 'small',
      icon: 'pi pi-times',
      outlined: true,
      pTooltip: 'Cancelar',
      tooltipPosition: 'bottom',
      click: (rowData: Booking) => this.cancelButton(rowData),
    },
  ];

  constructor(
    private cdr: ChangeDetectorRef,
    private readonly datePipe: DatePipe,
    private readonly bookingsService: BookingsService,
    private readonly bookingPaymentTypesService: BookingPaymentTypesService,
    private loadingService: LoadingService,
    private readonly messageService: MessageService,
    private readonly dialogService: DialogService,
  ) {
    // const currentYear = this.startDate.getFullYear();
    // const currentMonth = this.startDate.getMonth();
    // this.endDate = new Date(currentYear, currentMonth + 1, 0);
  }

  ngOnInit(): void {
    this.getOrupdateBookings();
    this.searchDniSubject.pipe(debounceTime(600)).subscribe((dni: any) => {
      this.dni = dni.target.value;
      this.loadingService.sendLoadingState(true);
      this.getOrupdateBookings();
    });
  }

  getOrupdateBookings() {
    this.getBookings(
      this.limit,
      this.page,
      formatDate(this.startDate, this.datePipe),
      formatDate(this.endDate, this.datePipe),
      this.dni,
    );
  }

  filterStartDate(startDate: Date) {
    this.startDate = startDate;
    this.getOrupdateBookings();
  }

  filterEndDate(endDate: Date) {
    this.endDate = endDate;
    this.getOrupdateBookings();
  }

  filterDni(dni: any) {
    this.searchDniSubject.next(dni);
  }

  clearFilter() {
    this.dni = '';
    this.searchDniSubject.next('');
    this.getOrupdateBookings();
  }

  async getBookings(
    limit = this.limit,
    page = this.page,
    startDate = formatDate(this.startDate, this.datePipe),
    endDate = formatDate(this.endDate, this.datePipe),
    dni = this.dni,
  ): Promise<void> {
    this.updatePage(page);
    this.bookingsService
      .callGetList(limit, page, startDate, endDate, dni)
      .subscribe();
    setTimeout(() => {
      this.loadingService.sendLoadingState(false);
    }, 600);
  }

  async onPageSelected(event: PaginatorState) {
    this.updatePage((event.page ?? 0) + 1);
    this.getBookings(event.rows, this.page);
  }

  get bookings(): Observable<Booking[]> {
    return this.bookingsService.getList();
  }

  get total(): Observable<number> {
    return this.bookingsService.getTotal();
  }

  bookingBookButton(booking: Booking) {
    const modal = this.dialogService.open(ReservationFormComponent, {
      header: 'Ejecutar reserva',
      data: {
        bookingId: booking.id,
        customer: booking.customer,
        startDate: booking.startDate,
        total: booking.total || 0,
        totalPaid: booking.totalPaid || 0,
        totalLeft: booking.totalLeft || 0,
        endDate: booking.endDate,
        notes: booking.notes,
        facilities: booking.facilities,
        products: booking.products,
        services: booking.services,
        paymentTypes: booking.paymentTypes,
        additionalPeople: booking.facilities![0].additionalPeople || 0,
        pricePerAdditionalPerson:
          booking.facilities![0].pricePerAdditionalPerson || 0,
        isBooking: false,
        status: booking.status,
      },
    });

    modal.onClose.subscribe({
      next: (value: any) => {
        if (value && value?.success) {
          this.updateBooking(
            booking.id,
            value.paid,
            value.selectedPaymentTypeId,
            value.cash,
            value.card,
          );
          showSuccess(this.messageService, 'Reservación registrada.');
        } else {
          null;
        }
        this.cdr.detectChanges();
      },
    });
  }

  addPaymentType(
    bookingId: number,
    selectedPaymentTypeId: number,
    paid: number = 0,
    cash: number = 0,
    card: number = 0,
  ) {
    const paymentType = {
      payment: paid,
      paymentTypeId: selectedPaymentTypeId,
      cashPayment: cash,
      cardPayment: card,
    };

    this.bookingPaymentTypesService
      .add(
        bookingId,
        paymentType.paymentTypeId,
        paymentType.payment,
        paymentType.cashPayment,
        paymentType.cardPayment,
      )
      .subscribe();
  }

  updateBooking(
    bookingId: number | undefined,
    paid: number = 0,
    selectedPaymentTypeId: number = 0,
    cash: number = 0,
    card: number = 0,
  ) {
    if (bookingId) {
      this.bookingsService
        .changeStatus(bookingId, 'COMPLETED', paid)
        .subscribe({
          next: () => {
            this.getOrupdateBookings();
            this.addPaymentType(
              bookingId,
              selectedPaymentTypeId,
              paid,
              cash,
              card,
            );
          },
        });
    }
  }

  bookingEditButton(id: number | undefined) {
    console.log(id);
  }

  cancelButton(booking: any) {
    this.bookingsService
      .changeStatus(booking.id, 'CANCELLED', booking.total)
      .subscribe({
        next: () => {
          this.getOrupdateBookings();
        },
      });
  }

  private updatePage(value: number): void {
    this.page = value;
  }
}
