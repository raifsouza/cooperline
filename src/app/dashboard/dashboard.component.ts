import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink } from '@angular/router'; // Importe RouterLink
import { CommonModule } from '@angular/common'; // Importe CommonModule para *ngIf
import { AuthService } from '../auth.service';
import { Subscription } from 'rxjs'; // Para gerenciar a inscrição ao observable
import { NavbarComponent } from '../shared/navbar/navbar.component';
import { SidenavComponent } from '../shared/sidenav/sidenav.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NavbarComponent, SidenavComponent], // CommonModule para *ngIf (se usar)
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  userName: string | null = null;
  private userSubscription: Subscription | null = null; // Para gerenciar a inscrição
  isSidenavVisible: boolean = false;

  constructor(private authService: AuthService, private router: Router) { }

  ngOnInit(): void {
    // Inscreve-se no observable do nome do usuário para atualizações em tempo real
    this.userSubscription = this.authService.userName$.subscribe(name => {
      this.userName = name;
      // Se o nome do usuário for nulo (após um logout, por exemplo), redireciona para o login
      if (!this.userName) {
        this.router.navigate(['/login']);
      }
    });
  }

  handleToggleSidenavRequest(): void {
    this.isSidenavVisible = !this.isSidenavVisible;
    console.log('DashboardComponent: Sidenav visibility:', this.isSidenavVisible);
  }

  handleCloseSidenavRequest(): void {
    this.isSidenavVisible = false;
    console.log('DashboardComponent: Sidenav close requested.');
  }

  // logout(): void {
  //   this.authService.logout();
  //   this.router.navigate(['/login']); // Redireciona para a tela de login após o logout
  // }

  // ngOnDestroy(): void {
  //   // É importante cancelar a inscrição para evitar vazamentos de memória
  //   if (this.userSubscription) {
  //     this.userSubscription.unsubscribe();
  //   }
  // }
}
