import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';

/**
 * Rendered by HasFeatureDirective when the tenant does not have
 * a commercial feature active.  Shows an inline lock badge and,
 * on click, opens a "Mejora tu plan" dialog.
 */
@Component({
  selector: 'app-feature-lock',
  standalone: true,
  imports: [CommonModule, ButtonModule, DialogModule],
  template: `
    <div class="feature-lock-badge" (click)="showDialog = true" title="Funcionalidad no disponible en tu plan">
      <i class="pi pi-lock feature-lock-icon"></i>
      <span class="feature-lock-label">Función bloqueada</span>
      <span class="feature-lock-upgrade">Mejorar plan →</span>
    </div>

    <p-dialog
      header="Mejora tu Plan"
      [(visible)]="showDialog"
      [modal]="true"
      [closable]="true"
      [draggable]="false"
      [style]="{ width: '440px' }"
    >
      <div class="upgrade-body">
        <div class="upgrade-icon-wrap">
          <i class="pi pi-lock upgrade-lock-icon"></i>
        </div>
        <p class="upgrade-feature-name">{{ featureName }}</p>
        <p class="upgrade-description">
          Esta funcionalidad no está incluida en el plan actual de tu empresa.
          Contacta con tu proveedor para activarla.
        </p>
      </div>

      <ng-template pTemplate="footer">
        <p-button
          label="Cerrar"
          icon="pi pi-times"
          styleClass="p-button-text p-button-secondary"
          (click)="showDialog = false"
        />
        <p-button
          label="Ver Planes"
          icon="pi pi-arrow-up-right"
          styleClass="p-button-warning"
          (click)="showDialog = false"
        />
      </ng-template>
    </p-dialog>
  `,
  styles: [
    `
      .feature-lock-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.45rem 0.9rem;
        background: var(--surface-100, #f4f4f4);
        border: 1.5px dashed var(--yellow-400, #fbbf24);
        border-radius: 6px;
        color: var(--text-color-secondary, #6b7280);
        cursor: pointer;
        transition: background 0.2s;
        user-select: none;
      }

      .feature-lock-badge:hover {
        background: var(--yellow-50, #fffbeb);
      }

      .feature-lock-icon {
        color: var(--yellow-500, #f59e0b);
        font-size: 1rem;
      }

      .feature-lock-label {
        font-size: 0.8rem;
        font-weight: 600;
      }

      .feature-lock-upgrade {
        font-size: 0.75rem;
        color: var(--yellow-600, #d97706);
        font-weight: 600;
      }

      .upgrade-body {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.75rem;
        padding: 1rem 0.5rem;
        text-align: center;
      }

      .upgrade-icon-wrap {
        width: 64px;
        height: 64px;
        border-radius: 50%;
        background: var(--yellow-50, #fffbeb);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .upgrade-lock-icon {
        font-size: 1.75rem;
        color: var(--yellow-500, #f59e0b);
      }

      .upgrade-feature-name {
        font-weight: 700;
        font-size: 1rem;
        color: var(--text-color, #1f2937);
        margin: 0;
        text-transform: capitalize;
      }

      .upgrade-description {
        font-size: 0.9rem;
        color: var(--text-color-secondary, #6b7280);
        margin: 0;
        max-width: 340px;
      }
    `,
  ],
})
export class FeatureLockComponent {
  @Input() featureName = '';
  showDialog = false;
}
