import { Component, OnInit } from '@angular/core';
import { NgForm, FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';// Importe o serviço
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  nome = '';
  password = '';
  errorMessage: string | null = null; // Para exibir mensagens de erro

  constructor(private authService: AuthService,private router: Router) { } // Injete o serviço

  ngOnInit(): void {
    const componentId = Math.random().toString(36).substring(2, 7);
    console.log(`[LoginComponent-${componentId}] ngOnInit FIRED.`);
    // se o user ja estiver logado, redireciona ele para dashboard
    if (this.authService.isLoggedIn_sync()) {
      const currentUrl = this.router.url.split('?')[0]; // Ignora query params
      const returnUrl = this.router.parseUrl(this.router.url).queryParams['returnUrl'];

      console.log(`[LoginComponent-${componentId}] User IS logged in (isLoggedIn_sync = true). Current URL: ${currentUrl}. Return URL: ${returnUrl}`);
      if (returnUrl && returnUrl !== '/login') {
        console.log(`[LoginComponent-${componentId}] Redirecting to returnUrl: ${returnUrl}`);
        this.router.navigateByUrl(returnUrl); // Usar navigateByUrl para URLs completas
      } else {
        if (currentUrl !== '/dashboard') {
            console.log(`[LoginComponent-${componentId}] No valid returnUrl or already on a non-login page. Redirecting to /dashboard.`);
            this.router.navigate(['/dashboard']);
        } else {
            console.log(`[LoginComponent-${componentId}] Already on /dashboard (unexpectedly), no redirection.`);
        }
      }
    } else {
      console.log(`[LoginComponent-${componentId}] User is NOT logged in (isLoggedIn_sync = false). Staying on login page.`);
    }
    console.log(`[LoginComponent-${componentId}] ngOnInit END.`);
    }

  onSubmit() {
  if (this.nome && this.password) { // Assumindo que username é nome
    this.errorMessage = null;
    this.authService.login(this.nome, this.password).subscribe( // Passar nome e senha
      response => {
        console.log('Login bem-sucedido!', response);
        this.router.navigate(['/dashboard']);
      },
      error => {
        this.errorMessage = 'Credenciais inválidas. Tente novamente.';
        console.error('Erro no login:', error);
      }
    );
  } else {
    this.errorMessage = 'Por favor, preencha todos os campos.';
  }
}
}
