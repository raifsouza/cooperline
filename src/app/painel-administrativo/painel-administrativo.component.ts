import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.service';
import { Subscription } from 'rxjs';
import { NavbarComponent } from '../shared/navbar/navbar.component';
import { SidenavComponent } from '../shared/sidenav/sidenav.component';


@Component({
  selector: 'app-painel-administrativo',
  imports: [CommonModule, NavbarComponent, SidenavComponent],
  templateUrl: './painel-administrativo.component.html',
  styleUrl: './painel-administrativo.component.scss'
})

export class PainelAdministrativoComponent implements OnInit {
  userName: string | null = null;
  private userSubscription: Subscription | null = null;
  isSidenavVisible: boolean = false;

  constructor(private authService: AuthService, private router: Router){

  }

  ngOnInit(): void{
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
    if (this.userSubscription){
      this.userSubscription.unsubscribe();
    }
  }
}
