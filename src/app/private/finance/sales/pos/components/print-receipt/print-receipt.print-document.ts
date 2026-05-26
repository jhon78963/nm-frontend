/** Estilos ESC-POS / térmica 80mm inyectados en el documento aislado del iframe. */
export const RECEIPT_PRINT_CSS = `
  @page {
    margin: 0;
    size: 80mm auto;
  }

  html,
  body {
    width: 80mm;
    max-width: 80mm;
    min-width: 80mm;
    margin: 0;
    padding: 0;
    background: #ffffff;
    color: #000000;
    overflow: visible;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .receipt-print,
  .receipt-print * {
    visibility: visible;
  }

  @media print {
    html,
    body {
      width: 80mm !important;
      max-width: 80mm !important;
      margin: 0 !important;
      padding: 0 !important;
    }

    body {
      background: #ffffff !important;
    }
  }
`;

/** Elimina scripts de auto-impresión del HTML del backend (evita doble diálogo / viewport incorrecto). */
export function stripAutoPrintScripts(html: string): string {
  return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
}

/** Inserta estilos de aislamiento en un documento HTML completo o envuelve un fragmento. */
export function prepareReceiptHtmlForPrint(rawHtml: string): string {
  const sanitized = stripAutoPrintScripts(rawHtml.trim());
  const styleBlock = `<style id="pos-receipt-print-isolation">${RECEIPT_PRINT_CSS}</style>`;

  if (/<\/head>/i.test(sanitized)) {
    return sanitized.replace(/<\/head>/i, `${styleBlock}</head>`);
  }

  if (/<html[\s>]/i.test(sanitized)) {
    return sanitized.replace(
      /<html([^>]*)>/i,
      `<html$1><head><meta charset="utf-8">${styleBlock}</head>`,
    );
  }

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Ticket</title>
  ${styleBlock}
</head>
<body>
  <div class="receipt-print">${sanitized}</div>
</body>
</html>`;
}
