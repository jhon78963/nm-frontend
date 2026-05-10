import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DialogModule } from 'primeng/dialog';
import { FEATURE_OPTIONS, SystemTenant } from '../system-tenant.model';
import { SystemTenantService } from '../system-tenant.service';
import { TenantWizardComponent } from '../wizard/tenant-wizard.component';

@Component({
  selector: 'app-tenant-list',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    BadgeModule,
    ButtonModule,
    ToastModule,
    TagModule,
    ProgressSpinnerModule,
    DialogModule,
    TenantWizardComponent,
  ],
  providers: [MessageService],
  templateUrl: './tenant-list.component.html',
  styleUrl: './tenant-list.component.scss',
})
export class TenantListComponent implements OnInit {
  tenants = signal<SystemTenant[]>([]);
  loading = signal(false);
  showWizard = signal(false);

  readonly featureOptions = FEATURE_OPTIONS;

  constructor(
    private readonly service: SystemTenantService,
    private readonly messageService: MessageService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.service.getAllTenants().subscribe({
      next: data => {
        this.tenants.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast('error', 'Error al cargar los tenants.');
      },
    });
  }

  openWizard(): void {
    this.showWizard.set(true);
  }

  onWizardClose(success: boolean): void {
    this.showWizard.set(false);
    if (success) {
      this.toast('success', 'Empresa registrada exitosamente.');
      this.load();
    }
  }

  featureLabel(value: string): string {
    return this.featureOptions.find(f => f.value === value)?.label ?? value;
  }

  private toast(severity: 'success' | 'error', detail: string): void {
    this.messageService.add({
      severity,
      summary: severity === 'success' ? 'Listo' : 'Error',
      detail,
      life: 4000,
    });
  }
}
