import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink } from '@angular/router'; // Importe RouterLink
import { CommonModule } from '@angular/common'; // Importe CommonModule para *ngIf
import { AuthService } from '../services/auth.service';
import { Subscription } from 'rxjs'; // Para gerenciar a inscrição ao observable

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule,], // CommonModule para *ngIf (se usar)
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  userName: string | null = null;
  private userSubscription: Subscription | null = null; // Para gerenciar a inscrição
  isSidenavVisible: boolean = false;

  constructor(private authService: AuthService, private router: Router) { }

  ngOnInit(): void {
    console.log('DashboardComponent ngOnInit. Current auth status:', this.authService.isLoggedIn_sync());
    // Inscreve-se no observable do nome do usuário para atualizações em tempo real
    this.userSubscription = this.authService.userName$.subscribe(name => {
      this.userName = name;
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


  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }
}
