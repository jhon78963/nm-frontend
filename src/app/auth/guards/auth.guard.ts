import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

type TokenData = {
  token?: string;
};

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const tokenData = localStorage.getItem('tokenData');

  if (tokenData) {
    try {
      const parsed = JSON.parse(tokenData) as TokenData;
      if (parsed.token) {
        return true;
      }
    } catch {
      // tokenData inválido → login
    }
  }

  return router.createUrlTree(['auth', 'login']);
};
