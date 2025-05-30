import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true; // Usuário logado, permite o acesso à rota
  } else {
    // Usuário não logado, redireciona para a tela de login
    router.navigate(['/login']);
    return false; // Bloqueia o acesso à rota
  }
};