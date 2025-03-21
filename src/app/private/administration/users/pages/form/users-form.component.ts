import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

import { Observable } from 'rxjs';

import { UsersService } from '../../services/users.service';
import { RolesService } from '../../../roles/services/roles.service';

import { Role } from '../../../roles/models/roles.model';
import { User } from '../../models/users.model';

@Component({
  selector: 'app-users-form',
  templateUrl: './users-form.component.html',
  styleUrl: './users-form.component.scss',
})
export class UserFormComponent implements OnInit {
  userId: number = 0;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly usersService: UsersService,
    private readonly rolesService: RolesService,
    private readonly dialogRef: DynamicDialogRef,
    private readonly dynamicDialogConfig: DynamicDialogConfig,
  ) {}

  form: FormGroup = this.formBuilder.group({
    username: ['', Validators.required],
    email: ['', Validators.required],
    name: ['', Validators.required],
    surname: ['', Validators.required],
    phoneNumber: ['', Validators.required],
    address: ['', Validators.required],
    roleId: [null, Validators.required],
  });

  ngOnInit(): void {
    if (this.dynamicDialogConfig.data.id) {
      const id = this.dynamicDialogConfig.data.id;
      this.userId = this.dynamicDialogConfig.data.id;
      this.usersService.getOne(id).subscribe((response: User) => {
        this.form.patchValue(response);
      });
    }
    this.rolesService.callGetList().subscribe();
  }

  get roles(): Observable<Role[]> {
    return this.rolesService.getList();
  }

  buttonSaveUser(): void {
    if (this.form) {
      const user = new User(this.form.value);
      if (this.dynamicDialogConfig.data.id) {
        const id = this.dynamicDialogConfig.data.id;
        this.usersService.edit(id, user).subscribe({
          next: () => this.dialogRef.close(),
          error: () => this.dialogRef.close(),
        });
      } else {
        this.usersService.create(user).subscribe({
          next: () => this.dialogRef.close(),
          error: () => this.dialogRef.close(),
        });
      }
    }
  }
}
