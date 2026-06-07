import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, ViewChild } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { RippleModule } from 'primeng/ripple';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { showError, showSuccess } from '../../../../../utils/notifications';
import { SafeUrlPipe } from '../../../../finance/cash-movements/pipes/safe-url.pipe';
import { CashflowService } from '../../../../finance/cash-movements/services/cash-movements.service';
import { VoucherDropzoneComponent } from '../../../../shared/components/voucher-dropzone/voucher-dropzone.component';
import type {
  PurchaseDetail,
  PurchaseLineRow,
  PurchaseLinkedPayment,
} from '../../models/purchases-list.model';
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
    InputNumberModule,
    CalendarModule,
    ToastModule,
    ConfirmDialogModule,
    DialogModule,
    RippleModule,
    SafeUrlPipe,
    TagModule,
    TooltipModule,
    VoucherDropzoneComponent,
  ],
  templateUrl: './purchase-detail.component.html',
  styleUrl: './purchase-detail.component.scss',
  providers: [ConfirmationService, MessageService],
})
export class PurchaseDetailComponent implements OnInit {
  purchase: PurchaseDetail | null = null;
  loading = true;
  savingLineId = new Set<number>();

  displayPreview = signal(false);
  previewUrl = signal('');
  isPdf = signal(false);
  previewLoading = signal(false);
  previewItems: string[] = [];
  previewIndex = 0;
  private previewObjectUrl: string | null = null;

  selectedVoucherFiles: File[] = [];
  savingVouchers = signal(false);

  @ViewChild('voucherDropzone') voucherDropzone?: VoucherDropzoneComponent;

  readonly maxVouchers = 10;

  headerForm = this.fb.group({
    documentNote: [''],
    registeredAt: [null as Date | null],
  });

  /** Edición en paralelo al detalle cargado (misma cantidad de filas que `purchase.lines`). */
  linesForm = this.fb.array<FormGroup>([]);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly fb: FormBuilder,
    private readonly purchaseApi: PurchaseService,
    private readonly cashflowService: CashflowService,
    private readonly messageService: MessageService,
    private readonly confirmationService: ConfirmationService,
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isFinite(id) || id < 1) {
      void this.router.navigate(['/inventories/purchase']);
      return;
    }
    this.loadPurchase(id);
  }

  private loadPurchase(id: number): void {
    this.loading = true;
    this.purchaseApi.getOne(id).subscribe({
      next: p => {
        this.applyPurchase(p);
        this.loading = false;
      },
      error: () => {
        showError(this.messageService, 'No se encontró la compra.');
        void this.router.navigate(['/inventories/purchase']);
      },
    });
  }

  private applyPurchase(p: PurchaseDetail): void {
    this.purchase = p;
    this.headerForm.patchValue({
      documentNote: p.documentNote ?? '',
      registeredAt: p.registeredAt
        ? new Date(p.registeredAt + 'T12:00:00')
        : null,
    });
    if (p.status !== 'ACTIVE') {
      this.headerForm.disable({ emitEvent: false });
    } else {
      this.headerForm.enable({ emitEvent: false });
    }
    this.rebuildLinesForm(p.lines ?? []);
  }

  private rebuildLinesForm(lines: PurchaseLineRow[]): void {
    this.linesForm.clear({ emitEvent: false });
    for (const line of lines) {
      this.linesForm.push(this.buildLineEditGroup(line));
    }
    if (this.purchase?.status !== 'ACTIVE') {
      this.linesForm.disable({ emitEvent: false });
    } else {
      this.linesForm.enable({ emitEvent: false });
    }
  }

  private buildLineEditGroup(line: PurchaseLineRow): FormGroup {
    const deltas = line.colorDeltas ?? [];
    const sizeOnlyQty =
      !line.hasColorBreakdown || deltas.length === 0
        ? line.sizeStockDelta
        : (deltas[0]?.quantity ?? line.sizeStockDelta);

    return this.fb.group({
      id: [line.id],
      barcode: [line.barcode ?? ''],
      purchasePrice: [Number(line.purchasePrice) || 0],
      salePrice: [Number(line.salePrice) || 0],
      minSalePrice: [Number(line.minSalePrice) || 0],
      hasColorBreakdown: [line.hasColorBreakdown],
      sizeOnlyQuantity: [Math.max(1, Number(sizeOnlyQty) || 1), []],
      colorDeltas: this.fb.array(
        deltas.map(d =>
          this.fb.group({
            colorId: [d.colorId],
            quantity: [Math.max(1, Number(d.quantity) || 1)],
          }),
        ),
      ),
    });
  }

  lineEditAt(index: number): FormGroup {
    return this.linesForm.at(index) as FormGroup;
  }

  colorDeltaControls(lineIdx: number): FormGroup[] {
    const arr = this.lineEditAt(lineIdx).get('colorDeltas') as FormArray;
    return arr.controls as FormGroup[];
  }

  lineColorsSummary(line: PurchaseLineRow): string {
    if (!line.hasColorBreakdown || !line.colorDeltas?.length) {
      return '— (solo talla)';
    }
    return line.colorDeltas
      .map(c => `${c.colorDescription ?? String(c.colorId)}: ${c.quantity}`)
      .join(', ');
  }

  saveHeader(): void {
    if (!this.purchase || this.purchase.status !== 'ACTIVE') {
      return;
    }
    const v = this.headerForm.getRawValue();
    const reg =
      v.registeredAt instanceof Date
        ? v.registeredAt.toISOString().slice(0, 10)
        : null;
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

  saveLine(index: number): void {
    if (!this.purchase || this.purchase.status !== 'ACTIVE') {
      return;
    }
    const line = this.purchase.lines[index];
    const g = this.lineEditAt(index);
    if (!line || !g) {
      return;
    }
    const raw = g.getRawValue() as {
      id: number;
      barcode: string | null;
      purchasePrice: number;
      salePrice: number;
      minSalePrice: number;
      hasColorBreakdown: boolean;
      sizeOnlyQuantity: number;
      colorDeltas: { colorId: number; quantity: number }[];
    };

    const body: {
      barcode?: string | null;
      purchasePrice: number;
      salePrice?: number | null;
      minSalePrice?: number | null;
      colorDeltas?: { colorId: number; quantity: number }[];
      sizeOnlyQuantity?: number;
    } = {
      barcode: raw.barcode?.trim() || null,
      purchasePrice: Number(raw.purchasePrice) || 0,
      salePrice: Number(raw.salePrice) || 0,
      minSalePrice: Number(raw.minSalePrice) || 0,
    };

    if (raw.hasColorBreakdown) {
      body.colorDeltas = (raw.colorDeltas ?? []).map(d => ({
        colorId: Number(d.colorId),
        quantity: Math.max(1, Number(d.quantity) || 1),
      }));
    } else {
      body.sizeOnlyQuantity = Math.max(1, Number(raw.sizeOnlyQuantity) || 1);
    }

    this.savingLineId.add(line.id);
    this.purchaseApi.updateLine(this.purchase.id, line.id, body).subscribe({
      next: () => {
        this.savingLineId.delete(line.id);
        showSuccess(this.messageService, 'Línea actualizada.');
        this.loadPurchase(this.purchase!.id);
      },
      error: err => {
        this.savingLineId.delete(line.id);
        const msg =
          err?.error?.message ??
          err?.error?.errors?.stock?.[0] ??
          'No se pudo guardar la línea.';
        showError(this.messageService, String(msg));
      },
    });
  }

  confirmDeleteLine(index: number, event?: Event): void {
    if (!this.purchase || this.purchase.status !== 'ACTIVE') {
      return;
    }
    const line = this.purchase.lines[index];
    if (!line) {
      return;
    }
    this.confirmationService.confirm({
      target: event?.target as HTMLElement,
      message:
        '¿Eliminar esta línea? Se revertirá el stock ingresado solo de esta fila.',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'No',
      accept: () => {
        this.savingLineId.add(line.id);
        this.purchaseApi.deleteLine(this.purchase!.id, line.id).subscribe({
          next: () => {
            this.savingLineId.delete(line.id);
            showSuccess(this.messageService, 'Línea eliminada.');
            this.loadPurchase(this.purchase!.id);
          },
          error: err => {
            this.savingLineId.delete(line.id);
            const msg =
              err?.error?.message ??
              err?.error?.errors?.stock?.[0] ??
              'No se pudo eliminar la línea.';
            showError(this.messageService, String(msg));
          },
        });
      },
    });
  }

  isLineBusy(lineId: number): boolean {
    return this.savingLineId.has(lineId);
  }

  linkedPayment(): PurchaseLinkedPayment | null {
    return this.purchase?.linkedPayment ?? null;
  }

  linkedVoucherPaths(): string[] {
    const payment = this.linkedPayment();
    if (!payment) {
      return [];
    }
    if (payment.voucherPaths?.length) {
      return payment.voucherPaths;
    }
    return payment.voucherPath ? [payment.voucherPath] : [];
  }

  canAddVouchers(): boolean {
    return (
      this.purchase?.status === 'ACTIVE' &&
      this.linkedVoucherPaths().length < this.maxVouchers
    );
  }

  remainingVoucherSlots(): number {
    return Math.max(0, this.maxVouchers - this.linkedVoucherPaths().length);
  }

  onDropzoneFiles(files: File[]): void {
    const slots = this.remainingVoucherSlots();
    this.selectedVoucherFiles = slots > 0 ? files.slice(0, slots) : [];
  }

  saveVouchers(): void {
    if (!this.purchase || !this.canAddVouchers()) {
      return;
    }
    if (this.selectedVoucherFiles.length === 0) {
      showError(this.messageService, 'Selecciona al menos un comprobante.');
      return;
    }

    this.savingVouchers.set(true);
    this.purchaseApi
      .addVouchers(this.purchase.id, this.selectedVoucherFiles)
      .subscribe({
        next: () => {
          this.savingVouchers.set(false);
          this.selectedVoucherFiles = [];
          this.voucherDropzone?.clear();
          showSuccess(this.messageService, 'Comprobantes agregados.');
          this.loadPurchase(this.purchase!.id);
        },
        error: err => {
          this.savingVouchers.set(false);
          const msg =
            err?.error?.message ?? 'No se pudieron agregar los comprobantes.';
          showError(this.messageService, String(msg));
        },
      });
  }

  showVoucher(paths: string | string[]): void {
    const items = (Array.isArray(paths) ? paths : [paths]).filter(Boolean);
    this.previewItems = items;
    this.previewIndex = 0;
    if (!this.previewItems.length) {
      return;
    }
    this.loadPreviewAt(0);
  }

  showLinkedVoucher(): void {
    const paths = this.linkedVoucherPaths();
    if (!paths.length) {
      return;
    }
    this.showVoucher(paths);
  }

  prevPreview(): void {
    if (this.previewIndex > 0) {
      this.loadPreviewAt(this.previewIndex - 1);
    }
  }

  nextPreview(): void {
    if (this.previewIndex < this.previewItems.length - 1) {
      this.loadPreviewAt(this.previewIndex + 1);
    }
  }

  private loadPreviewAt(index: number): void {
    const path = this.previewItems[index];
    this.revokePreviewUrl();
    this.previewIndex = index;
    this.isPdf.set(path.toLowerCase().endsWith('.pdf'));
    this.displayPreview.set(true);
    this.previewLoading.set(true);

    this.cashflowService.getVoucherPreview(path).subscribe({
      next: blob => {
        this.previewObjectUrl = URL.createObjectURL(blob);
        this.previewUrl.set(this.previewObjectUrl);
        this.previewLoading.set(false);
      },
      error: () => {
        this.previewLoading.set(false);
        this.displayPreview.set(false);
        showError(this.messageService, 'No se pudo cargar el comprobante.');
      },
    });
  }

  onPreviewVisibleChange(visible: boolean): void {
    this.displayPreview.set(visible);
    if (!visible) {
      this.revokePreviewUrl();
    }
  }

  private revokePreviewUrl(): void {
    if (this.previewObjectUrl) {
      URL.revokeObjectURL(this.previewObjectUrl);
      this.previewObjectUrl = null;
    }
    this.previewUrl.set('');
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
        this.purchaseApi
          .cancel(this.purchase!.id, 'Anulación desde detalle de compra')
          .subscribe({
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
