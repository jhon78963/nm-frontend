import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

import { AmenitiesService } from '../../services/amenities.service';
import { SharedModule } from '../../../../../../shared/shared.module';
import { Amenity } from '../../models/amenities.model';

@Component({
  selector: 'app-amenities-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SharedModule],
  templateUrl: './amenities-form.component.html',
  styleUrl: './amenities-form.component.scss',
})
export class AmenitiesFormComponent implements OnInit {
  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly amenitiesService: AmenitiesService,
    private readonly dialogRef: DynamicDialogRef,
    private readonly dynamicDialogConfig: DynamicDialogConfig,
  ) {}

  form: FormGroup = this.formBuilder.group({
    description: ['', Validators.required],
  });

  ngOnInit(): void {
    if (this.dynamicDialogConfig.data.id) {
      const id = this.dynamicDialogConfig.data.id;
      this.amenitiesService.getOne(id).subscribe((response: Amenity) => {
        this.form.patchValue(response);
      });
    }
  }

  buttonSaveAmenity() {
    if (this.form) {
      const amenity = new Amenity(this.form.value);
      if (this.dynamicDialogConfig.data.id) {
        const id = this.dynamicDialogConfig.data.id;
        this.amenitiesService.edit(id, amenity).subscribe({
          next: () => this.dialogRef.close(),
          error: () => this.dialogRef.close(),
        });
      } else {
        this.amenitiesService.create(amenity).subscribe({
          next: () => this.dialogRef.close(),
          error: () => this.dialogRef.close(),
        });
      }
    }
  }
}
