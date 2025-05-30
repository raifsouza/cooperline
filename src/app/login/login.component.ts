import { Component } from '@angular/core';
import { NgForm, FormsModule } from '@angular/forms';
import { AuthService } from '../auth.service'; // Importe o serviço
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  matricula = '';
  password = '';
  errorMessage: string | null = null; // Para exibir mensagens de erro

  constructor(private authService: AuthService,private router: Router) { } // Injete o serviço

  onSubmit() {
  if (this.matricula && this.password) { // Assuming username is actually matricula
    this.errorMessage = null;
    this.authService.login(this.matricula, this.password).subscribe( // Pass matricula and password
      response => {
        console.log('Login bem-sucedido!', response);
        this.router.navigate(['/dashboard']);
      },
      error => {
        this.errorMessage = 'Credenciais inválidas. Tente novamente.';
      }
    );
  } else {
    this.errorMessage = 'Por favor, preencha todos os campos.';
  }
}
}