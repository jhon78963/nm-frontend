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

/**
 * expirationToken del backend es timestamp absoluto en ms (Carbon::getTimestampMs).
 * Fail-closed: cualquier valor ausente, inválido o ya vencido rechaza el acceso.
 */
function isAccessTokenValid(token: Token): boolean {
  const raw = token.expirationToken;
  if (raw === undefined || raw === null) {
    return false;
  }
  const exp = typeof raw === 'string' ? Number(raw) : raw;
  if (!Number.isFinite(exp) || exp <= 0) {
    return false;
  }
  if (exp < 1_000_000_000) {
    return false;
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
