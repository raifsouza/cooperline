import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router'; // Importe RouterLink
import { CommonModule } from '@angular/common'; // Importe CommonModule para *ngIf
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs'; // Para gerenciar a inscrição ao observable
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { SidenavComponent } from '../../shared/sidenav/sidenav.component';


@Component({
  selector: 'app-zebra',
  imports: [CommonModule, NavbarComponent, SidenavComponent],
  templateUrl: './zebra.component.html',
  styleUrl: './zebra.component.scss'
})
export class ZebraComponent implements OnInit {
  userName: string | null = null;
  private userSubscription: Subscription | null = null;
  isSidenavVisible: boolean = false;

  constructor(private authService: AuthService, private router: Router) {

    }

  ngOnInit(): void{
    console.log('ZebraComponent ngOnInit. Current auth status (isLoggedIn):', this.authService.isLoggedIn_sync());
    this.userSubscription = this.authService.userName$.subscribe(name => {
      this.userName = name;
    });
  }

  handleToggleSidenavRequest(): void {
    this.isSidenavVisible = !this.isSidenavVisible;
  }

  handleCloseSidenavRequest(): void {
    this.isSidenavVisible = false;
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

}
