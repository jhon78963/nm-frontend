import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { sanitizeReceiptFragment } from '../../../../../../utils/receipt-sanitizer';
import {
  buildReceiptPrintHostMarkup,
  prepareReceiptHtmlForPrint,
} from './print-receipt.print-document';

@Component({
  selector: 'app-print-receipt',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './print-receipt.component.html',
  styleUrl: './print-receipt.component.scss',
})
export class PrintReceiptComponent {
  private sanitizer = inject(DomSanitizer);

  /** DOMPurify-cleaned HTML ready for [innerHTML]. */
  safeHtmlContent: SafeHtml = '';

  /** HTML del ticket (p. ej. respuesta de `pos/sales/{id}/ticket`). Solo referencia visual oculta. */
  @Input() set htmlContent(raw: string) {
    this.safeHtmlContent = this.sanitizer.bypassSecurityTrustHtml(
      sanitizeReceiptFragment(raw),
    );
  }

  /** Prepara el HTML del backend para impresión aislada (iframe / blob tab). */
  static prepareForPrint(rawHtml: string, autoPrint = false): string {
    return prepareReceiptHtmlForPrint(rawHtml, autoPrint);
  }

  /** Marca HTML lista para inyectar en #pos-ticket-print-host (Android / viewport principal). */
  static buildHostMarkup(rawHtml: string): string {
    return buildReceiptPrintHostMarkup(rawHtml);
  }
}
