import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { KeyFilterModule } from 'primeng/keyfilter';
import { SharedModule } from '../../../../../shared/shared.module';
import { LockersService } from '../../services/lockers.service';

@Component({
  selector: 'app-locker-form',
  standalone: true,
  imports: [CommonModule, KeyFilterModule, ReactiveFormsModule, SharedModule],
  templateUrl: './locker-form.component.html',
  styleUrl: './locker-form.component.scss',
})
export class LockerFormComponent {
  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly dynamicDialogRef: DynamicDialogRef,
    private readonly lockersService: LockersService,
  ) {}

  form: FormGroup = this.formBuilder.group({
    price: [null, Validators.required],
  });

  lockerSaveButton() {
    const newPrice = this.form.get('price')?.value;
    this.lockersService.update(newPrice).subscribe({
      next: () => {
        this.dynamicDialogRef.close({ success: true });
      },
    });
  }

  get isFormValid(): boolean {
    return this.form.valid;
  }
}
