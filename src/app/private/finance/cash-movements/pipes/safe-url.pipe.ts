import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

/** URL segura cuando la entrada no pasa validación (evita javascript:, data:, etc.). */
const FALLBACK_SAFE_URL = 'about:blank';

@Pipe({
  name: 'safeUrl',
  standalone: true,
})
export class SafeUrlPipe implements PipeTransform {
  private readonly sanitizer = inject(DomSanitizer);

  transform(url: string | null | undefined): SafeResourceUrl {
    const normalized = (url ?? '').trim();

    if (!this.isAllowedUrl(normalized)) {
      return this.sanitizer.bypassSecurityTrustResourceUrl(FALLBACK_SAFE_URL);
    }

    return this.sanitizer.bypassSecurityTrustResourceUrl(normalized);
  }

  /**
   * Permite solo URLs http(s) absolutas o rutas relativas sin esquema peligroso.
   */
  private isAllowedUrl(url: string): boolean {
    if (!url) {
      return false;
    }

    const lower = url.toLowerCase();

    if (
      lower.startsWith('javascript:') ||
      lower.startsWith('data:') ||
      lower.startsWith('vbscript:') ||
      lower.startsWith('blob:')
    ) {
      return false;
    }

    if (/^https?:\/\//i.test(url)) {
      try {
        const parsed = new URL(url);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
      } catch {
        return false;
      }
    }

    // Rutas relativas: /ruta o ./ruta (rechaza //host externo)
    if (url.startsWith('/') && !url.startsWith('//')) {
      return /^\/[\w./%-]*$/.test(url);
    }

    if (url.startsWith('./') && !url.startsWith('//')) {
      return /^\.\/[\w./%-]*$/.test(url);
    }

    // Ruta relativa simple sin esquema (p. ej. assets/file.pdf)
    if (!url.includes('://') && !url.startsWith('//')) {
      return /^[\w./%-]+$/.test(url);
    }

    return false;
  }
}
