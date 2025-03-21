import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { SharedModule } from '../../../../shared/shared.module';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { KeyFilterModule } from 'primeng/keyfilter';
import {
  Cash,
  CashOperation,
  CashType,
  CashUpdate,
  CurrentCash,
} from '../../models/cash.model';
import { CashService } from '../../services/cash.service';
import { currentDateTime } from '../../../../utils/dates';
import { CashesService } from '../../../cash/services/cashes.service';

@Component({
  selector: 'app-cash',
  standalone: true,
  imports: [CommonModule, SharedModule, ReactiveFormsModule, KeyFilterModule],
  templateUrl: './cash.component.html',
  styleUrl: './cash.component.scss',
  providers: [DatePipe],
})
export class CashComponent implements OnInit {
  cashType: CashType = { id: 0, key: '', label: '' };
  currentCash: CurrentCash = {
    id: 0,
    description: '',
    status: '',
    name: '',
    pettyCashAmount: 0,
  };

  employee: any;
  amount: any;
  cashAmount: any;
  cardAmount: any;
  pettyCash: any;
  total: any;

  constructor(
    private readonly datePipe: DatePipe,
    private readonly formBuilder: FormBuilder,
    private readonly dialogRef: DynamicDialogRef,
    private readonly dynamicDialogConfig: DynamicDialogConfig,
    private readonly cashService: CashService,
    private readonly cashesService: CashesService,
  ) {}

  form: FormGroup = this.formBuilder.group({
    cashId: [null],
    cashTypeId: [null],
    date: [null],
    pettyCashAmount: [null],
    name: [null],
    amount: [null, Validators.required],
    cashAmount: [0, Validators.required],
    cardAmount: [0, Validators.required],
    total: [0, Validators.required],
  });

  ngOnInit(): void {
    this.cashType = this.dynamicDialogConfig.data.cashType;
    this.amount = this.dynamicDialogConfig.data.amount;
    this.cashAmount = this.dynamicDialogConfig.data.cashAmount;
    this.cardAmount = this.dynamicDialogConfig.data.cardAmount;
    this.pettyCash = this.dynamicDialogConfig.data.pettyCash;
    this.total = this.dynamicDialogConfig.data.total;
    this.employee = this.dynamicDialogConfig.data.employee;
    this.form.get('amount')?.setValue(this.amount.source._value);
    this.form.get('cashAmount')?.setValue(this.cashAmount.source._value);
    this.form.get('cardAmount')?.setValue(this.cardAmount.source._value);
    this.form.get('pettyCashAmount')?.setValue(this.pettyCash.source._value);
    this.form.get('total')?.setValue(this.total.source._value);
    this.form.get('name')?.setValue(this.employee.source._value);
  }

  getData(cashId: number | undefined) {
    const cash = new CashOperation(this.form.value);
    cash.date = currentDateTime(this.datePipe);
    cash.cashTypeId = this.cashType.id;
    cash.cashId = cashId;
    cash.description =
      this.cashType.id == 4 ? 'Cierre de caja' : 'Apertura de caja';
    return cash;
  }

  createOperation(cashId: number | undefined) {
    this.cashService.createOperation(this.getData(cashId)).subscribe({
      next: () => {
        if (this.cashType.id == 4) {
          this.cashService.updateAmount(0);
          this.cashService.updatePettyCash(0);
          this.cashService.updateCardAmount(0);
          this.cashService.updateCashAmount(0);
          this.cashService.updateEmployee('');
          const body = {
            status: 'CLOSE',
          };
          const cash = new CashUpdate(body);
          this.cashService.updateCash(cashId!, cash).subscribe();
        }
        this.cashService.getCashValidate().subscribe();
        this.cashesService.callGetList().subscribe();
        this.clearData();
        this.dialogRef.close();
      },
    });
  }

  cashSaveButton() {
    this.cashService.currentCash().subscribe({
      next: (currentCash: CurrentCash) => {
        if (Object.keys(currentCash).length === 0) {
          const body = {
            description: 'Caja Principal',
            status: 'OPEN',
            name: this.form.get('name')?.value,
            pettyCashAmount: this.form.get('pettyCashAmount')?.value,
          };
          const cash = new Cash(body);
          this.cashService.createCash(cash).subscribe({
            next: (cash: any) => {
              this.createOperation(cash.id);
            },
          });
        } else {
          this.createOperation(currentCash.id);
        }
      },
    });
  }

  clearData() {
    this.form.get('amount')?.setValue(null);
    this.form.get('cashAmount')?.setValue(null);
    this.form.get('cardAmount')?.setValue(null);
    this.form.get('pettyCashAmount')?.setValue(null);
    this.form.get('total')?.setValue(null);
    this.form.get('name')?.setValue(null);
    this.form.reset;
  }

  get isFormValid(): boolean {
    return this.form.valid;
  }
}
