import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Subscription } from 'rxjs';
import { Warehouse } from '../../../../../models/warehouse.interface';
import { WarehousesService } from '../../../../../services/warehouse.service';
import { Role } from '../../../roles/models/roles.model';
import { RolesService } from '../../../roles/services/roles.service';
import { TenantsService } from '../../../tenants/services/tenants.service';
import { Tenant } from '../../../tenants/models/tenants.model';
import { User } from '../../models/users.model';
import { UserPayload, UsersService } from '../../services/users.service';

@Component({
  selector: 'app-users-form',
  templateUrl: './users-form.component.html',
  styleUrl: './users-form.component.scss',
})
export class UserFormComponent implements OnInit, OnDestroy {
  userId: number = 0;
  warehouses: Warehouse[] = [];
  roles: Role[] = [];
  tenants: Tenant[] = [];

  private subs = new Subscription();

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly usersService: UsersService,
    private readonly rolesService: RolesService,
    private readonly warehousesService: WarehousesService,
    private readonly tenantsService: TenantsService,
    private readonly dynamicDialogRef: DynamicDialogRef,
    private readonly dynamicDialogConfig: DynamicDialogConfig,
  ) {}

  form: FormGroup = this.formBuilder.group({
    username: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    name: ['', Validators.required],
    surname: ['', Validators.required],
    roleName: ['', Validators.required],
    tenantId: [1, Validators.required],
    warehouseId: [1, Validators.required],
  });

  ngOnInit(): void {
    this.subs.add(
      this.rolesService.callGetList(200, 1, '').subscribe(),
    );
    this.subs.add(
      this.rolesService.getList().subscribe(list => (this.roles = list)),
    );

    this.subs.add(
      this.tenantsService.callGetList(200, 1, '').subscribe(),
    );
    this.subs.add(
      this.tenantsService.getList().subscribe(list => (this.tenants = list)),
    );

    this.subs.add(
      this.form.get('tenantId')!.valueChanges.subscribe(tid => {
        if (tid != null) {
          this.loadWarehouses(Number(tid));
        }
      }),
    );

    const initialTid = this.form.value.tenantId as number;
    this.loadWarehouses(initialTid);

    if (this.dynamicDialogConfig.data.id) {
      const id = this.dynamicDialogConfig.data.id;
      this.userId = id;
      this.removeValidatorsForEdit();

      this.subs.add(
        this.usersService.getOne(id).subscribe((response: User) => {
          const roleName = response.roles?.[0] ?? '';
          this.form.patchValue({
            username: response.username,
            email: response.email,
            name: response.name,
            surname: response.surname,
            roleName,
            tenantId: response.tenantId,
            warehouseId: response.warehouseId,
          });
          if (response.tenantId) {
            this.loadWarehouses(response.tenantId);
          }
        }),
      );
    }
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  private loadWarehouses(tenantId: number): void {
    this.subs.add(
      this.warehousesService.getAll(tenantId).subscribe((list: Warehouse[]) => {
        this.warehouses = list;
      }),
    );
  }

  private removeValidatorsForEdit(): void {
    this.form.get('username')?.clearValidators();
    this.form.get('username')?.updateValueAndValidity();

    this.form.get('email')?.clearValidators();
    this.form.get('email')?.updateValueAndValidity();
  }

  get isValid(): boolean {
    return this.form.valid;
  }

  buttonSaveUser(): void {
    if (this.form.valid) {
      const v = this.form.value;
      const payload: UserPayload = {
        username: v.username,
        email: v.email,
        name: v.name,
        surname: v.surname,
        tenantId: Number(v.tenantId),
        warehouseId: Number(v.warehouseId),
        roleNames: [v.roleName as string],
        profilePicture: '',
      };

      if (this.userId) {
        const patch: Partial<UserPayload> = {
          name: payload.name,
          surname: payload.surname,
          tenantId: payload.tenantId,
          warehouseId: payload.warehouseId,
          roleNames: payload.roleNames,
        };
        this.usersService.edit(this.userId, patch).subscribe({
          next: () => this.dynamicDialogRef.close({ success: true }),
          error: () => {},
        });
      } else {
        this.usersService.create(payload).subscribe({
          next: () => {
            this.dynamicDialogRef.close({ success: true });
            this.form.reset();
          },
          error: () => {},
        });
      }
    } else {
      this.form.markAllAsTouched();
    }
  }
}
