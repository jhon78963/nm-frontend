import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

import { RoomTypesService } from '../../services/room-types.service';
import { SharedModule } from '../../../../../../shared/shared.module';

import { RoomType } from '../../models/room-types.model';

@Component({
  selector: 'app-room-types-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SharedModule],
  templateUrl: './room-types-form.component.html',
  styleUrl: './room-types-form.component.scss',
})
export class RoomTypesFormComponent implements OnInit {
  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly roomTypesService: RoomTypesService,
    private readonly dialogRef: DynamicDialogRef,
    private readonly dynamicDialogConfig: DynamicDialogConfig,
  ) {}

  form: FormGroup = this.formBuilder.group({
    description: ['', Validators.required],
    capacity: ['', Validators.required],
    rentalHours: ['', Validators.required],
    pricePerCapacity: ['', Validators.required],
    pricePerAdditionalPerson: ['', Validators.required],
    pricePerExtraHour: ['', Validators.required],
    ageFree: ['', Validators.required],
  });

  ngOnInit(): void {
    if (this.dynamicDialogConfig.data.id) {
      const id = this.dynamicDialogConfig.data.id;
      this.roomTypesService.getOne(id).subscribe((response: RoomType) => {
        this.form.patchValue(response);
      });
    }
  }

  roomTypeSaveButton() {
    if (this.form) {
      const roomtype = new RoomType(this.form.value);
      if (this.dynamicDialogConfig.data.id) {
        const id = this.dynamicDialogConfig.data.id;
        this.roomTypesService.edit(id, roomtype).subscribe({
          next: () => this.dialogRef.close(),
          error: () => this.dialogRef.close(),
        });
      } else {
        this.roomTypesService.create(roomtype).subscribe({
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
