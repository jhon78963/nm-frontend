import { Component, OnInit } from '@angular/core';
import { SharedModule } from '../../../../../shared/shared.module';
import { CommonModule, DatePipe } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  DialogService,
  DynamicDialogConfig,
  DynamicDialogRef,
} from 'primeng/dynamicdialog';
import { MessageService } from 'primeng/api';
import { SalesService } from '../../services/sales.service';
import { Sale } from '../../models/sales.model';
import { formatDateTime } from '../../../../../utils/dates';

@Component({
  selector: 'app-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, SharedModule],
  templateUrl: './form.component.html',
  styleUrl: './form.component.scss',
  providers: [DialogService, MessageService, DatePipe],
})
export class SaleFormComponent implements OnInit {
  form: FormGroup = this.formBuilder.group({
    creationTime: [new Date(), Validators.required],
  });

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly salesService: SalesService,
    private readonly dynamicDialogRef: DynamicDialogRef,
    private readonly dynamicDialogConfig: DynamicDialogConfig,
    private readonly datePipe: DatePipe,
  ) {}

  ngOnInit(): void {
    if (this.dynamicDialogConfig.data.id) {
      const id = this.dynamicDialogConfig.data.id;
      this.salesService.getOne(id).subscribe((response: Sale) => {
        this.form.patchValue(response);
      });
    }
  }

  get isValid(): boolean {
    return this.form.valid;
  }

  buttonSaveSale() {
    if (this.form) {
      const sale = new Sale(this.form.value);
      if (sale.creationTime) {
        const formattedDate = formatDateTime(
          this.form.get('creationTime')?.value,
          this.datePipe,
        );
        if (formattedDate) {
          sale.creationTime = formattedDate;
        }
      }
      const id = this.dynamicDialogConfig.data.id;
      this.salesService.edit(id, sale).subscribe({
        next: () => this.dynamicDialogRef.close(),
        error: () => {},
      });
    }
  }
}
