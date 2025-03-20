import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { of } from 'rxjs';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const tokenData = localStorage.getItem('tokenData');

  if (tokenData) {
    const parsedTokenData = JSON.parse(tokenData);
    if (parsedTokenData.token) {
      return of(true);
    }
  }

  return router.navigate(['auth/login']);
};
