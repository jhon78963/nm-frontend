import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { VendorsService } from '../../services/vendors.service';
import { Vendor } from '../../models/vendors.model';

@Component({
  selector: 'app-vendor-form',
  templateUrl: './vendors-form.component.html',
  styleUrl: './vendors-form.component.scss',
})
export class VendorsFormComponent implements OnInit {
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
    if (this.form) {
      const vendor = new Vendor(this.form.value);
      if (this.dynamicDialogConfig.data.id) {
        const id = this.dynamicDialogConfig.data.id;
        this.vendorsService.edit(id, vendor).subscribe({
          next: () => this.dynamicDialogRef.close(),
          error: () => {},
        });
      } else {
        this.vendorsService.create(vendor).subscribe({
          next: () => {
            this.dynamicDialogRef.close({ success: true });
            this.form.reset();
          },
          error: () => {},
        });
      }
    }
  }
}
