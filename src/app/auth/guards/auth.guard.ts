import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { User } from '../interfaces';

function readUserFromStorage(): User | null {
  const raw = localStorage.getItem('user');
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as User;
    if (!parsed?.username?.trim()) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function clearAuthStorage(): void {
  localStorage.removeItem('tokenData');
  localStorage.removeItem('user');
}

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const user = readUserFromStorage();

  if (user) {
    return true;
  }

  clearAuthStorage();
  return router.createUrlTree(['auth', 'login']);
};
