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

const PREVIEW_TOOLBAR_CSS = `
  .receipt-preview-toolbar {
    position: sticky;
    top: 0;
    z-index: 9999;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
    background: #1e293b;
    color: #f8fafc;
    font-family: sans-serif, system-ui, -apple-system, BlinkMacSystemFont;
    font-size: 13px;
    box-shadow: 0 2px 8px rgba(15, 23, 42, 0.25);
  }

  .receipt-preview-toolbar__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .receipt-preview-toolbar button {
    border: 0;
    border-radius: 6px;
    padding: 8px 14px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
  }

  .receipt-preview-toolbar button.primary {
    background: #2563eb;
    color: #ffffff;
  }

  .receipt-preview-toolbar button.secondary {
    background: #e2e8f0;
    color: #0f172a;
  }

  @media print {
    .receipt-preview-toolbar {
      display: none !important;
    }
  }
`;

const PREVIEW_TOOLBAR_HTML = `
<div class="receipt-preview-toolbar">
  <span>Vista previa del ticket</span>
  <div class="receipt-preview-toolbar__actions">
    <button type="button" class="primary" onclick="window.focus(); window.print();">Imprimir / PDF</button>
    <button type="button" class="secondary" onclick="window.close();">Cerrar</button>
  </div>
</div>`;

/** Documento de ticket con barra de previsualización (sin auto-impresión). */
export function prepareReceiptHtmlForPreview(rawHtml: string): string {
  const printable = prepareReceiptHtmlForPrint(rawHtml, false);

  if (/<body[^>]*>/i.test(printable)) {
    return printable.replace(
      /<body([^>]*)>/i,
      `<body$1>${PREVIEW_TOOLBAR_HTML}`,
    ).replace(
      /<style id="pos-receipt-print-isolation">/i,
      `<style id="pos-receipt-print-isolation">${PREVIEW_TOOLBAR_CSS}`,
    );
  }

  return prepareReceiptHtmlForPrint(
    `${PREVIEW_TOOLBAR_HTML}<div class="receipt-print">${rawHtml}</div>`,
    false,
  );
}
