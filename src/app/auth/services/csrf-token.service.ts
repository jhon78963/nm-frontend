import { Injector, Injectable } from '@angular/core';
import { Observable, defer, of, tap } from 'rxjs';
import { AuthService } from './auth.service';

/**
 * Token CSRF en memoria (cross-origin: la cookie XSRF-TOKEN no es legible desde JS).
 */
@Injectable({ providedIn: 'root' })
export class CsrfTokenService {
  private token: string | null = null;
  private handshake$?: Observable<string>;

  getToken(): string | null {
    return this.token;
  }

  setToken(token: string): void {
    this.token = token;
  }

  clear(): void {
    this.token = null;
    this.handshake$ = undefined;
  }

  ensureToken(): Observable<string> {
    if (this.token) {
      return of(this.token);
    }

    if (!this.handshake$) {
      this.handshake$ = defer(() =>
        this.injector.get(AuthService).fetchCsrfHandshake(),
      ).pipe(
        tap(token => {
          this.token = token;
        }),
      );
    }

    return this.handshake$;
  }

  constructor(private readonly injector: Injector) {}
}
