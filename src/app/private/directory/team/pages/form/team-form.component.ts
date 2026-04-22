import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Warehouse } from '../../../../../models/warehouse.interface';
import { WarehousesService } from '../../../../../services/warehouse.service';
import { ITeam, TeamPayload } from '../../models/team.model';
import { TeamService } from '../../services/team.service';

@Component({
  selector: 'app-team-form',
  templateUrl: './team-form.component.html',
  styleUrl: './team-form.component.scss',
})
export class TeamFormComponent implements OnInit {
  warehouses: Warehouse[] = [];

  get isEdit(): boolean {
    return !!this.dynamicDialogConfig.data?.id;
  }

  form: FormGroup = this.formBuilder.group({
    dni: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
    name: ['', Validators.required],
    surname: ['', Validators.required],
    salary: [''],
    warehouseId: [null as number | null, Validators.required],
  });

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly teamService: TeamService,
    private readonly warehousesService: WarehousesService,
    private readonly dynamicDialogRef: DynamicDialogRef,
    private readonly dynamicDialogConfig: DynamicDialogConfig,
  ) {}

  ngOnInit(): void {
    const tenantId = this.tenantIdFromSession();
    this.warehousesService.getAll(tenantId).subscribe((warehouses: Warehouse[]) => {
      this.warehouses = warehouses;
    });
    if (this.dynamicDialogConfig.data?.id) {
      const id = this.dynamicDialogConfig.data.id as number;
      this.teamService.getOne(id).subscribe((response: ITeam) => {
        this.form.patchValue({
          dni: String(response.dni),
          name: response.name,
          surname: response.surname,
          salary:
            response.salary === null || response.salary === undefined
              ? ''
              : String(response.salary),
          warehouseId: response.warehouseId,
        });
      });
    }
  }

  private tenantIdFromSession(): number | undefined {
    try {
      const raw = localStorage.getItem('user');
      if (!raw) {
        return undefined;
      }
      const u = JSON.parse(raw) as { tenantId?: number | null };
      const t = u?.tenantId;
      return typeof t === 'number' ? t : undefined;
    } catch {
      return undefined;
    }
  }

  get isValid(): boolean {
    return this.form.valid;
  }

  private buildPayload(): TeamPayload {
    const v = this.form.getRawValue() as {
      dni: string;
      name: string;
      surname: string;
      salary: string;
      warehouseId: number | null;
    };
    const salaryRaw = v.salary?.trim();
    return {
      dni: v.dni.replace(/\D/g, '').slice(0, 8),
      name: v.name.trim(),
      surname: v.surname.trim(),
      salary:
        salaryRaw === '' || salaryRaw === undefined ? null : Number(salaryRaw),
      warehouseId: Number(v.warehouseId),
    };
  }

  buttonSaveTeam() {
    if (!this.form.valid) {
      return;
    }
    const payload = this.buildPayload();
    if (this.dynamicDialogConfig.data?.id) {
      const id = this.dynamicDialogConfig.data.id as number;
      this.teamService.edit(id, payload).subscribe({
        next: () => this.dynamicDialogRef.close({ success: true }),
        error: () =>
          this.dynamicDialogRef.close({
            error: 'No se pudo actualizar el colaborador.',
          }),
      });
    } else {
      this.teamService.create(payload).subscribe({
        next: res =>
          this.dynamicDialogRef.close({ success: true, login: res.login }),
        error: () =>
          this.dynamicDialogRef.close({
            error: 'No se pudo crear el colaborador.',
          }),
      });
    }
  }
}
