import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import {
  Observable,
  catchError,
  finalize,
  map,
  of,
  shareReplay,
  switchMap,
  tap,
  throwError,
} from 'rxjs';
import { environment } from '../../../environments/environment';
import { Login, User } from '../interfaces';
import {
  userHasAnyPermission,
  userHasPermission,
} from '../guards/permission.guard';
import { ADMIN_ROUTE_ROLES } from '../guards/role.guard';
import { ApiService } from '../../services/api.service';
import { CsrfTokenService } from './csrf-token.service';
import { PurchaseRegisterDraftService } from '../../private/inventories/purchase/services/purchase-register-draft.service';
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

  /** Bandera mínima en localStorage; nunca guardar PII, roles ni permisos ahí. */
  private static readonly SESSION_FLAG_KEY = 'authSession';

  /** Fuente de verdad de la sesión en memoria; validada por el servidor vía auth/me. */
  readonly currentUser = signal<User | null>(null);

  private sessionLoadRequest$?: Observable<User | null>;

  hasPermission(permission: string): boolean {
    return userHasPermission(this.currentUser(), permission);
  }

  hasAnyPermission(permissions: readonly string[]): boolean {
    return userHasAnyPermission(this.currentUser(), permissions);
  }

  hasAnyRole(roles: readonly string[]): boolean {
    const user = this.currentUser();
    if (!user) {
      return false;
    }

    if (user.role && roles.includes(user.role)) {
      return true;
    }

    return (user.roles ?? []).some(role => roles.includes(role));
  }

  isAdminUser(): boolean {
    return this.hasAnyRole(ADMIN_ROUTE_ROLES);
  }

  constructor(
    private readonly http: HttpClient,
    private readonly apiService: ApiService,
    private readonly csrfTokenService: CsrfTokenService,
    private readonly router: Router,
    private readonly purchaseRegisterDraft: PurchaseRegisterDraftService,
  ) {}

  /**
   * Paso 1: cookie Sanctum (204 vacío).
   * Paso 2: token CSRF en JSON desde el backend (no el origen del SPA).
   */
  fetchCsrfHandshake(): Observable<string> {
    return this.http
      .get(`${environment.baseWebUrl}/sanctum/csrf-cookie`, {
        withCredentials: true,
        responseType: 'text' as const,
      })
      .pipe(
        switchMap(() =>
          this.http.get<{ csrf_token?: string; message?: string }>(
            `${environment.apiUrl}/auth/csrf-token`,
            { withCredentials: true },
          ),
        ),
        map(response => {
          if (!response?.csrf_token) {
            throw new Error(
              response?.message ??
                'No se pudo obtener el token CSRF. Verifique sesión y reinicie el backend (php artisan route:clear).',
            );
          }

          return response.csrf_token;
        }),
      );
  }

  private setUserData(user: User): void {
    const userInMemory = { ...this.normalizeUser(user) };
    delete (userInMemory as { password?: string }).password;
    this.currentUser.set(userInMemory);
    this.sessionLoadRequest$ = undefined;
    this.persistSessionFlag(true);
  }

  /** Solo persiste `isLoggedIn`; el perfil completo vive en `currentUser` (RAM). */
  private persistSessionFlag(isLoggedIn: boolean): void {
    localStorage.removeItem('user');

    if (isLoggedIn) {
      localStorage.setItem(
        AuthService.SESSION_FLAG_KEY,
        JSON.stringify({ isLoggedIn: true }),
      );
      return;
    }

    localStorage.removeItem(AuthService.SESSION_FLAG_KEY);
  }

  /** MeResource de Laravel puede venir plano o envuelto en `{ data: ... }`. */
  private normalizeUser(raw: User | { data?: User }): User {
    if (raw && typeof raw === 'object' && 'data' in raw && raw.data) {
      return raw.data;
    }
    return raw as User;
  }

  login(body: Login): Observable<User> {
    return this.fetchCsrfHandshake().pipe(
      tap(token => this.csrfTokenService.setToken(token)),
      switchMap(() =>
        this.http.post<User | { data: User }>(
          `${environment.apiUrl}/auth/login`,
          body,
        ),
      ),
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
    this.csrfTokenService.clear();
    this.persistSessionFlag(false);
    this.purchaseRegisterDraft.clear();

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
    if (http?.status === 419) {
      return 'La sesión de seguridad expiró. Recarga la página e intenta de nuevo.';
    }
    return http?.message ?? 'Error de autenticación. Intenta nuevamente.';
  }
}
