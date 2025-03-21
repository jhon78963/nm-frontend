import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { RolesService } from '../../services/roles.service';
import { Role } from '../../models/roles.model';

@Component({
  selector: 'app-roles-form',
  templateUrl: './roles-form.component.html',
  styleUrl: './roles-form.component.scss',
})
export class RolesFormComponent implements OnInit {
  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly rolesService: RolesService,
    private readonly dialogRef: DynamicDialogRef,
    private readonly dynamicDialogConfig: DynamicDialogConfig,
  ) {}
  form: FormGroup = this.formBuilder.group({
    name: ['', Validators.required],
  });

  ngOnInit(): void {
    if (this.dynamicDialogConfig.data.id) {
      const id = this.dynamicDialogConfig.data.id;
      this.rolesService.getOne(id).subscribe((response: Role) => {
        this.form.patchValue(response);
      });
    }
  }

  buttonSaveRole() {
    if (this.form) {
      const role = new Role(this.form.value);
      if (this.dynamicDialogConfig.data.id) {
        const id = this.dynamicDialogConfig.data.id;
        this.rolesService.edit(id, role).subscribe({
          next: () => this.dialogRef.close(),
          error: () => this.dialogRef.close(),
        });
      } else {
        this.rolesService.create(role).subscribe({
          next: () => this.dialogRef.close(),
          error: () => this.dialogRef.close(),
        });
      }
    }
  }
}
