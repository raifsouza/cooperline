import { Injectable } from '@angular/core';
import { CanActivate, Router, CanActivateFn } from '@angular/router';
import { AuthService } from './services/auth.service'; // Ajuste o caminho

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    const accessLevel = this.authService.getAccessLevel();

    if (this.authService.isLoggedIn_sync() && accessLevel === 1) {
      return true; // Acesso permitido se logado e for ADMIN
    } else {
      // Se não for admin, redireciona para o dashboard ou outra página
      this.router.navigate(['/dashboard']);
      return false;
    }
  }
}
