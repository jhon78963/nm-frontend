import { Injectable } from '@angular/core';
import {
  Observable,
  catchError,
  finalize,
  map,
  of,
  switchMap,
  tap,
  throwError,
} from 'rxjs';
import { Login, LoginResponse, Token, User } from '../interfaces';
import { ApiService } from '../../services/api.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(
    private readonly apiService: ApiService,
    private readonly router: Router,
  ) {}

  private setAuthentication(token: Token): void {
    localStorage.setItem('tokenData', JSON.stringify(token));
  }

  private setUserData(user: User): void {
    const userToSave = { ...user };
    delete (userToSave as any).password;
    localStorage.setItem('user', JSON.stringify(userToSave));
  }

  setRefreshData(token: Token): void {
    localStorage.setItem('tokenData', JSON.stringify(token));
  }

  login(body: Login): Observable<User> {
    return this.apiService.post<LoginResponse>('auth/login', body).pipe(
      switchMap(response => {
        const token = this.normalizeToken(response);
        if (!token.token.trim()) {
          return throwError(
            () => 'La respuesta del servidor no incluyó un token válido.',
          );
        }
        this.setAuthentication(token);
        return this.me().pipe(
          tap((user: User) => {
            this.setUserData(user);
            void this.router.navigateByUrl('/');
          }),
        );
      }),
      catchError(err => throwError(() => this.extractErrorMessage(err))),
    );
  }

  me(): Observable<User> {
    return this.apiService.post<User>('auth/me', {});
  }

  logout(
    refreshToken: string | null,
    accessToken: string | null,
  ): Observable<string> {
    return this.apiService.post('auth/logout', { refreshToken, accessToken });
  }

  /** Elimina credenciales y datos de sesión del almacenamiento local. */
  clearLocalSession(): void {
    localStorage.removeItem('tokenData');
    localStorage.removeItem('user');
    localStorage.removeItem('selectedSize');
  }

  /**
   * Cierra sesión en el servidor (best-effort) y siempre limpia la sesión local
   * y redirige al login, incluso si la petición HTTP falla.
   */
  signOut(): Observable<void> {
    const { refreshToken, accessToken } = this.readTokenDataFromStorage();

    return this.logout(refreshToken, accessToken).pipe(
      catchError(err => {
        console.error('Logout failed; clearing local session:', err);
        return of(undefined);
      }),
      map(() => undefined),
      finalize(() => {
        this.clearLocalSession();
        void this.router.navigate(['/auth/login']);
      }),
    );
  }

  private readTokenDataFromStorage(): {
    refreshToken: string | null;
    accessToken: string | null;
  } {
    try {
      const tokenData = JSON.parse(
        localStorage.getItem('tokenData') || '{}',
      ) as { refreshToken?: string; token?: string };
      return {
        refreshToken: tokenData.refreshToken ?? null,
        accessToken: tokenData.token ?? null,
      };
    } catch {
      return { refreshToken: null, accessToken: null };
    }
  }

  refreshToken(
    refreshToken: string | null,
    accessToken: string | null,
  ): Observable<LoginResponse> {
    return this.apiService.post<LoginResponse>('auth/refresh-token', {
      refreshToken,
      accessToken,
    });
  }

  private normalizeToken(response: LoginResponse): Token {
    const raw = response as LoginResponse & Record<string, unknown>;
    return {
      token: String(raw.token ?? raw['access_token'] ?? '').trim(),
      refreshToken: String(
        raw.refreshToken ?? raw['refresh_token'] ?? '',
      ).trim(),
      expirationToken: Number(
        raw.expirationToken ?? raw['expiration_token'] ?? 0,
      ),
      expirationRefreshToken: Number(
        raw.expirationRefreshToken ?? raw['expiration_refresh_token'] ?? 0,
      ),
    };
  }

  private extractErrorMessage(err: unknown): string {
    if (typeof err === 'string' && err.trim()) {
      return err;
    }
    const http = err as {
      error?: { message?: string };
      message?: string;
      status?: number;
    };
    if (http?.error?.message) {
      return http.error.message;
    }
    if (http?.status === 401) {
      return 'Credenciales inválidas. Verifica tu usuario y contraseña.';
    }
    return http?.message ?? 'Error de autenticación. Intenta nuevamente.';
  }
}
