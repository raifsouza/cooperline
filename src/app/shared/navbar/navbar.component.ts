import { Component, OnInit, OnDestroy, EventEmitter ,Output } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';
import { SidenavComponent } from '../sidenav/sidenav.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule], // removi só pra parar de dar erro por não ter mais o botão de "MeuApp"
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit, OnDestroy {
  userName: string | null = null;
  private userSubscription: Subscription | null = null;
  @Output() toggleSidenavRequest = new EventEmitter<void>();

  constructor(private authService: AuthService, private router: Router) { }

  ngOnInit(): void {
    this.userSubscription = this.authService.userName$.subscribe(name => {
      this.userName = name;
      // Opcional: Se a navbar precisar saber se o usuário não está logado para talvez esconder algo
      // ou redirecionar, mas o redirecionamento principal deve vir de guards ou da rota principal.
    });
  }

  onMenuButtonClick(): void {
    console.log("Navbar")
    this.toggleSidenavRequest.emit();
    console.log('NAVBAR: Evento toggleSidenavRequest emitido!');
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
