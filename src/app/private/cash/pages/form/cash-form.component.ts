import { CommonModule, DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { KeyFilterModule } from 'primeng/keyfilter';
import { SharedModule } from '../../../../shared/shared.module';
import { currentDateTime } from '../../../../utils/dates';
import { CashOperation } from '../../models/cash.model';
import { CashesService } from '../../services/cashes.service';

@Component({
  selector: 'app-cash-form',
  standalone: true,
  imports: [CommonModule, KeyFilterModule, ReactiveFormsModule, SharedModule],
  templateUrl: './cash-form.component.html',
  styleUrl: './cash-form.component.scss',
  providers: [DatePipe],
})
export class CashFormComponent {
  constructor(
    private readonly datePipe: DatePipe,
    private readonly formBuilder: FormBuilder,
    private readonly dynamicDialogRef: DynamicDialogRef,
    private readonly dynamicDialogConfig: DynamicDialogConfig,
    private readonly cashesService: CashesService,
  ) {}

  form: FormGroup = this.formBuilder.group({
    cashTypeId: [this.dynamicDialogConfig.data.type, Validators.required],
    date: [currentDateTime(this.datePipe), Validators.required],
    description: [null, Validators.required],
    amount: [null, Validators.required],
    cashAmount: [0, Validators.nullValidator],
    cardAmount: [0, Validators.nullValidator],
  });

  cashSaveButton() {
    const cashOperation = new CashOperation(this.form.value);
    this.cashesService.create(cashOperation).subscribe({
      next: () => {
        this.dynamicDialogRef.close({ success: true });
      },
    });
  }

  get isFormValid(): boolean {
    return this.form.valid;
  }
}
