import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Token } from '../interfaces';

function readTokenData(): Token | null {
  const raw = localStorage.getItem('tokenData');
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as Token;
    if (!parsed?.token?.trim()) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/** Soporta exp en segundos (Unix) o milisegundos. */
function isAccessTokenValid(token: Token): boolean {
  const exp = token.expirationToken;
  if (exp === undefined || exp === null || !Number.isFinite(exp)) {
    return true;
  }
  const expMs = exp > 1_000_000_000_000 ? exp : exp * 1000;
  return Date.now() < expMs;
}

function clearAuthStorage(): void {
  localStorage.removeItem('tokenData');
  localStorage.removeItem('user');
}

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const token = readTokenData();

  if (token && isAccessTokenValid(token)) {
    return true;
  }

  clearAuthStorage();
  return router.createUrlTree(['auth', 'login']);
};
