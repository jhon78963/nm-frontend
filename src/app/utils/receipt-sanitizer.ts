import DOMPurify from 'dompurify';

/**
 * Tags permitted in POS receipt HTML.
 * Structural/layout elements only — no executable content.
 */
const RECEIPT_ALLOWED_TAGS: string[] = [
  'a',
  'b',
  'br',
  'caption',
  'code',
  'col',
  'colgroup',
  'div',
  'em',
  'footer',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'header',
  'hr',
  'i',
  'img',
  'li',
  'ol',
  'p',
  'pre',
  's',
  'section',
  'small',
  'span',
  'strong',
  'sub',
  'sup',
  'table',
  'tbody',
  'td',
  'tfoot',
  'th',
  'thead',
  'tr',
  'u',
  'ul',
];

/**
 * Attributes permitted in receipt HTML.
 * Event handlers (on*) and javascript: URIs are blocked by DOMPurify automatically.
 */
const RECEIPT_ALLOWED_ATTR: string[] = [
  'align',
  'alt',
  'border',
  'cellpadding',
  'cellspacing',
  'class',
  'colspan',
  'dir',
  'height',
  'href',
  'id',
  'lang',
  'rel',
  'rowspan',
  'src',
  'style',
  'title',
  'valign',
  'width',
];

/**
 * Sanitize a raw HTML fragment from the POS ticket API using DOMPurify.
 *
 * - Strips <script>, <iframe>, <object>, <embed>, <form> and any event handlers.
 * - Preserves layout and table elements needed for thermal-printer receipts.
 * - Returns an empty string in non-browser environments (SSR guard).
 */
export function sanitizeReceiptFragment(html: string): string {
  if (typeof window === 'undefined' || !DOMPurify.isSupported) {
    return '';
  }

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: RECEIPT_ALLOWED_TAGS,
    ALLOWED_ATTR: RECEIPT_ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    FORCE_BODY: true,
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'textarea', 'select', 'base', 'meta', 'link'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onchange', 'onsubmit', 'onkeydown', 'onkeyup', 'onkeypress'],
  });
}
