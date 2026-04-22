import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Tenant } from '../../../tenants/models/tenants.model';
import { TenantsService } from '../../../tenants/services/tenants.service';
import { AdminWarehousesService } from '../../services/admin-warehouses.service';
import { WarehouseRow } from '../../models/warehouses.model';

@Component({
  selector: 'app-warehouses-form',
  templateUrl: './warehouses-form.component.html',
  styleUrl: './warehouses-form.component.scss',
})
export class WarehousesFormComponent implements OnInit {
  form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(25)]],
    tenantId: [null as number | null, Validators.required],
  });

  tenants: Tenant[] = [];

  constructor(
    private readonly fb: FormBuilder,
    private readonly adminWarehousesService: AdminWarehousesService,
    private readonly tenantsService: TenantsService,
    readonly dynamicDialogRef: DynamicDialogRef,
    private readonly dynamicDialogConfig: DynamicDialogConfig,
  ) {}

  ngOnInit(): void {
    this.tenantsService.callGetList(200, 1, '').subscribe(() => {
      this.tenantsService.getList().subscribe(list => (this.tenants = list));
    });
    const id = this.dynamicDialogConfig.data?.id as number | undefined;
    if (id) {
      this.adminWarehousesService.getOne(id).subscribe((w: WarehouseRow) => {
        this.form.patchValue({
          name: w.name,
          tenantId: w.tenantId ?? null,
        });
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
    const v = this.form.value as { name: string; tenantId: number };
    const id = this.dynamicDialogConfig.data?.id as number | undefined;
    if (id) {
      this.adminWarehousesService
        .edit(id, { name: v.name, tenantId: v.tenantId })
        .subscribe({
          next: () => this.dynamicDialogRef.close({ success: true }),
          error: () => this.dynamicDialogRef.close({ error: 'Error al guardar.' }),
        });
    } else {
      this.adminWarehousesService
        .create({ name: v.name, tenantId: v.tenantId })
        .subscribe({
          next: () => this.dynamicDialogRef.close({ success: true }),
          error: () => this.dynamicDialogRef.close({ error: 'Error al crear.' }),
        });
    }
  }
}
