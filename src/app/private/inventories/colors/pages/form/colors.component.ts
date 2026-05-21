import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ColorsService } from '../../services/colors.service';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Color, ColorSave } from '../../models/colors.model';
import { CommonModule } from '@angular/common';
import { ToastModule } from 'primeng/toast';
import { SharedModule } from '../../../../../shared/shared.module';
import { finalize } from 'rxjs';
import { showError } from '../../../../../utils/notifications';

@Component({
  selector: 'app-colors-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ToastModule, SharedModule],
  templateUrl: './colors.component.html',
  styleUrl: './colors.component.scss',
  providers: [MessageService],
})
export class ColorsCreateFormComponent implements OnInit {
  colorId: number = 0;
  color: string = '';
  isSaving = false;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly colorsService: ColorsService,
    private readonly dynamicDialogRef: DynamicDialogRef,
    private readonly dynamicDialogConfig: DynamicDialogConfig,
    private readonly messageService: MessageService,
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
    if (!this.form.valid) {
      this.form.markAllAsTouched();
      return;
    }

    const color = new ColorSave(this.form.value);
    this.isSaving = true;

    if (this.dynamicDialogConfig.data.id) {
      const id = this.dynamicDialogConfig.data.id;
      this.colorsService
        .edit(id, color)
        .pipe(finalize(() => (this.isSaving = false)))
        .subscribe({
          next: () => this.dynamicDialogRef.close({ success: true }),
          error: (err: unknown) =>
            this.handleSaveError(err, 'Error al actualizar el color.'),
        });
    } else {
      this.colorsService
        .create(color)
        .pipe(finalize(() => (this.isSaving = false)))
        .subscribe({
          next: () => this.dynamicDialogRef.close({ success: true }),
          error: (err: unknown) =>
            this.handleSaveError(err, 'Error al crear el color.'),
        });
    }
  }

  private handleSaveError(err: unknown, fallback: string): void {
    const message =
      (err as { error?: { message?: string }; message?: string })?.error
        ?.message ??
      (err as { message?: string })?.message ??
      fallback;
    showError(this.messageService, message);
  }
}
