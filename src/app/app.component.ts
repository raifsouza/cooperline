import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './shared/navbar/navbar.component';
import { SidenavComponent } from './shared/sidenav/sidenav.component';
import { filter } from 'rxjs';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet,NavbarComponent, SidenavComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'copperline';
  isSidenavVisible: boolean = false;
  showNavAndSidenav: boolean = false;

   constructor(private router: Router) {} 
    ngOnInit() {
    // Escuta os eventos de mudança de rota
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd) // Filtra apenas eventos de navegação finalizada
    ).subscribe((event: NavigationEnd) => {
      // Verifica se a URL atual é a página de login
      this.showNavAndSidenav = event.url !== '/login';
      // Se for a tela de login, garante que a sidenav esteja fechada
      if (!this.showNavAndSidenav) {
        this.isSidenavVisible = false;
      }
    });
  }
   handleToggleSidenavRequest(): void {
    this.isSidenavVisible = !this.isSidenavVisible;
    console.log('ZebraComponent: Sidenav visibility:', this.isSidenavVisible);
  }

  handleCloseSidenavRequest(): void {
    this.isSidenavVisible = false;
    console.log('ZebraComponent: Sidenav close requested.');
  }
}
