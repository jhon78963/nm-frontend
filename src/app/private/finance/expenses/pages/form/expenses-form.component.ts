import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ExpensesService } from '../../services/expenses.service';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { DatePipe } from '@angular/common';
import { UsersService } from '../../../../administration/users/services/users.service';
import { Observable } from 'rxjs';
import { User } from '../../../../administration/users/models/users.model';
import { Expense } from '../../models/expenses.model';
import { formatDateForApi } from '../../../../../utils/dates';

@Component({
  selector: 'app-expenses-form',
  templateUrl: './expenses-form.component.html',
  styleUrl: './expenses-form.component.scss',
})
export class ExpenseFormComponent implements OnInit {
  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly expensesService: ExpensesService,
    private readonly usersService: UsersService,
    private readonly dynamicDialogRef: DynamicDialogRef,
    private readonly dynamicDialogConfig: DynamicDialogConfig,
    private readonly datePipe: DatePipe,
  ) {}

  ngOnInit(): void {
    this.usersService.callGetList().subscribe();
    this.cleanUserID();
    if (this.dynamicDialogConfig.data.id) {
      const id = this.dynamicDialogConfig.data.id;
      this.expensesService.getOne(id).subscribe((response: Expense) => {
        this.form.patchValue(response);
      });
    }
  }

  form: FormGroup = this.formBuilder.group({
    expenseDate: [new Date(), Validators.required],
    description: ['', Validators.required],
    category: ['', Validators.required],
    amount: [0, Validators.required],
    paymentMethod: ['', Validators.required],
    referenceCode: ['', Validators.nullValidator],
    userId: [0, Validators.required],
  });

  categories = [
    { id: 'SERVICIOS', name: 'Servicios (Luz, Agua, Internet)' },
    { id: 'ALQUILER', name: 'Alquiler de Local' },
    { id: 'PERSONAL', name: 'Personal / Vigilancia' },
    { id: 'MOBILIARIO', name: 'Mobiliario / Activos (Maniquíes, Estantes)' },
    { id: 'MERCADERIA', name: 'Compra de Mercadería' },
    { id: 'INSUMOS', name: 'Insumos (Bolsas, Limpieza)' },
    { id: 'VIATICOS', name: 'Viáticos (Pasajes, Alimentos)' },
    { id: 'IMPUESTOS', name: 'Impuestos / Trámites' },
    { id: 'OTROS', name: 'Otros Gastos' },
  ];
  paymentMethods = [
    { id: 'CASH', name: 'Efectivo' },
    { id: 'YAPE', name: 'Yape' },
    { id: 'TRANSFER', name: 'Transferencia Bancaria' },
  ];

  // buttonSaveSale(): void {
  //   if (this.form.valid) {
  //     this.form
  //       .get('expenseDate')
  //       ?.setValue(
  //         formatDateTime(this.form.get('expenseDate')?.value, this.datePipe),
  //       );
  //     const expense = new Expense(this.form.value);
  //     const id = this.dynamicDialogConfig.data.id;

  //     if (id) {
  //       this.expensesService.edit(id, expense).subscribe({
  //         next: () => this.dynamicDialogRef.close({ success: true }),
  //         error: () => {},
  //       });
  //     } else {
  //       this.expensesService.create(expense).subscribe({
  //         next: () => {
  //           this.dynamicDialogRef.close({ success: true });
  //           this.form.reset();
  //         },
  //         error: () => {},
  //       });
  //     }
  //   }
  // }

  buttonSaveSale(): void {
    if (this.form.valid) {
      // CORRECCIÓN 2: No usar setValue en el form. Usar getRawValue() y crear una copia.
      const formValue = this.form.getRawValue();

      // Creamos el payload limpio
      const expensePayload = {
        ...formValue,
        // Formateamos la fecha AQUÍ, solo para enviarla, sin tocar el formulario visual
        expenseDate: formatDateForApi(formValue.expenseDate, this.datePipe),
      };

      const id = this.dynamicDialogConfig.data.id;

      if (id) {
        this.expensesService.edit(id, expensePayload).subscribe({
          next: () => this.dynamicDialogRef.close({ success: true }),
          error: err => console.error(err),
        });
      } else {
        this.expensesService.create(expensePayload).subscribe({
          next: () => {
            this.dynamicDialogRef.close({ success: true });
            // Opcional: form.reset() no es necesario si cierras el modal
          },
          error: err => console.error(err),
        });
      }
    } else {
      // Buena práctica: Marcar todos como tocados para que salgan los errores rojos
      this.form.markAllAsTouched();
    }
  }

  private cleanUserID(): void {
    this.form.get('userID')?.setValue(0);
  }

  get users(): Observable<User[]> {
    return this.usersService.getList();
  }

  get isFormValid(): boolean {
    return this.form.valid;
  }
}
