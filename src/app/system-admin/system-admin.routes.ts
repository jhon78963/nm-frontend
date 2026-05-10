import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterModule, Routes } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../auth/services/auth.service';
import { PermissionsService } from '../auth/services/permissions.service';

// ---------------------------------------------------------------------------
// Shell layout del panel System Admin (proveedor SaaS).
// ---------------------------------------------------------------------------
@Component({
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule],
  template: `
    <div class="sa-shell">
      <header class="sa-topbar">
        <div class="sa-brand">
          <i class="pi pi-shield"></i>
          <span>System Admin</span>
        </div>
        <nav class="sa-nav">
          <a routerLink="tenants" routerLinkActive="active" class="sa-nav-link">
            <i class="pi pi-building"></i> Empresas
          </a>
        </nav>
        <div class="sa-actions">
          <button class="sa-logout" (click)="logout()">
            <i class="pi pi-sign-out"></i> Salir
          </button>
        </div>
      </header>
      <main class="sa-content">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [
    `
      .sa-shell {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
        background: #1e293b;
        color: #f8fafc;
      }
      .sa-topbar {
        display: flex;
        align-items: center;
        gap: 1.5rem;
        padding: 0 2rem;
        height: 56px;
        background: #0f172a;
        border-bottom: 1px solid #334155;
        flex-shrink: 0;
      }
      .sa-brand {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: 800;
        font-size: 1rem;
        color: #f8fafc;
        letter-spacing: 0.03em;
        i {
          color: #facc15;
        }
      }
      .sa-nav {
        display: flex;
        gap: 0.25rem;
        flex: 1;
      }
      .sa-nav-link {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.35rem 0.75rem;
        border-radius: 6px;
        font-size: 0.88rem;
        color: #94a3b8;
        text-decoration: none;
        transition: all 0.15s;
        i {
          font-size: 0.9rem;
        }
        &:hover {
          background: #1e293b;
          color: #f8fafc;
        }
        &.active {
          background: #1d3461;
          color: #60a5fa;
          font-weight: 600;
        }
      }
      .sa-actions {
        margin-left: auto;
      }
      .sa-logout {
        background: none;
        border: 1px solid #334155;
        color: #94a3b8;
        border-radius: 6px;
        padding: 0.3rem 0.7rem;
        cursor: pointer;
        font-size: 0.82rem;
        display: flex;
        align-items: center;
        gap: 0.4rem;
        transition: all 0.15s;
        &:hover {
          border-color: #ef4444;
          color: #fca5a5;
        }
      }
      .sa-content {
        flex: 1;
        overflow: auto;
      }
    `,
  ],
})
class SystemAdminShellComponent {
  private readonly permissionsService = inject(PermissionsService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  logout(): void {
    const tokens = JSON.parse(localStorage.getItem('tokenData') ?? '{}');
    this.authService
      .logout(tokens.refreshToken ?? null, tokens.accessToken ?? null)
      .subscribe({
        next: () => this.router.navigateByUrl('/auth/login'),
        error: () => this.router.navigateByUrl('/auth/login'),
      });
  }
}

// ---------------------------------------------------------------------------
// Dashboard del proveedor
// ---------------------------------------------------------------------------
@Component({
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div style="padding: 2rem; color: #f8fafc;">
      <h2 style="font-size:1.4rem; font-weight:700; margin-bottom:0.5rem;">
        <i
          class="pi pi-th-large"
          style="color:#3b82f6; margin-right:0.5rem;"></i>
        Panel del Proveedor SaaS
      </h2>
      <p style="color:#94a3b8; margin-bottom:1.5rem;">
        Gestión global de clientes, módulos y configuración de infraestructura.
      </p>
      <a
        routerLink="tenants"
        style="display:inline-flex;align-items:center;gap:0.5rem;background:#1d3461;color:#60a5fa;padding:0.6rem 1.2rem;border-radius:8px;text-decoration:none;font-weight:600;font-size:0.9rem;">
        <i class="pi pi-building"></i> Ver Empresas (Tenants)
      </a>
    </div>
  `,
})
class SystemAdminDashboardComponent {}

// ---------------------------------------------------------------------------
// Route table
// ---------------------------------------------------------------------------
export const SYSTEM_ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: SystemAdminShellComponent,
    children: [
      { path: '', component: SystemAdminDashboardComponent },
      {
        path: 'tenants',
        loadChildren: () =>
          import('./tenants/tenants.routes').then(m => m.TENANTS_ROUTES),
      },
    ],
  },
];
