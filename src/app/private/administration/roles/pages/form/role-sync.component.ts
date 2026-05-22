import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { AccordionModule } from 'primeng/accordion';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { RolesService } from '../../services/roles.service';
import { showError, showSuccess } from '../../../../../utils/notifications';
import {
  buildPermissionTree,
  countPermissions,
  filterPermissionTree,
  PermissionModule,
  PermissionSubmodule,
} from '../../utils/permission-options';

@Component({
  selector: 'app-role-sync',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AccordionModule,
    ButtonModule,
    CheckboxModule,
    InputTextModule,
    ToastModule,
  ],
  templateUrl: './role-sync.component.html',
  styleUrl: './role-sync.component.scss',
})
export class RoleSyncComponent implements OnInit {
  permissionTree: PermissionModule[] = [];
  filteredTree: PermissionModule[] = [];
  selected = new Set<string>();
  search = '';
  loading = true;
  saving = false;
  activeModules: number[] = [0];
  totalPermissions = 0;
  roleId = 0;
  roleName = '';

  constructor(
    private readonly rolesService: RolesService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly messageService: MessageService,
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = Number(idParam);

    if (!idParam || Number.isNaN(id)) {
      void this.router.navigate(['/administration/roles']);
      return;
    }

    this.roleId = id;

    this.rolesService.getPermissions().subscribe(perms => {
      this.permissionTree = buildPermissionTree(perms);
      this.totalPermissions = countPermissions(this.permissionTree);
      this.applySearch();
      this.rolesService.getOne(id).subscribe({
        next: role => {
          this.roleName = role.name;
          this.selected = new Set((role.permissions ?? []).map(p => p.name));
          this.loading = false;
        },
        error: () => {
          showError(this.messageService, 'No se pudo cargar el rol.');
          void this.router.navigate(['/administration/roles']);
        },
      });
    });
  }

  get selectedCount(): number {
    return this.selected.size;
  }

  goBack(): void {
    void this.router.navigate(['/administration/roles']);
  }

  onSearchChange(): void {
    this.applySearch();
  }

  isSelected(name: string): boolean {
    return this.selected.has(name);
  }

  togglePermission(name: string, checked: boolean): void {
    if (checked) {
      this.selected.add(name);
      return;
    }
    this.selected.delete(name);
  }

  submoduleSelectionState(
    submodule: PermissionSubmodule,
  ): 'all' | 'some' | 'none' {
    const names = submodule.permissions.map(p => p.value);
    const selectedInSubmodule = names.filter(name => this.selected.has(name));
    if (selectedInSubmodule.length === 0) {
      return 'none';
    }
    if (selectedInSubmodule.length === names.length) {
      return 'all';
    }
    return 'some';
  }

  toggleSubmodule(submodule: PermissionSubmodule, checked: boolean): void {
    const state = this.submoduleSelectionState(submodule);
    const shouldSelect = state === 'some' ? true : checked;

    for (const permission of submodule.permissions) {
      if (shouldSelect) {
        this.selected.add(permission.value);
      } else {
        this.selected.delete(permission.value);
      }
    }
    this.selected = new Set(this.selected);
  }

  moduleSelectionState(module: PermissionModule): 'all' | 'some' | 'none' {
    const names = this.modulePermissionNames(module);
    const selectedInModule = names.filter(name => this.selected.has(name));
    if (selectedInModule.length === 0) {
      return 'none';
    }
    if (selectedInModule.length === names.length) {
      return 'all';
    }
    return 'some';
  }

  toggleModule(module: PermissionModule, checked: boolean): void {
    const state = this.moduleSelectionState(module);
    const shouldSelect = state === 'some' ? true : checked;

    for (const name of this.modulePermissionNames(module)) {
      if (shouldSelect) {
        this.selected.add(name);
      } else {
        this.selected.delete(name);
      }
    }
    this.selected = new Set(this.selected);
  }

  selectedInModule(module: PermissionModule): number {
    return this.modulePermissionNames(module).filter(name =>
      this.selected.has(name),
    ).length;
  }

  totalInModule(module: PermissionModule): number {
    return this.modulePermissionNames(module).length;
  }

  selectedInSubmodule(submodule: PermissionSubmodule): number {
    return submodule.permissions.filter(permission =>
      this.selected.has(permission.value),
    ).length;
  }

  expandAllModules(): void {
    this.activeModules = this.filteredTree.map((_, index) => index);
  }

  collapseAllModules(): void {
    this.activeModules = [];
  }

  save(): void {
    if (this.saving) {
      return;
    }

    this.saving = true;
    this.rolesService.syncPermissions(this.roleId, [...this.selected]).subscribe({
      next: () => {
        showSuccess(this.messageService, 'Permisos sincronizados.');
        void this.router.navigate(['/administration/roles']);
      },
      error: () => {
        this.saving = false;
        showError(this.messageService, 'No se pudieron sincronizar permisos.');
      },
    });
  }

  private applySearch(): void {
    this.filteredTree = filterPermissionTree(this.permissionTree, this.search);
    if (this.search.trim()) {
      this.activeModules = this.filteredTree.map((_, index) => index);
    }
  }

  private modulePermissionNames(module: PermissionModule): string[] {
    return module.submodules.flatMap(submodule =>
      submodule.permissions.map(permission => permission.value),
    );
  }
}
