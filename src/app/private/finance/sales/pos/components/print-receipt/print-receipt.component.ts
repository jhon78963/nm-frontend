import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { prepareReceiptHtmlForPrint } from './print-receipt.print-document';

@Component({
  selector: 'app-print-receipt',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './print-receipt.component.html',
  styleUrl: './print-receipt.component.scss',
})
export class PrintReceiptComponent {
  /** HTML del ticket (p. ej. respuesta de `pos/sales/{id}/ticket`). Solo referencia visual oculta. */
  @Input() htmlContent = '';

  /** Prepara el HTML del backend para impresión aislada en iframe oculto. */
  static prepareForPrint(rawHtml: string): string {
    return prepareReceiptHtmlForPrint(rawHtml);
  }
}
