import { CommonModule, DatePipe } from '@angular/common';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { StepsModule } from 'primeng/steps';
import { ToastModule } from 'primeng/toast';
import { debounceTime, Subject } from 'rxjs';
import { SharedModule } from '../../../../shared/shared.module';
import { Customer } from '../../models/customer.model';
import { CustomersService } from '../../services/customers.service';

@Component({
  selector: 'app-customer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    StepsModule,
    ToastModule,
  ],
  templateUrl: './customer.component.html',
  styleUrl: './customer.component.scss',
  providers: [DatePipe, MessageService],
})
export class CustomerComponent implements OnInit {
  @Output() customerChanges = new EventEmitter<Customer | null>();
  nameQuery: string = '';
  private nameSearchTermSubject = new Subject<string>();

  constructor(private readonly customersService: CustomersService) {}

  ngOnInit(): void {
    this.nameSearchTermSubject.pipe(debounceTime(600)).subscribe(() => {
      this.getCustomer(this.nameQuery);
    });
  }

  getCustomer(dni: string = this.nameQuery): void {
    if (dni && dni.length == 8) {
      this.customersService.getByDni(dni).subscribe({
        next: (customer: Customer) => {
          this.customerChanges.emit(customer);
        },
      });
    } else {
      this.customerChanges.emit(null);
    }
  }

  clearFilter() {
    this.nameQuery = '';
    this.nameSearchTermSubject.next('');
  }

  onSearchTermChange(term: any) {
    this.nameSearchTermSubject.next(term);
  }

  // reservationId: number = 0;
  // isCreate: boolean = false;
  // currentIndex: number = 0;
  // customerId: number = 0;
  // customer: Customer | null | undefined;
  // userFounded: boolean = true;
  // private dniSearchTermSubject = new Subject<string>();
  // reservationForm: FormGroup = this.formBuilder.group({
  //   dni: [null, [Validators.required]],
  //   name: [{ value: null, disabled: true }, Validators.required],
  //   surname: [{ value: null, disabled: true }, Validators.required],
  // });
  // constructor(
  //   private readonly formBuilder: FormBuilder,
  //   private readonly messageService: MessageService,
  //   private readonly customersService: CustomersService,
  //   private readonly dynamicDialogRef: DynamicDialogRef,
  // ) {}
  // ngOnInit(): void {
  //   this.dniSearchTermSubject.pipe(debounceTime(600)).subscribe((dni: any) => {
  //     if (dni.length == 8) {
  //       this.customersService.getByDni(dni).subscribe({
  //         next: (customer: Customer) => {
  //           this.reservationForm.get('name')?.setValue(customer.name);
  //           this.reservationForm.get('surname')?.setValue(customer.surname);
  //           this.customerId = customer.id;
  //           this.customer = customer;
  //         },
  //         error: () => {
  //           showError(
  //             this.messageService,
  //             'No se encontró el cliente. Ingreseló manualmente',
  //           );
  //           this.userFounded = false;
  //           this.customerId = 0;
  //           this.customer = null;
  //           this.reservationForm.get('name')?.setValue(null);
  //           this.reservationForm.get('surname')?.setValue(null);
  //           this.enableFields();
  //         },
  //       });
  //     } else {
  //       this.reservationForm.get('name')?.setValue(null);
  //       this.reservationForm.get('surname')?.setValue(null);
  //       this.userFounded = false;
  //       this.customerId = 0;
  //       this.customer = null;
  //     }
  //   });
  // }
  // enableFields(allFields: boolean = true) {
  //   if (!allFields) {
  //     this.reservationForm.get('dni')?.enable();
  //   }
  //   this.reservationForm.get('name')?.enable();
  //   this.reservationForm.get('surname')?.enable();
  // }
  // disableFields(allFields: boolean = true) {
  //   if (!allFields) {
  //     this.reservationForm.get('dni')?.disable();
  //   }
  //   this.reservationForm.get('name')?.disable();
  //   this.reservationForm.get('surname')?.disable();
  // }
  // searchDni(term: any) {
  //   const input = term.target.value;
  //   const sanitizedInput = input.replace(/\D/g, '');
  //   if (sanitizedInput) {
  //     this.dniSearchTermSubject.next(sanitizedInput);
  //   }
  // }
  // buttonSaveReservation() {
  //   if (!this.userFounded) {
  //     const person: DniConsultation = this.reservationForm.value;
  //     this.customersService.create(person).subscribe({
  //       next: (response: CreatedCustomer) => {
  //         this.customerId = response.customer.id;
  //         this.customer = response.customer;
  //         this.userFounded = true;
  //         this.disableFields(false);
  //         this.dynamicDialogRef.close({
  //           success: true,
  //           customer: this.customer,
  //         });
  //       },
  //       error: () => {
  //         showError(
  //           this.messageService,
  //           'No se encontró el cliente. Ingreseló manualmente',
  //         );
  //         this.userFounded = false;
  //         this.customerId = 0;
  //         this.customer = null;
  //         this.enableFields();
  //       },
  //     });
  //   } else {
  //     this.dynamicDialogRef.close({ success: true, customer: this.customer });
  //   }
  // }
  // get isFormValid(): boolean {
  //   const dni = this.reservationForm.get('dni')?.value;
  //   if (dni && dni.length == 8) {
  //     return this.reservationForm.valid;
  //   } else {
  //     return false;
  //   }
  // }
}
