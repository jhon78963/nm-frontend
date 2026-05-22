import { Injectable, signal } from '@angular/core';
import {
  Observable,
  catchError,
  finalize,
  map,
  of,
  shareReplay,
  tap,
  throwError,
} from 'rxjs';
import { Login, User } from '../interfaces';
import { ApiService } from '../../services/api.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  /**
   * Preferencias de UI que deben sobrevivir al logout (p. ej. tema).
   * El layout actual vive en memoria (`LayoutService`); la lista queda lista
   * para cuando se persistan prefs en localStorage/sessionStorage.
   */
  private static readonly PERSISTENT_STORAGE_KEYS: readonly string[] = [];

  /** Fuente de verdad de la sesión en memoria; validada por el servidor vía auth/me. */
  readonly currentUser = signal<User | null>(null);

  private sessionLoadRequest$?: Observable<User | null>;

  constructor(
    private readonly apiService: ApiService,
    private readonly router: Router,
  ) {}

  private setUserData(user: User): void {
    const userToSave = { ...this.normalizeUser(user) };
    delete (userToSave as any).password;
    this.currentUser.set(userToSave);
    this.sessionLoadRequest$ = undefined;
    localStorage.setItem('user', JSON.stringify(userToSave));
  }

  /** MeResource de Laravel puede venir plano o envuelto en `{ data: ... }`. */
  private normalizeUser(raw: User | { data?: User }): User {
    if (raw && typeof raw === 'object' && 'data' in raw && raw.data) {
      return raw.data;
    }
    return raw as User;
  }

  login(body: Login): Observable<User> {
    return this.apiService.post<User | { data: User }>('auth/login', body).pipe(
      map(response => this.normalizeUser(response)),
      tap((user: User) => {
        this.setUserData(user);
        void this.router.navigateByUrl(
          user.mustChangePassword ? '/change-password' : '/',
        );
      }),
      catchError(err => throwError(() => this.extractErrorMessage(err))),
    );
  }

  me(): Observable<User> {
    return this.apiService.post<User | { data: User }>('auth/me', {}).pipe(
      map(response => this.normalizeUser(response)),
    );
  }

  /**
   * Hidrata `currentUser` desde el servidor (POST auth/me en Laravel).
   * Si la cookie de sesión es inválida o expiró, limpia el estado local.
   */
  loadSessionFromApi(): void {
    this.ensureSessionLoaded().subscribe();
  }

  /**
   * Garantiza que la sesión en memoria esté resuelta antes de activar rutas.
   * Reutiliza la petición en vuelo si AppComponent ya inició la hidratación.
   */
  ensureSessionLoaded(): Observable<User | null> {
    const cachedUser = this.currentUser();
    if (cachedUser?.username?.trim()) {
      return of(cachedUser);
    }

    if (!this.sessionLoadRequest$) {
      this.sessionLoadRequest$ = this.me().pipe(
        map(user => {
          this.setUserData(user);
          return user;
        }),
        catchError(() => {
          this.clearLocalSession();
          return of(null);
        }),
        shareReplay({ bufferSize: 1, refCount: true }),
      );
    }

    return this.sessionLoadRequest$;
  }

  logout(): Observable<string> {
    return this.apiService.post('auth/logout', {});
  }

  /**
   * Renueva el par access/refresh vía cookies HttpOnly (POST auth/refresh).
   * Invocado automáticamente por el interceptor ante un 401.
   */
  refreshSession(): Observable<void> {
    return this.apiService.post<{ message: string }>('auth/refresh', {}).pipe(
      map(() => undefined),
    );
  }

  changePassword(body: {
    currentPassword: string;
    password: string;
    passwordConfirmation: string;
  }): Observable<User> {
    return this.apiService
      .post<User | { data: User }>('auth/change-password', body)
      .pipe(
        map(response => this.normalizeUser(response)),
        tap(user => {
          this.setUserData(user);
          void this.router.navigateByUrl('/');
        }),
        catchError(err => throwError(() => this.extractErrorMessage(err))),
      );
  }

  /**
   * Limpieza profunda de sesión: memoria + todo el storage del dominio.
   * Preserva únicamente claves listadas en `PERSISTENT_STORAGE_KEYS`.
   */
  clearLocalSession(): void {
    this.currentUser.set(null);
    this.sessionLoadRequest$ = undefined;

    const preserved = this.preservePersistentStorage();
    localStorage.clear();
    sessionStorage.clear();
    this.restorePersistentStorage(preserved);
  }

  private preservePersistentStorage(): Record<string, string> {
    const preserved: Record<string, string> = {};

    for (const key of AuthService.PERSISTENT_STORAGE_KEYS) {
      const localValue = localStorage.getItem(key);
      if (localValue !== null) {
        preserved[`local:${key}`] = localValue;
      }

      const sessionValue = sessionStorage.getItem(key);
      if (sessionValue !== null) {
        preserved[`session:${key}`] = sessionValue;
      }
    }

    return preserved;
  }

  private restorePersistentStorage(preserved: Record<string, string>): void {
    for (const [compoundKey, value] of Object.entries(preserved)) {
      const separatorIndex = compoundKey.indexOf(':');
      if (separatorIndex === -1) {
        continue;
      }

      const scope = compoundKey.slice(0, separatorIndex);
      const key = compoundKey.slice(separatorIndex + 1);

      if (scope === 'local') {
        localStorage.setItem(key, value);
      } else if (scope === 'session') {
        sessionStorage.setItem(key, value);
      }
    }
  }

  /**
   * Cierra sesión en el servidor (best-effort) y siempre limpia la sesión local
   * y redirige al login, incluso si la petición HTTP falla.
   */
  signOut(): Observable<void> {
    return this.logout().pipe(
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
