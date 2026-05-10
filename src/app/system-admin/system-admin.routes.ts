import { Routes } from '@angular/router';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// ---------------------------------------------------------------------------
// Minimal layout for the System-Admin panel (provider-only area).
// Replace with a full sidebar/topbar layout as the module grows.
// ---------------------------------------------------------------------------
@Component({
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="system-admin-shell">
      <header class="system-admin-header">
        <span class="system-admin-brand">
          <i class="pi pi-shield"></i> System Admin
        </span>
      </header>
      <main class="system-admin-content">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [
    `
      .system-admin-shell {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
        background: var(--surface-50, #f9fafb);
      }
      .system-admin-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 1rem 2rem;
        background: #1e293b;
        color: #f1f5f9;
        font-weight: 700;
        font-size: 1.1rem;
      }
      .system-admin-brand i {
        color: #facc15;
      }
      .system-admin-content {
        flex: 1;
        padding: 2rem;
      }
    `,
  ],
})
class SystemAdminShellComponent {}

// ---------------------------------------------------------------------------
// Dashboard placeholder – replace with the real tenant/billing components.
// ---------------------------------------------------------------------------
@Component({
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="sa-dashboard">
      <h2><i class="pi pi-th-large"></i> Dashboard del Proveedor</h2>
      <p>Gestión de Tenants, Facturación y Configuración Global.</p>
      <ul>
        <li><strong>/system-admin/tenants</strong> — alta/baja de clientes</li>
        <li><strong>/system-admin/billing</strong> — facturación y planes</li>
        <li><strong>/system-admin/features</strong> — activar/desactivar features por tenant</li>
      </ul>
    </div>
  `,
  styles: [
    `
      .sa-dashboard {
        max-width: 720px;
      }
      h2 {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        font-size: 1.4rem;
        color: #1e293b;
      }
      li {
        margin: 0.4rem 0;
        font-size: 0.95rem;
      }
    `,
  ],
})
class SystemAdminDashboardComponent {}

// ---------------------------------------------------------------------------
// Route table exported for app.routes.ts
// ---------------------------------------------------------------------------
export const SYSTEM_ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: SystemAdminShellComponent,
    children: [
      { path: '', component: SystemAdminDashboardComponent },
      // Future lazy children:
      // { path: 'tenants',  loadChildren: () => import('./tenants/tenants.routes').then(m => m.TENANTS_ROUTES) },
      // { path: 'billing',  loadChildren: () => import('./billing/billing.routes').then(m => m.BILLING_ROUTES) },
      // { path: 'features', loadChildren: () => import('./features/features.routes').then(m => m.FEATURES_ROUTES) },
    ],
  },
];
