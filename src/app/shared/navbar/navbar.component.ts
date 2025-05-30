import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth.service'; // Ajuste o caminho do AuthService
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar', // O seletor que você usará para incluir a navbar
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit, OnDestroy {
  userName: string | null = null;
  private userSubscription: Subscription | null = null;

  constructor(private authService: AuthService, private router: Router) { }

  ngOnInit(): void {
    this.userSubscription = this.authService.userName$.subscribe(name => {
      this.userName = name;
      // Opcional: Se a navbar precisar saber se o usuário não está logado para talvez esconder algo
      // ou redirecionar, mas o redirecionamento principal deve vir de guards ou da rota principal.
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']); // Redireciona para a tela de login após o logout
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }
}