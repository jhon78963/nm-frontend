import { Component, EventEmitter, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';
import { DividerModule } from 'primeng/divider';
import { FEATURE_OPTIONS, ProvisionPayload } from '../system-tenant.model';
import { SystemTenantService } from '../system-tenant.service';

@Component({
  selector: 'app-tenant-wizard',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    CheckboxModule,
    ToastModule,
    DividerModule,
  ],
  providers: [MessageService],
  templateUrl: './tenant-wizard.component.html',
  styleUrl: './tenant-wizard.component.scss',
})
export class TenantWizardComponent {
  @Output() wizardClose = new EventEmitter<boolean>();

  form: FormGroup;
  saving = signal(false);
  backendError = signal<string | null>(null);

  readonly featureOptions = FEATURE_OPTIONS;

  constructor(
    private readonly fb: FormBuilder,
    private readonly service: SystemTenantService,
    private readonly messageService: MessageService,
  ) {
    this.form = this.fb.group({
      // — Sección Empresa —
      tenant_name: ['', [Validators.required, Validators.maxLength(100)]],
      features: [[] as string[]],
      // — Sección Administrador —
      admin_name: ['', [Validators.required, Validators.maxLength(100)]],
      admin_email: ['', [Validators.required, Validators.email]],
      admin_password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  isFeatureSelected(value: string): boolean {
    const current: string[] = this.form.get('features')?.value ?? [];
    return current.includes(value);
  }

  toggleFeature(value: string): void {
    const current: string[] = this.form.get('features')?.value ?? [];
    const updated = current.includes(value)
      ? current.filter(f => f !== value)
      : [...current, value];
    this.form.get('features')?.setValue(updated);
  }

  submit(): void {
    if (this.form.invalid || this.saving()) return;

    this.backendError.set(null);
    this.saving.set(true);

    const payload: ProvisionPayload = {
      tenant_name: this.form.value.tenant_name,
      admin_name:  this.form.value.admin_name,
      admin_email: this.form.value.admin_email,
      admin_password: this.form.value.admin_password,
      features: this.form.value.features ?? [],
    };

    this.service.createTenantWithAdmin(payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.wizardClose.emit(true);
      },
      error: err => {
        this.saving.set(false);
        const msg: string =
          err?.error?.message ??
          err?.error?.errors?.admin_email?.[0] ??
          'Error al registrar la empresa.';
        this.backendError.set(msg);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: msg,
          life: 5000,
        });
      },
    });
  }

  cancel(): void {
    this.wizardClose.emit(false);
  }
}
