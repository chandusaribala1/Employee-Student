import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../../models/user.model';

export const roleGuard: CanActivateFn = route => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const roles = route.data['roles'] as UserRole[] | undefined;
  if (auth.hasRole(roles ?? [])) return true;
  const user = auth.currentUser();
  if (user?.role === 'ADMIN') return router.createUrlTree(['/admin/dashboard']);
  if (user?.role === 'EMPLOYEE') return router.createUrlTree(['/employee/dashboard']);
  if (user?.role === 'STUDENT') return router.createUrlTree(['/student/dashboard']);
  return router.createUrlTree(['/login']);
};
