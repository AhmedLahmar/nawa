import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AdminAuth } from './admin';

/** Blocks the admin console unless a demo admin session is active. */
export const adminGuard: CanActivateFn = () => {
  const auth = inject(AdminAuth);
  const router = inject(Router);
  return auth.isAuthed() ? true : router.createUrlTree(['/admin/login']);
};
