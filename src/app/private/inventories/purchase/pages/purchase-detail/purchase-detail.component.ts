import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { showError, showSuccess } from '../../../../../utils/notifications';
import type { PurchaseDetail, PurchaseLineRow } from '../../models/purchases-list.model';
import { PurchaseService } from '../../services/purchase.service';

@Component({
  selector: 'app-purchase-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    ToolbarModule,
    CardModule,
    ButtonModule,
    TableModule,
    InputTextModule,
    CalendarModule,
    ToastModule,
    ConfirmDialogModule,
  ],
  templateUrl: './purchase-detail.component.html',
  styleUrl: './purchase-detail.component.scss',
  providers: [ConfirmationService, MessageService],
})
export class PurchaseDetailComponent implements OnInit {
  purchase: PurchaseDetail | null = null;
  loading = true;
  headerForm = this.fb.group({
    documentNote: [''],
    registeredAt: [null as Date | null],
  });

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly fb: FormBuilder,
    private readonly purchaseApi: PurchaseService,
    private readonly messageService: MessageService,
    private readonly confirmationService: ConfirmationService,
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isFinite(id) || id < 1) {
      void this.router.navigate(['/inventories/purchase']);
      return;
    }
    this.purchaseApi.getOne(id).subscribe({
      next: p => {
        this.purchase = p;
        this.headerForm.patchValue({
          documentNote: p.documentNote ?? '',
          registeredAt: p.registeredAt ? new Date(p.registeredAt + 'T12:00:00') : null,
        });
        if (p.status !== 'ACTIVE') {
          this.headerForm.disable({ emitEvent: false });
        }
        this.loading = false;
      },
      error: () => {
        showError(this.messageService, 'No se encontró la compra.');
        void this.router.navigate(['/inventories/purchase']);
      },
    });
  }

  lineColorsSummary(line: PurchaseLineRow): string {
    if (!line.hasColorBreakdown || !line.colorDeltas?.length) {
      return '— (solo talla)';
    }
    return line.colorDeltas.map(c => `${c.colorDescription ?? c.colorId}: ${c.quantity}`).join(', ');
  }

  saveHeader(): void {
    if (!this.purchase || this.purchase.status !== 'ACTIVE') {
      return;
    }
    const v = this.headerForm.getRawValue();
    const reg = v.registeredAt instanceof Date ? v.registeredAt.toISOString().slice(0, 10) : null;
    this.purchaseApi
      .patchHeader(this.purchase.id, {
        documentNote: v.documentNote?.trim() || null,
        registeredAt: reg,
      })
      .subscribe({
        next: () => showSuccess(this.messageService, 'Datos guardados.'),
        error: () => showError(this.messageService, 'No se pudo guardar.'),
      });
  }

  confirmCancel(event?: Event): void {
    if (!this.purchase || this.purchase.status !== 'ACTIVE') {
      return;
    }
    this.confirmationService.confirm({
      target: event?.target as HTMLElement,
      message: '¿Anular esta compra? El stock ingresado se revertirá.',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, anular',
      rejectLabel: 'No',
      accept: () => {
        this.purchaseApi.cancel(this.purchase!.id, 'Anulación desde detalle de compra').subscribe({
          next: () => {
            showSuccess(this.messageService, 'Compra anulada.');
            void this.router.navigate(['/inventories/purchase']);
          },
          error: err => {
            const msg =
              err?.error?.message ??
              err?.error?.errors?.stock?.[0] ??
              'No se pudo anular.';
            showError(this.messageService, String(msg));
          },
        });
      },
    });
  }
}
