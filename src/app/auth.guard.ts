import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';
import { map, take, tap } from 'rxjs/operators';

export const authGuard: CanActivateFn = (route, state) => {
  const guardId = Math.random().toString(36).substring(2, 7);
  console.log(`[AuthGuard-${guardId}] ACTIVATING for route: ${state.url}`);
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.getAuthenticationState().pipe(
    map(isLoggedIn => {
      console.log(`[AuthGuard-${guardId}] Received authentication state: ${isLoggedIn} for ${state.url}`);
      if (isLoggedIn) {
        console.log(`[AuthGuard-${guardId}] Access GRANTED for: ${state.url}`);
        return true;
      } else {
        console.log(`[AuthGuard-${guardId}] Access DENIED for: ${state.url}. Redirecting to /login.`);
        // Opcional: guardar a URL de retorno para redirecionar após o login
        router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
        return false;
      }
    }),
    tap(decision => console.log(`[AuthGuard-${guardId}] Decision for ${state.url}: ${decision}`))
  );

  // if (authService.isLoggedIn()) {
  //   console.log('authGuard: Access GRANTED for route:', state.url);
  //   return true; // Usuário logado, permite o acesso à rota
  // } else {
  //   console.log('authGuard: Access DENIED for route:', state.url, '. Redirecting to /login.');
  //   // Usuário não logado, redireciona para a tela de login
  //   router.navigate(['/login']);
  //   return false; // Bloqueia o acesso à rota
  // }
};
