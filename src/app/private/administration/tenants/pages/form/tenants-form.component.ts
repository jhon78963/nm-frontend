import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Tenant } from '../../models/tenants.model';
import { TenantsService } from '../../services/tenants.service';

@Component({
  selector: 'app-tenants-form',
  templateUrl: './tenants-form.component.html',
  styleUrl: './tenants-form.component.scss',
})
export class TenantsFormComponent implements OnInit {
  form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(25)]],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly tenantsService: TenantsService,
    readonly dynamicDialogRef: DynamicDialogRef,
    private readonly dynamicDialogConfig: DynamicDialogConfig,
  ) {}

  ngOnInit(): void {
    const id = this.dynamicDialogConfig.data?.id as number | undefined;
    if (id) {
      this.tenantsService.getOne(id).subscribe((t: Tenant) => {
        this.form.patchValue({ name: t.name });
      });
    }
  }

  get isValid(): boolean {
    return this.form.valid;
  }

  save(): void {
    if (!this.form.valid) {
      return;
    }
    const name = this.form.value.name as string;
    const id = this.dynamicDialogConfig.data?.id as number | undefined;
    if (id) {
      this.tenantsService.edit(id, { name }).subscribe({
        next: () => this.dynamicDialogRef.close({ success: true }),
        error: () => this.dynamicDialogRef.close({ error: 'Error al guardar.' }),
      });
    } else {
      this.tenantsService.create({ name }).subscribe({
        next: () => this.dynamicDialogRef.close({ success: true }),
        error: () => this.dynamicDialogRef.close({ error: 'Error al crear.' }),
      });
    }
  }
}
