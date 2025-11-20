import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ColorsService } from '../../services/colors.service';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Color, ColorSave } from '../../models/colors.model';
import { CommonModule } from '@angular/common';
import { ToastModule } from 'primeng/toast';
import { SharedModule } from '../../../../../shared/shared.module';

@Component({
  selector: 'app-colors-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ToastModule, SharedModule],
  templateUrl: './colors.component.html',
  styleUrl: './colors.component.scss',
})
export class ColorsCreateFormComponent implements OnInit {
  colorId: number = 0;
  color: string = '';

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly colorsService: ColorsService,
    private readonly dynamicDialogRef: DynamicDialogRef,
    private readonly dynamicDialogConfig: DynamicDialogConfig,
  ) {}

  form: FormGroup = this.formBuilder.group({
    description: ['', Validators.required],
    hash: ['#000000', Validators.nullValidator],
  });

  ngOnInit(): void {
    if (this.dynamicDialogConfig.data.id) {
      const id = this.dynamicDialogConfig.data.id;
      this.colorId = this.dynamicDialogConfig.data.id;
      this.colorsService.getOne(id).subscribe((response: Color) => {
        this.form.patchValue(response);
      });
    }
  }

  buttonSaveColor(): void {
    if (this.form) {
      const color = new ColorSave(this.form.value);
      if (this.dynamicDialogConfig.data.id) {
        const id = this.dynamicDialogConfig.data.id;
        this.colorsService.edit(id, color).subscribe({
          next: () => this.dynamicDialogRef.close({ success: true }),
          error: () => {},
        });
      } else {
        this.colorsService.create(color).subscribe({
          next: () => this.dynamicDialogRef.close({ success: true }),
          error: () => this.dynamicDialogRef.close({ error: true }),
        });
      }
    }
  }
}
