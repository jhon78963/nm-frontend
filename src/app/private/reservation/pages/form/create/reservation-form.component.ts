import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { CheckboxModule } from 'primeng/checkbox';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { RadioButtonModule } from 'primeng/radiobutton';
import { TooltipModule } from 'primeng/tooltip';
import { forkJoin, switchMap } from 'rxjs';
import {
  currentDateTime,
  formatDateTime,
  formatDateTimeFromLocal,
} from '../../../../../utils/dates';
import { Booking, CheckSchedule } from '../../../models/booking.model';
import { Customer } from '../../../models/customer.model';
import { FacilityType } from '../../../models/facility.model';
import { PaymentType } from '../../../models/payment-type.model';
import {
  LockerReservation,
  PersonalReservation,
  RoomReservation,
} from '../../../models/reservation.model';
import { BookingPaymentTypesService } from '../../../services/bookings/booking-payment-types.service';
import { BookingProductsService } from '../../../services/bookings/booking-products.service';
import { BookingRoomsService } from '../../../services/bookings/booking-rooms.service';
import { BookingServicesService } from '../../../services/bookings/booking-services.service';
import { BookingsService } from '../../../services/bookings/bookings.service';
import { CashService } from '../../../services/cash.service';
import { FacilitiesService } from '../../../services/facilities.service';
import { ReservationLockersService } from '../../../services/reservations/reservation-lockers.service';
import { ReservationPaymentTypesService } from '../../../services/reservations/reservation-payment-types.service';
import { ReservationProductsService } from '../../../services/reservations/reservation-products.service';
import { ReservationRoomsService } from '../../../services/reservations/reservation-rooms.service';
import { ReservationServicesService } from '../../../services/reservations/reservation-services.service';
import { ReservationsService } from '../../../services/reservations/reservations.service';
import { MessagesModule } from 'primeng/messages';
import { showToastWarn } from '../../../../../utils/notifications';
import { ReservationInventoriesService } from '../../../services/reservations/reservation-inventories.service';
import { Inventory } from '../../../../facility/inventory/models/inventory.model';

@Component({
  selector: 'app-reservation-form',
  standalone: true,
  imports: [
    ButtonModule,
    CalendarModule,
    CheckboxModule,
    CommonModule,
    FormsModule,
    InputNumberModule,
    MessagesModule,
    RadioButtonModule,
    TooltipModule,
  ],
  templateUrl: './reservation-form.component.html',
  styleUrl: './reservation-form.component.scss',
  providers: [DatePipe, MessageService],
})
export class ReservationFormComponent implements OnInit {
  [x: string]: any;
  products: any[] = [];
  services: any[] = [];
  facilities: any[] = [];
  inventories: any[] = [];
  paymentTypes: any[] = [];
  customer: any;
  totalProducts: number = 0;
  totalServices: number = 0;
  lockerPrice: number = 0;
  total: number = 0;
  pricePerAdditionalPerson: number = 0;
  additionalPeople: number = 0;
  pricePerExtraHour: number = 0;
  extraHours: number = 0;
  brokenThings: number = 0;
  reservationId: number = 0;
  bookingId: number = 0;
  notes: string = '';
  status: string = '';
  payments: PaymentType[] = [
    { id: 1, description: 'Efectivo' },
    { id: 2, description: 'Tarjeta' },
    { id: 3, description: 'Mixto' },
  ];
  selectedPaymentType: any = this.payments[0];
  previousPaymentType: PaymentType = {
    id: 0,
    description: '',
  };

  paid: number = 0;
  cash: number = 0;
  card: number = 0;
  advance: number = 0;
  pending: number = 0;
  newPending: number = 0;

  isBooking: boolean = false;
  isBookingView: boolean = false;
  isReservationPayment: boolean = true;
  isList: boolean = false;
  startDate: Date = new Date();

  startDateBooking: string | null = null;
  endDateBooking: string | null = null;
  totalPaidBooking: number = 0;

  conflict: boolean = false;

  isFinish: boolean = false;
  originalPaid: number | null = null;

  constructor(
    private cdr: ChangeDetectorRef,
    private readonly cashService: CashService,
    private readonly datePipe: DatePipe,
    private readonly messageService: MessageService,
    private readonly dynamicDialogConfig: DynamicDialogConfig,
    private readonly dynamicDialogRef: DynamicDialogRef,
    private readonly facilitiesService: FacilitiesService,
    private readonly reservationLockersService: ReservationLockersService,
    private readonly reservationPaymentTypesService: ReservationPaymentTypesService,
    private readonly reservationProductsService: ReservationProductsService,
    private readonly reservationRoomsService: ReservationRoomsService,
    private readonly reservationServicesService: ReservationServicesService,
    private readonly reservationInventoriesService: ReservationInventoriesService,
    private readonly reservationsService: ReservationsService,
    private readonly bookingPaymentTypesService: BookingPaymentTypesService,
    private readonly bookingServicesService: BookingServicesService,
    private readonly bookingProductsService: BookingProductsService,
    private readonly bookingRoomsService: BookingRoomsService,
    private readonly bookingsService: BookingsService,
  ) {}

  getOperationType() {
    this.isBooking = this.dynamicDialogConfig.data.isBooking;
    this.isList = this.dynamicDialogConfig.data.isList;
  }

  getCustomer() {
    this.reservationId = this.dynamicDialogConfig.data.reservationId;
    this.bookingId = this.dynamicDialogConfig.data.bookingId;
    if (this.dynamicDialogConfig.data.isReservationPayment) {
      this.isReservationPayment =
        this.dynamicDialogConfig.data.isReservationPayment;
    }
    this.customer = this.dynamicDialogConfig.data.customer;
  }

  getFacilities(): void {
    this.facilities = this.dynamicDialogConfig.data.facilities;
    if (this.facilities?.length) {
      this.facilities.forEach((facility: any, index: number) => {
        if ((index + 1) % 4 === 0) {
          this.lockerPrice += 10;
        } else {
          this.lockerPrice += facility.price;
        }
      });
    } else {
      this.lockerPrice = 0;
    }
  }

  getInventories(): void {
    this.inventories = this.dynamicDialogConfig.data.inventories;
  }

  getProducts() {
    if (this.dynamicDialogConfig.data.products) {
      this.products = this.dynamicDialogConfig.data.products
        .filter((product: any) => product.type == 'product')
        .map((product: any) => {
          if (product.isFree) {
            product.total = 0;
          } else {
            product.total = product.quantity * product.price;
          }
          return product;
        });
      this.totalProducts = this.products
        ?.filter(product => product.price)
        .reduce((sum, product) => sum + product.total, 0);
    }
  }

  getServices() {
    this.isBookingView = this.dynamicDialogConfig.data.isBookingView;
    if (this.isBookingView) {
      const services = this.dynamicDialogConfig.data.services;
      if (services.length > 0) {
        this.services = services.filter(
          (product: any) => product.type == 'service',
        );
        this.services = this.services.map((service: any) => {
          if (service.isFree) {
            service.total = 0;
          } else {
            service.total = service.quantity * service.price;
          }
          return service;
        });
        this.totalServices = this.services
          ?.filter(product => product.price)
          .reduce((sum, product) => sum + product.total, 0);
      }
    } else {
      if (this.dynamicDialogConfig.data.products) {
        this.services = this.dynamicDialogConfig.data.products.filter(
          (product: any) => product.type == 'service',
        );
        this.services = this.services.map((service: any) => {
          if (service.isFree) {
            service.total = 0;
          } else {
            service.total = service.quantity * service.price;
          }
          return service;
        });
        this.totalServices = this.services
          ?.filter(product => product.price)
          .reduce((sum, product) => sum + product.total, 0);
      }
    }
  }

  getNotes() {
    this.notes = this.dynamicDialogConfig.data.notes;
  }

  getPricePerAdditionalPerson() {
    if (this.dynamicDialogConfig.data.additionalPeople) {
      this.additionalPeople = this.dynamicDialogConfig.data.additionalPeople;
      this.pricePerAdditionalPerson =
        this.additionalPeople == 0
          ? 0
          : this.dynamicDialogConfig.data.pricePerAdditionalPerson *
            this.additionalPeople;
    }
  }

  getPriceExtraHours() {
    if (this.dynamicDialogConfig.data.extraHours) {
      this.extraHours = this.dynamicDialogConfig.data.extraHours;
      this.pricePerExtraHour =
        this.extraHours == 0
          ? 0
          : this.dynamicDialogConfig.data.pricePerExtraHour * this.extraHours;
    }
  }

  getBrokenThings() {
    if (this.dynamicDialogConfig.data.brokenThings) {
      this.brokenThings = this.dynamicDialogConfig.data.brokenThings;
    }
  }

  getTotal() {
    this.total =
      (this.totalProducts ?? 0) +
      (this.totalServices ?? 0) +
      this.lockerPrice +
      (this.pricePerAdditionalPerson ?? 0) +
      (this.pricePerExtraHour ?? 0) +
      (Number(this.brokenThings) ?? 0);
  }

  getTotalWithoutProducts() {
    const total =
      this.lockerPrice +
      (this.pricePerAdditionalPerson ?? 0) +
      (this.pricePerExtraHour ?? 0) +
      (Number(this.brokenThings) ?? 0);
    this.newPending = total - this.pending;
  }

  calculateTotalPaid(): void {
    const calculateSum = (
      items: any[],
      filters: ((item: any) => boolean)[],
    ): number => {
      return filters
        .map(
          filter =>
            items?.filter(filter).reduce((sum, item) => sum + item.total, 0) ||
            0,
        )
        .reduce((total, current) => total + current, 0);
    };

    this.paid += calculateSum(this.facilities || [], [
      facility => facility.isPaid,
    ]);

    this.paid += calculateSum(this.products || [], [
      product => product.isPaid && product.isAdd,
      product => product.isPaid && product.isBd && !product.isPaidBd,
    ]);

    this.paid += calculateSum(this.services || [], [
      service => service.isPaid && service.isAdd,
      service => service.isPaid && service.isBd && !service.isPaidBd,
    ]);
  }

  getPaymentTypes() {
    this.paymentTypes = this.dynamicDialogConfig.data.paymentTypes;
    if (
      (this.reservationId || this.bookingId) &&
      this.paymentTypes.length > 0
    ) {
      this.paymentTypes.forEach((payment: any) => {
        this.paid = 0;
        this.cash = 0;
        this.card = 0;
        this.advance += payment.paid;
        this.pending = this.total - this.advance;
      });
    }
    this.calculateTotalPaid();
  }

  validatePaid() {
    if (this.reservationId || this.bookingId) {
      this.paid = this.pending;
    }
  }

  finishReservation(isFinish: boolean): void {
    if (isFinish) {
      if (this.originalPaid === null) {
        this.originalPaid = this.paid;
      }
      this.paid = this.pending;
    } else {
      if (this.originalPaid !== null) {
        this.paid = this.originalPaid;
        this.originalPaid = null;
      }
    }
  }

  getStatus() {
    this.status = this.dynamicDialogConfig.data.status;
  }

  getDate() {
    if (this.dynamicDialogConfig.data.startDate) {
      this.startDateBooking = this.dynamicDialogConfig.data.startDate;
      this.endDateBooking = this.dynamicDialogConfig.data.endDate;
      this.totalPaidBooking = this.dynamicDialogConfig.data.totalPaid;
    }
  }

  ngOnInit(): void {
    this.clearPayments();
    this.getOperationType();
    this.getCustomer();
    this.getFacilities();
    this.getInventories();
    this.getProducts();
    this.getServices();
    this.getNotes();
    this.getPricePerAdditionalPerson();
    this.getPriceExtraHours();
    this.getBrokenThings();
    this.getTotal();
    this.getPaymentTypes();
    // this.validatePaid();
    this.getStatus();
    this.getDate();
    // this.getTotalWithoutProducts();
  }

  plusTotalPayment(event: any, price: number) {
    event.checked ? (this.paid += price) : (this.paid -= price);
  }

  calculateTotalCash(cash: any) {
    this.card = this.paid - cash;
  }

  calculateTotalCard(card: any) {
    this.cash = this.paid - card;
  }

  validatePaidButton() {
    if (this.selectedPaymentType.id == 3) {
      if (this.cash < 0) {
        return true;
      }
      if (this.card < 0) {
        return true;
      }
      if (this.cash + this.card != this.paid) {
        return true;
      }
    }

    if (this.conflict) {
      return true;
    }

    if (this.selectedPaymentType.id == 1 || this.selectedPaymentType.id == 2) {
      if (this.paid < 0) {
        return true;
      }
    }

    return false;
  }

  validateFacilities(facilities: any[]) {
    return {
      rooms: facilities.filter(f => f.type == FacilityType.ROOM),
      lockers: facilities.filter(f => f.type == FacilityType.LOCKER),
    };
  }

  payment(
    customer: Customer | null | undefined,
    reservationId: number | null | undefined,
    facilities: any[],
    products: any[],
    services: any[],
    total: number,
  ) {
    const newFacilities = this.validateFacilities(facilities);
    if (newFacilities.rooms.length > 0) {
      this.createRoomReservation(
        customer,
        reservationId,
        newFacilities.rooms,
        products,
        services,
        total,
      );
    }
    if (newFacilities.lockers.length > 0) {
      this.createLockerReservation(
        customer,
        reservationId,
        newFacilities.lockers,
        products,
        services,
        total,
      );
    }
    if (newFacilities.rooms.length == 0 && newFacilities.lockers.length == 0) {
      this.createPersonalReservation(customer, products, services, total);
    }
  }

  validateReservationData(
    status: string,
    endDate: string | null | undefined,
    products: any[],
    services: any[],
    facilities: any[],
  ) {
    if (this.paid == this.pending && this.isFinish) {
      status = 'COMPLETED';
      products.forEach(p => (p.isPaid = true));
      services.forEach(s => (s.isPaid = true));
      facilities.forEach(f => (f.isPaid = true));
      endDate = currentDateTime(this.datePipe);
    }

    const newProducts = products.filter(p => p.isAdd == true);
    products = products.filter(p => p.isAdd != true);
    const paidProducts = products.filter(p => p.isPaid == true);
    const newServices = services.filter(s => s.isAdd == true);
    services = services.filter(s => s.isAdd != true);
    const paidServices = services.filter(s => s.isPaid == true);
    const paidFacilities = facilities.filter(f => f.isPaid == true);
    const brokenThingsImport = this.brokenThings ? this.brokenThings : 0;

    return {
      status,
      endDate,
      newProducts,
      paidProducts,
      newServices,
      paidServices,
      paidFacilities,
      brokenThingsImport,
    };
  }

  createInventory(reservationId: number, inventories: Inventory[]) {
    if (inventories) {
      inventories.forEach((inventory: Inventory) => {
        if (inventory.id && inventory.quantity) {
          this.reservationInventoriesService
            .add(reservationId, inventory.id, inventory.quantity)
            .subscribe();
        }
      });
    }
  }

  reservationData(
    customer: Customer | null | undefined,
    total: number,
    reservationTypeId: number,
    startDate?: string | null,
    endDate?: string | null,
    brokenThingsImport?: number,
  ) {
    return {
      startDate: startDate,
      endDate: reservationTypeId == 3 ? startDate : endDate,
      customerId: customer!.id,
      total: total,
      totalPaidCash: this.paid,
      totalPaid: this.paid + this.totalPaidBooking,
      peopleExtraImport: this.pricePerAdditionalPerson,
      hoursExtraImport: this.pricePerExtraHour,
      facilitiesImport: this.lockerPrice,
      consumptionsImport: this.totalProducts + this.totalServices,
      reservationTypeId: reservationTypeId,
      status: reservationTypeId == 3 ? 'COMPLETED' : 'IN_USE',
      brokenThingsImport: brokenThingsImport,
      notes: this.notes,
    };
  }

  createLockerReservation(
    customer: Customer | null | undefined,
    reservationId: number | null | undefined,
    facilities: any[],
    products: any[],
    services: any[],
    total: number,
  ) {
    if (reservationId) {
      const reservationData = this.reservationData(customer, total, 1);
      const reservationSummary = this.validateReservationData(
        reservationData.status,
        reservationData.endDate,
        products,
        services,
        facilities,
      );
      reservationData.status = reservationSummary.status;
      reservationData.brokenThingsImport =
        reservationSummary.brokenThingsImport;
      reservationData.endDate = reservationSummary.endDate;
      const reservation = new LockerReservation(reservationData);
      this.reservationsService.update(reservationId, reservation).subscribe({
        next: () => {
          this.createInventory(reservationId, this.inventories);
          this.updateReservation(
            reservationId,
            reservationSummary.newProducts,
            reservationSummary.paidProducts,
            reservationSummary.newServices,
            reservationSummary.paidServices,
          );
          this.addPaymentType(reservationId, reservationSummary.paidFacilities);
          this.lockerUpdateReservation(
            reservationId,
            reservationSummary.paidFacilities,
            reservationData.status,
          );
        },
        error: () => {},
      });
    } else {
      const startDate = currentDateTime(this.datePipe);
      const reservationData = this.reservationData(
        customer,
        total,
        1,
        startDate || null,
        null,
      );
      const reservation = new LockerReservation(reservationData);
      this.reservationsService.create(reservation).subscribe({
        next: (response: any) => {
          this.createInventory(response.reservationId, this.inventories);
          this.createBookingOrReservation(
            response.reservationId,
            products,
            services,
          );
          this.lockerCreateReservation(response.reservationId, facilities);
        },
      });
    }
  }

  createRoomReservation(
    customer: Customer | null | undefined,
    reservationId: number | null | undefined,
    facilities: any[],
    products: any[],
    services: any[],
    total: number,
  ) {
    if (reservationId) {
      const reservationData = this.reservationData(customer, total, 2);
      const reservationSummary = this.validateReservationData(
        reservationData.status,
        reservationData.endDate,
        products,
        services,
        facilities,
      );
      reservationData.status = reservationSummary.status;
      reservationData.brokenThingsImport =
        reservationSummary.brokenThingsImport;
      reservationData.endDate = reservationSummary.endDate;

      const reservation = new RoomReservation(reservationData);
      this.reservationsService.update(reservationId, reservation).subscribe({
        next: () => {
          this.createInventory(reservationId, this.inventories);
          this.updateReservation(
            reservationId,
            reservationSummary.newProducts,
            reservationSummary.paidProducts,
            reservationSummary.newServices,
            reservationSummary.paidServices,
          );
          this.addPaymentType(reservationId, reservationSummary.paidFacilities);
          this.roomUpdateReservation(
            reservationId,
            reservationSummary.paidFacilities,
            reservationData.status,
          );
        },
        error: () => {},
      });
    } else {
      const startDate = currentDateTime(this.datePipe);
      const reservationData = this.reservationData(
        customer,
        total,
        2,
        startDate || null,
        null,
      );
      if (this.startDateBooking) {
        reservationData.startDate = this.startDateBooking;
        reservationData.endDate = this.endDateBooking;
      }
      const reservation = new RoomReservation(reservationData);
      this.reservationsService.create(reservation).subscribe({
        next: (response: any) => {
          this.createInventory(response.reservationId, this.inventories);
          this.createBookingOrReservation(
            response.reservationId,
            products,
            services,
          );
          this.roomCreateBookingOrReservation(
            response.reservationId,
            facilities,
          );
        },
      });
    }
  }

  createPersonalReservation(
    customer: Customer | null | undefined,
    products: any[],
    services: any[],
    total: number,
  ) {
    const startDate = currentDateTime(this.datePipe);
    const reservationData = this.reservationData(
      customer,
      total,
      3,
      startDate || null,
      null,
    );
    reservationData.brokenThingsImport = this.brokenThings
      ? this.brokenThings
      : 0;
    const reservation = new PersonalReservation(reservationData);
    this.reservationsService.create(reservation).subscribe({
      next: (response: any) => {
        this.createInventory(response.reservationId, this.inventories);
        this.createBookingOrReservation(
          response.reservationId,
          products,
          services,
        );
        this.closeModal();
      },
    });
  }

  addPaymentType(
    bookingOrReservationId: number,
    paidFacilities?: any[],
    isBooking: boolean = false,
  ) {
    const paymentType = {
      payment: this.paid + this.totalPaidBooking,
      paymentTypeId: this.selectedPaymentType.id,
      cashPayment: this.cash,
      cardPayment: this.card,
    };

    if (isBooking) {
      this.bookingPaymentTypesService
        .add(
          bookingOrReservationId,
          paymentType.paymentTypeId,
          paymentType.payment,
          paymentType.cashPayment,
          paymentType.cardPayment,
        )
        .subscribe();
    } else {
      this.reservationPaymentTypesService
        .add(
          bookingOrReservationId,
          paymentType.paymentTypeId,
          paymentType.payment,
          paymentType.cashPayment,
          paymentType.cardPayment,
          this.isReservationPayment,
        )
        .subscribe();
    }
    if (paidFacilities && paidFacilities.length == 0) {
      this.closeModal();
    }
  }

  createBookingOrReservation(
    bookingOrReservationId: number,
    products: any[],
    services: any[],
    isBooking: boolean = false,
  ) {
    this.addPaymentType(bookingOrReservationId, undefined, isBooking);
    if (isBooking) {
      products.forEach((product: any) => {
        this.bookingProductsService
          .add(
            bookingOrReservationId,
            product.id,
            product.quantity,
            product.isPaid,
            product.isFree,
          )
          .subscribe();
      });
      services.forEach((service: any) => {
        this.bookingServicesService
          .add(
            bookingOrReservationId,
            service.id,
            service.quantity,
            service.isPaid,
            service.isFree,
          )
          .subscribe();
      });
    } else {
      products.forEach((product: any) => {
        this.reservationProductsService
          .add(
            bookingOrReservationId,
            product.id,
            product.quantity,
            product.isPaid,
            product.isFree,
          )
          .subscribe();
      });
      services.forEach((service: any) => {
        this.reservationServicesService
          .add(
            bookingOrReservationId,
            service.id,
            service.quantity,
            service.isPaid,
            service.isFree,
          )
          .subscribe();
      });
    }
  }

  lockerCreateReservation(reservationId: number, facilities: any[]) {
    const reservationRequests = facilities.map((facility: any) => {
      return this.reservationLockersService
        .add(reservationId, facility.id, facility.price, facility.isPaid)
        .pipe(
          switchMap(() => {
            const body: any = {
              id: facility.id,
              status: 'IN_USE',
            };
            return this.facilitiesService.changeLockerStatus(facility.id, body);
          }),
        );
    });
    forkJoin(reservationRequests).subscribe({
      next: () => {
        this.closeModal();
      },
    });
  }

  roomCreateBookingOrReservation(
    bookingOrReservationId: number,
    facilities: any[],
    isBooking: boolean = false,
  ) {
    if (isBooking) {
      const bookingRequests = facilities.map((facility: any) => {
        return this.bookingRoomsService.add(
          bookingOrReservationId,
          facility.id,
          facility.price,
          facility.isPaid,
          this.additionalPeople,
        );
      });
      forkJoin(bookingRequests).subscribe({
        next: () => {
          this.closeModal();
        },
      });
    } else {
      const reservationRequests = facilities.map((facility: any) => {
        return this.reservationRoomsService
          .add(
            bookingOrReservationId,
            facility.id,
            facility.price,
            facility.isPaid,
            this.additionalPeople,
            this.extraHours,
          )
          .pipe(
            switchMap(() => {
              const body = {
                id: facility.id,
                status: 'IN_USE',
              };
              return this.facilitiesService.changeRoomStatus(facility.id, body);
            }),
          );
      });
      forkJoin(reservationRequests).subscribe({
        next: () => {
          this.closeModal(
            this.paid,
            this.selectedPaymentType.id,
            this.cash,
            this.card,
          );
        },
      });
    }
  }

  updateReservation(
    reservationId: number,
    newProducts: any[],
    paidProducts: any[],
    newServices: any[],
    paidServices: any[],
  ) {
    if (newProducts.length > 0) {
      newProducts.forEach((product: any) => {
        this.reservationProductsService
          .add(
            reservationId,
            product.id,
            product.quantity,
            product.isPaid,
            product.isFree,
          )
          .subscribe();
      });
    }
    if (paidProducts.length > 0) {
      const products = paidProducts.filter(p => p.isSent);
      products.forEach((product: any) => {
        this.reservationProductsService
          .modify(
            reservationId,
            product.id,
            product.quantity,
            product.isPaid,
            product.isPaidBd,
            product.isFree,
          )
          .subscribe();
      });
    }
    if (newServices.length > 0) {
      newServices.forEach((service: any) => {
        this.reservationServicesService
          .add(
            reservationId,
            service.id,
            service.quantity,
            service.isPaid,
            service.isFree,
          )
          .subscribe();
      });
    }
    if (paidServices.length > 0) {
      const services = paidServices.filter(s => s.isSent);
      services.forEach((service: any) => {
        this.reservationServicesService
          .modify(
            reservationId,
            service.id,
            service.quantity,
            service.isPaid,
            service.isPaidBd,
            service.isFree,
          )
          .subscribe();
      });
    }
  }

  lockerUpdateReservation(
    reservationId: number,
    paidFacilities: any[],
    reservationStatus: string,
  ) {
    if (paidFacilities.length > 0) {
      const reservationRequests = paidFacilities.map((facility: any) => {
        return this.reservationLockersService
          .modify(reservationId, facility.id, facility.isPaid)
          .pipe(
            switchMap(() => {
              const body: any = {
                id: facility.id,
                status: 'IN_USE',
              };
              if (reservationStatus == 'COMPLETED') {
                body.status = 'AVAILABLE';
              }
              return this.facilitiesService.changeLockerStatus(
                facility.id,
                body,
              );
            }),
          );
      });
      if (reservationRequests.length > 0) {
        forkJoin(reservationRequests).subscribe({
          next: () => {
            this.closeModal();
          },
        });
      } else {
        this.closeModal();
      }
    }
  }

  roomUpdateReservation(
    reservationId: number,
    paidFacilities: any[],
    reservationStatus: string,
  ) {
    if (paidFacilities.length > 0) {
      const reservationRequests = paidFacilities.map((facility: any) => {
        return this.reservationRoomsService
          .modify(
            reservationId,
            facility.id,
            facility.isPaid,
            this.additionalPeople,
            this.extraHours,
          )
          .pipe(
            switchMap(() => {
              const body: any = {
                id: facility.id,
                status: 'IN_USE',
              };
              if (reservationStatus == 'COMPLETED') {
                body.status = 'AVAILABLE';
              }
              return this.facilitiesService.changeRoomStatus(facility.id, body);
            }),
          );
      });
      if (reservationRequests.length > 0) {
        forkJoin(reservationRequests).subscribe({
          next: () => {
            this.clearPayments();
            this.dynamicDialogRef.close({ success: true });
          },
        });
      } else {
        this.clearPayments();
        this.dynamicDialogRef.close({ success: true });
      }
    }
  }

  booking(
    customer: Customer | null | undefined,
    facilities: any[],
    products: any[],
    services: any[],
    total: number,
  ) {
    const newFacilities = this.validateFacilities(facilities);
    if (newFacilities.rooms.length > 0) {
      this.createRoomBooking(
        customer,
        newFacilities.rooms,
        products,
        services,
        total,
      );
    }
  }

  bookingData(customer: Customer | null | undefined, total: number) {
    return {
      startDate: formatDateTime(this.startDate, this.datePipe),
      customerId: customer!.id,
      total: total,
      totalPaid: this.paid,
      peopleExtraImport: this.pricePerAdditionalPerson,
      facilitiesImport: this.lockerPrice,
      consumptionsImport: this.totalProducts + this.totalServices,
      status: 'PENDING',
      notes: this.notes,
      description: `${customer!.dni} - ${customer!.name} ${customer!.surname}`,
    };
  }

  createRoomBooking(
    customer: Customer | null | undefined,
    facilities: any[],
    products: any[],
    services: any[],
    total: number,
  ) {
    const bookingData = this.bookingData(customer, total);
    const booking = new Booking(bookingData);
    this.bookingsService.create(booking).subscribe({
      next: (response: any) => {
        this.createBookingOrReservation(
          response.bookingId,
          products,
          services,
          true,
        );
        this.roomCreateBookingOrReservation(
          response.bookingId,
          facilities,
          true,
        );
      },
    });
  }

  checkSchedule(roomId: number, startDate: string | null) {
    this.bookingsService.checkSchedule(roomId, startDate).subscribe({
      next: (resp: CheckSchedule) => {
        if (resp.conflict) {
          this.messageService.clear();
          this.conflict = resp.conflict;
          showToastWarn(
            this.messageService,
            `El horario seleccionado (${resp.conflictingStartDate} - ${resp.conflictingEndDate}) ya está reservado. Por favor, elija otro.`,
          );
        } else {
          this.conflict = false;
          this.messageService.clear();
        }
      },
    });
  }

  onDateSelectFrom(event: any) {
    const roomId = this.facilities[0].id;
    const dateAdjusted = this.adjustMinutes(event);
    const startDate = formatDateTime(dateAdjusted, this.datePipe);
    this.checkSchedule(roomId, startDate);
  }

  onDateInputFrom(event: any) {
    if (event.target.value.length == 16) {
      const roomId = this.facilities[0].id;
      const startDate = formatDateTimeFromLocal(
        event.target.value,
        this.datePipe,
      );
      this.checkSchedule(roomId, startDate);
    }
  }

  adjustMinutes(date: any) {
    if (this.startDate) {
      this.startDate = date;
      const minutes = this.startDate.getMinutes();
      const adjustedMinutes = Math.round(minutes / 10) * 10;
      this.startDate.setMinutes(adjustedMinutes);
    }
    return this.startDate;
  }

  closeModal(
    paid: number = 0,
    selectedPaymentTypeId: number = 0,
    cash: number = 0,
    card: number = 0,
  ) {
    this.clearPayments();
    this.dynamicDialogRef.close({
      success: true,
      paid,
      selectedPaymentTypeId,
      cash,
      card,
    });
  }

  clearPayments() {
    this.paid = 0;
    this.cash = 0;
    this.card = 0;
    this.advance = 0;
    this.pending = 0;
    this.newPending = 0;
    this.paymentTypes = [];
  }
}
