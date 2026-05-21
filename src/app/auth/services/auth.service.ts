import { Injectable } from '@angular/core';
import {
  Observable,
  catchError,
  finalize,
  map,
  of,
  tap,
  throwError,
} from 'rxjs';
import { Login, LoginResponse, User } from '../interfaces';
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

  private setUserData(user: User): void {
    const userToSave = { ...user };
    delete (userToSave as any).password;
    localStorage.setItem('user', JSON.stringify(userToSave));
  }

  login(body: Login): Observable<User> {
    return this.apiService.post<User>('auth/login', body).pipe(
      tap((user: User) => {
        this.setUserData(user);
        void this.router.navigateByUrl('/');
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
