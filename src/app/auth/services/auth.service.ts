import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, switchMap, tap, throwError } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { Login, LoginResponse, Token, User } from '../interfaces';
import { PermissionsService } from './permissions.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(
    private readonly apiService: ApiService,
    private readonly permissionsService: PermissionsService,
    private readonly router: Router,
  ) {}

  private setAuthentication(token: Token): boolean {
    localStorage.setItem('tokenData', JSON.stringify(token));
    return true;
  }

  private setUserData(user: User): void {
    localStorage.setItem('user', JSON.stringify(user));
  }

  setRefreshData(token: Token): void {
    localStorage.setItem('tokenData', JSON.stringify(token));
  }

  login(body: Login): Observable<User> {
    return this.apiService.post<LoginResponse>('auth/login', body).pipe(
      tap((token: Token) => this.setAuthentication(token)),
      switchMap(() => this.me()),
      tap((user: User) => {
        this.setUserData(user);
        this.permissionsService.setUser(user);
        // Redirect based on tenant type so the router guards don't need a
        // redundant API call immediately after login.
        const target = this.permissionsService.isSystemAdmin()
          ? '/system-admin'
          : '/';
        this.router.navigateByUrl(target);
      }),
      catchError(err => {
        return throwError(() => err.error.message);
      }),
    );
  }

  me(): Observable<User> {
    return this.apiService.post('auth/me', {});
  }

  logout(
    refreshToken: string | null,
    accessToken: string | null,
  ): Observable<string> {
    return this.apiService
      .post<string>('auth/logout', { refreshToken, accessToken })
      .pipe(
        tap(() => {
          this.permissionsService.clear();
          localStorage.removeItem('tokenData');
          localStorage.removeItem('user');
        }),
      );
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
}
