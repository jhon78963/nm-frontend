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
    private readonly dynamicDialogConfig: DynamicDialogConfig,
    private readonly dynamicDialogRef: DynamicDialogRef,
  ) {}

  form: FormGroup = this.formBuilder.group({
    id: [null],
    description: ['', Validators.required],
    sizeTypeId: [null, Validators.required],
  });

  ngOnInit(): void {
    this.productId = this.dynamicDialogConfig.data.productId;
    this.sizeTypeId = this.dynamicDialogConfig.data.sizeTypeId;
    this.form.get('sizeTypeId')?.patchValue(this.sizeTypeId);
    this.sizesSelectedService.getSizeTypes().subscribe({
      next: (sizesType: Size[]) => {
        this.sizesType = sizesType;
      },
    });
  }

  saveSizeButton() {
    const size = new SizeSave(this.form.value);
    this.sizesSelectedService
      .create(size, this.productId, this.sizeTypeId)
      .subscribe({
        next: () => this.dynamicDialogRef.close({ success: true }),
        error: () => this.dynamicDialogRef.close({ error: true }),
      });
  }
}
