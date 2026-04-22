import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { MultiSelectModule } from 'primeng/multiselect';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { RolesService } from '../../services/roles.service';
import { buildPermissionGroups } from '../../utils/permission-options';

@Component({
  selector: 'app-role-sync',
  standalone: true,
  imports: [CommonModule, FormsModule, MultiSelectModule, ButtonModule],
  templateUrl: './role-sync.component.html',
  styleUrl: './role-sync.component.scss',
})
export class RoleSyncComponent implements OnInit {
  /** Grupos para p-multiSelect con [group]="true". */
  permissionGroups: {
    label: string;
    items: { label: string; value: string }[];
  }[] = [];
  selected: string[] = [];
  loading = true;

  constructor(
    private readonly rolesService: RolesService,
    readonly dynamicDialogRef: DynamicDialogRef,
    private readonly dynamicDialogConfig: DynamicDialogConfig,
  ) {}

  ngOnInit(): void {
    const id = this.dynamicDialogConfig.data?.id as number;
    this.rolesService.getPermissions().subscribe(perms => {
      this.permissionGroups = buildPermissionGroups(perms);
      this.rolesService.getOne(id).subscribe(role => {
        this.selected = (role.permissions ?? []).map(p => p.name);
        this.loading = false;
      });
    });
  }

  save(): void {
    const id = this.dynamicDialogConfig.data?.id as number;
    this.rolesService.syncPermissions(id, this.selected).subscribe({
      next: () => this.dynamicDialogRef.close({ success: true }),
      error: () =>
        this.dynamicDialogRef.close({
          error: 'No se pudieron sincronizar permisos.',
        }),
    });
  }
}
