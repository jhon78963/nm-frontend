import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { ToastModule } from 'primeng/toast';

import { HoursService } from '../../services/hours.service';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

import { Hour } from '../../models/hours.model';
import { SharedModule } from '../../../../../../../shared/shared.module';

@Component({
  selector: 'app-hours-form-component',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    ToastModule,
  ],
  templateUrl: './hours-form.component.html',
  styleUrl: './hours-form.component.scss',
})
export class HoursFormComponent implements OnInit {
  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly hoursService: HoursService,
    private readonly dialogRef: DynamicDialogRef,
    private readonly dynamicDialogConfig: DynamicDialogConfig,
  ) {}

  form: FormGroup = this.formBuilder.group({
    duration: [null, Validators.required],
  });

  ngOnInit(): void {
    if (this.dynamicDialogConfig.data.id) {
      const id = this.dynamicDialogConfig.data.id;
      this.hoursService.getOne(id).subscribe((response: Hour) => {
        this.form.patchValue(response);
      });
    }
  }

  buttonSaveHour() {
    if (this.form) {
      const hour = new Hour(this.form.value);
      if (this.dynamicDialogConfig.data.id) {
        const id = this.dynamicDialogConfig.data.id;
        this.hoursService.edit(id, hour).subscribe({
          next: () => this.dialogRef.close(),
          error: () => this.dialogRef.close(),
        });
      } else {
        this.hoursService.create(hour).subscribe({
          next: () => this.dialogRef.close(),
          error: () => this.dialogRef.close(),
        });
      }
    }
  }

  get isFormValid(): boolean {
    return this.form.valid;
  }
}
