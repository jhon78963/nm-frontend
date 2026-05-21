import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { finalize } from 'rxjs';
import { showError } from '../../../../../utils/notifications';
import { VendorsService } from '../../services/vendors.service';
import { Vendor } from '../../models/vendors.model';

@Component({
  selector: 'app-vendor-form',
  templateUrl: './vendors-form.component.html',
  styleUrl: './vendors-form.component.scss',
  providers: [MessageService],
})
export class VendorsFormComponent implements OnInit {
  isSaving = false;

  form: FormGroup = this.formBuilder.group({
    name: ['', Validators.required],
    address: ['', Validators.nullValidator],
    local: ['', Validators.nullValidator],
    phone: ['', Validators.nullValidator],
  });

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly vendorsService: VendorsService,
    private readonly dynamicDialogRef: DynamicDialogRef,
    private readonly dynamicDialogConfig: DynamicDialogConfig,
    private readonly messageService: MessageService,
  ) {}

  ngOnInit(): void {
    if (this.dynamicDialogConfig.data.id) {
      const id = this.dynamicDialogConfig.data.id;
      this.vendorsService.getOne(id).subscribe((response: Vendor) => {
        this.form.patchValue(response);
      });
    }
  }

  get isValid(): boolean {
    return this.form.valid;
  }

  buttonSaveVendor() {
    if (!this.form.valid) {
      this.form.markAllAsTouched();
      return;
    }

    const vendor = new Vendor(this.form.value);
    this.isSaving = true;

    if (this.dynamicDialogConfig.data.id) {
      const id = this.dynamicDialogConfig.data.id;
      this.vendorsService
        .edit(id, vendor)
        .pipe(finalize(() => (this.isSaving = false)))
        .subscribe({
          next: () => this.dynamicDialogRef.close(),
          error: (err: unknown) =>
            this.handleSaveError(err, 'Error al actualizar el proveedor.'),
        });
    } else {
      this.vendorsService
        .create(vendor)
        .pipe(finalize(() => (this.isSaving = false)))
        .subscribe({
          next: () => {
            this.dynamicDialogRef.close({ success: true });
            this.form.reset();
          },
          error: (err: unknown) =>
            this.handleSaveError(err, 'Error al crear el proveedor.'),
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
