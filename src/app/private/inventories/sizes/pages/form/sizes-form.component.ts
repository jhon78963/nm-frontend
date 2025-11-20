import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { SharedModule } from '../../../../../shared/shared.module';
import { ToastModule } from 'primeng/toast';
import { Size, SizeSave } from '../../models/sizes.model';
import { SizesSelectedService } from '../../services/sizes-selected.service';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { SizesService } from '../../services/sizes.service';

@Component({
  selector: 'app-sizes-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ToastModule, SharedModule],
  templateUrl: './sizes-form.component.html',
  styleUrl: './sizes-form.component.scss',
})
export class SizesCreateFormComponent implements OnInit {
  productId: number = 0;
  sizeTypeId: number = 0;
  sizesType: Size[] = [];

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly sizesSelectedService: SizesSelectedService,
    private readonly sizesService: SizesService,
    private readonly dynamicDialogConfig: DynamicDialogConfig,
    private readonly dynamicDialogRef: DynamicDialogRef,
  ) {}

  form: FormGroup = this.formBuilder.group({
    id: [null],
    description: ['', Validators.required],
    sizeTypeId: [1, Validators.required],
  });

  ngOnInit(): void {
    if (this.dynamicDialogConfig.data.id) {
      const id = this.dynamicDialogConfig.data.id;
      this.sizeTypeId = this.dynamicDialogConfig.data.id;
      this.sizesService.getOne(id).subscribe((response: Size) => {
        this.form.patchValue(response);
      });
    }
    this.sizesSelectedService.getSizeTypes().subscribe({
      next: (sizesType: Size[]) => {
        this.sizesType = sizesType;
      },
    });
  }

  get isValid(): boolean {
    return this.form.valid;
  }

  saveSizeButton() {
    if (this.form) {
      const size = new SizeSave(this.form.value);
      if (this.dynamicDialogConfig.data.id) {
        const id = this.dynamicDialogConfig.data.id;
        this.sizesService.edit(id, size).subscribe({
          next: () => this.dynamicDialogRef.close({ success: true }),
          error: () => {},
        });
      } else {
        this.sizesService.create(size).subscribe({
          next: () => this.dynamicDialogRef.close({ success: true }),
          error: () => {},
        });
      }
    }
  }
}
