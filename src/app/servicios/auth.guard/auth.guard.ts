import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service/auth.service';

export const authGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  
  if (authService.getRol()) {
    return true; // Permite el paso
  }

  
  router.navigate(['/login']);
  return false;
};