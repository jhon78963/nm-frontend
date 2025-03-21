import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { Observable } from 'rxjs';

import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ToastModule } from 'primeng/toast';

import { DaysService } from '../../../days/services/days.service';
import { HoursService } from '../../../hours/services/hours.service';
import { RatesService } from '../../services/rates.service';
import { SharedModule } from '../../../../../../../shared/shared.module';

import { Day } from '../../../days/models/days.model';
import { Hour } from '../../../hours/models/hours.model';
import { Rate } from '../../models/rates.model';

@Component({
  selector: 'app-rates-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    ToastModule,
  ],
  templateUrl: './rates-form.component.html',
  styleUrl: './rates-form.component.scss',
})
export class RatesFormComponent implements OnInit {
  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly ratesService: RatesService,
    private readonly hoursService: HoursService,
    private readonly daysService: DaysService,
    private readonly dialogRef: DynamicDialogRef,
    private readonly dynamicDialogConfig: DynamicDialogConfig,
  ) {}

  form: FormGroup = this.formBuilder.group({
    price: ['', Validators.required],
    hourId: [null, Validators.required],
    dayId: [null, Validators.required],
  });

  ngOnInit(): void {
    if (this.dynamicDialogConfig.data.id) {
      const id = this.dynamicDialogConfig.data.id;
      this.ratesService.getOne(id).subscribe((response: Rate) => {
        this.form.patchValue(response);
      });
    }
    this.hoursService.callGetList().subscribe();
    this.daysService.callGetList().subscribe();
  }

  get hours(): Observable<Hour[]> {
    return this.hoursService.getList();
  }

  get days(): Observable<Day[]> {
    return this.daysService.getList();
  }

  buttonSaveRate() {
    if (this.form) {
      const hour = new Rate(this.form.value);
      if (this.dynamicDialogConfig.data.id) {
        const id = this.dynamicDialogConfig.data.id;
        this.ratesService.edit(id, hour).subscribe({
          next: () => this.dialogRef.close(),
          error: () => this.dialogRef.close(),
        });
      } else {
        this.ratesService.create(hour).subscribe({
          next: () => this.dialogRef.close(),
          error: () => this.dialogRef.close(),
        });
      }
    }
  }
}
