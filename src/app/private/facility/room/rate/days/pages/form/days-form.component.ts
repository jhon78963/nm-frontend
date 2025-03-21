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

import { SharedModule } from '../../../../../../../shared/shared.module';
import { DaysService } from '../../services/days.service';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Day } from '../../models/days.model';

@Component({
  selector: 'app-days-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    ToastModule,
  ],
  templateUrl: './days-form.component.html',
  styleUrl: './days-form.component.scss',
})
export class DaysFormComponent implements OnInit {
  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly daysService: DaysService,
    private readonly dialogRef: DynamicDialogRef,
    private readonly dynamicDialogConfig: DynamicDialogConfig,
  ) {}

  form: FormGroup = this.formBuilder.group({
    name: ['', Validators.required],
    abbreviation: ['', Validators.required],
  });

  ngOnInit(): void {
    if (this.dynamicDialogConfig.data.id) {
      const id = this.dynamicDialogConfig.data.id;
      this.daysService.getOne(id).subscribe((response: Day) => {
        this.form.patchValue(response);
      });
    }
  }

  buttonSaveDay() {
    if (this.form) {
      const day = new Day(this.form.value);
      if (this.dynamicDialogConfig.data.id) {
        const id = this.dynamicDialogConfig.data.id;
        this.daysService.edit(id, day).subscribe({
          next: () => this.dialogRef.close(),
          error: () => this.dialogRef.close(),
        });
      } else {
        this.daysService.create(day).subscribe({
          next: () => this.dialogRef.close(),
          error: () => this.dialogRef.close(),
        });
      }
    }
  }
}
