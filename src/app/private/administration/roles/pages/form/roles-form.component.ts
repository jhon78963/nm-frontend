import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { forkJoin } from 'rxjs';
import { RolesService } from '../../services/roles.service';
import { buildPermissionGroups } from '../../utils/permission-options';

@Component({
  selector: 'app-roles-form',
  templateUrl: './roles-form.component.html',
  styleUrl: './roles-form.component.scss',
})
export class RolesFormComponent implements OnInit {
  form: FormGroup = this.formBuilder.group({
    name: ['', Validators.required],
    permissions: [[] as string[]],
  });

  permissionGroups: {
    label: string;
    items: { label: string; value: string }[];
  }[] = [];
  loadingPermissions = true;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly rolesService: RolesService,
    private readonly dynamicDialogRef: DynamicDialogRef,
    private readonly dynamicDialogConfig: DynamicDialogConfig,
  ) {}

  ngOnInit(): void {
    const id = this.dynamicDialogConfig.data?.id as number | undefined;
    if (id) {
      forkJoin({
        perms: this.rolesService.getPermissions(),
        role: this.rolesService.getOne(id),
      }).subscribe({
        next: ({ perms, role }) => {
          this.permissionGroups = buildPermissionGroups(perms);
          this.form.patchValue({
            name: role.name,
            permissions: (role.permissions ?? []).map(p => p.name),
          });
          this.loadingPermissions = false;
        },
        error: () => {
          this.loadingPermissions = false;
        },
      });
    } else {
      this.rolesService.getPermissions().subscribe({
        next: perms => {
          this.permissionGroups = buildPermissionGroups(perms);
          this.loadingPermissions = false;
        },
        error: () => {
          this.loadingPermissions = false;
        },
      });
    }
  }

  get isValid(): boolean {
    return this.form.valid;
  }

  buttonSaveRole() {
    if (!this.form?.valid) {
      return;
    }
    const id = this.dynamicDialogConfig.data?.id as number | undefined;
    const name = this.form.value.name as string;
    const permissions = (this.form.value.permissions ?? []) as string[];

    if (id) {
      this.rolesService.edit(id, { name, permissions }).subscribe({
        next: () => this.dynamicDialogRef.close({ success: true }),
        error: () =>
          this.dynamicDialogRef.close({
            error: 'No se pudo actualizar el rol.',
          }),
      });
    } else {
      this.rolesService.create({ name, permissions }).subscribe({
        next: () => {
          this.dynamicDialogRef.close({ success: true });
          this.form.reset({ permissions: [] });
        },
        error: () =>
          this.dynamicDialogRef.close({
            error: 'No se pudo crear el rol.',
          }),
      });
    }
  }
}
