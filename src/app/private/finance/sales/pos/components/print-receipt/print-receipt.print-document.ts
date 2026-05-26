/** Estilos ESC-POS / térmica 80mm inyectados en el host de impresión del DOM. */
export const RECEIPT_PRINT_CSS = `
  @page {
    margin: 0;
    size: 80mm auto;
  }

  #pos-ticket-print-host,
  #pos-ticket-print-host .receipt-print {
    width: 80mm;
    max-width: 80mm;
    min-width: 80mm;
    margin: 0;
    padding: 0;
    background: #ffffff;
    color: #000000;
    box-sizing: border-box;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  #pos-ticket-print-host .receipt-print {
    font-family: sans-serif, system-ui, -apple-system, BlinkMacSystemFont;
    font-size: 12px;
    font-weight: 900;
  }
`;

export const POS_PRINT_BODY_CLASS = 'pos-printing-ticket';
export const POS_PRINT_HOST_ID = 'pos-ticket-print-host';
export const POS_PRINT_HEAD_STYLE_ID = 'pos-print-head-styles';

/** Elimina scripts de auto-impresión del HTML del backend. */
export function stripAutoPrintScripts(html: string): string {
  return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
}

export interface ReceiptPrintFragment {
  styles: string;
  body: string;
}

/** Extrae estilos y contenido del body de un documento HTML completo. */
export function extractReceiptFragment(rawHtml: string): ReceiptPrintFragment {
  const sanitized = stripAutoPrintScripts(rawHtml.trim());
  const styleMatches = sanitized.match(/<style[^>]*>[\s\S]*?<\/style>/gi) ?? [];
  const bodyMatch = sanitized.match(/<body[^>]*>([\s\S]*?)<\/body>/i);

  return {
    styles: styleMatches.join('\n'),
    body: bodyMatch?.[1]?.trim() ?? sanitized,
  };
}

const AUTO_PRINT_SCRIPT = `<script>
window.addEventListener('load', function () {
  setTimeout(function () { window.focus(); window.print(); }, 400);
});
</script>`;

/** Documento HTML aislado listo para iframe, blob tab o popup. */
export function prepareReceiptHtmlForPrint(
  rawHtml: string,
  autoPrint = false,
): string {
  const sanitized = stripAutoPrintScripts(rawHtml.trim());
  const metaBlock =
    '<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">';
  const styleBlock = `<style id="pos-receipt-print-isolation">${RECEIPT_PRINT_CSS}</style>`;
  const printScript = autoPrint ? AUTO_PRINT_SCRIPT : '';

  if (/<html[\s>]/i.test(sanitized)) {
    let html = sanitized;

    if (/<\/head>/i.test(html)) {
      html = html.replace(/<\/head>/i, `${metaBlock}${styleBlock}</head>`);
    } else {
      html = html.replace(
        /<html([^>]*)>/i,
        `<html$1><head>${metaBlock}${styleBlock}</head>`,
      );
    }

    if (printScript && /<\/body>/i.test(html)) {
      html = html.replace(/<\/body>/i, `${printScript}</body>`);
    }

    return html;
  }

  return `<!DOCTYPE html>
<html lang="es">
<head>
  ${metaBlock}
  <title>Ticket</title>
  ${styleBlock}
</head>
<body>
  <div class="receipt-print">${sanitized}</div>
  ${printScript}
</body>
</html>`;
}

/** CSS global inyectado en <head> mientras dura la impresión del ticket en Android. */
export const POS_PRINT_GLOBAL_CSS = `
  @page {
    margin: 0;
    size: 80mm auto;
  }

  @media print {
    html,
    body {
      width: 80mm !important;
      max-width: 80mm !important;
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
    }

    body.${POS_PRINT_BODY_CLASS} > *:not(#${POS_PRINT_HOST_ID}) {
      display: none !important;
    }

    body.${POS_PRINT_BODY_CLASS} #${POS_PRINT_HOST_ID} {
      display: block !important;
      position: static !important;
      width: 80mm !important;
      max-width: 80mm !important;
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
    }
  }
`;

export function buildReceiptPrintHostMarkup(rawHtml: string): string {
  const { styles, body } = extractReceiptFragment(rawHtml);

  return `
    <style>${RECEIPT_PRINT_CSS}${styles}</style>
    <div class="receipt-print">${body}</div>
  `;
}
