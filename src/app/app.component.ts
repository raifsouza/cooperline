import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './shared/navbar/navbar.component';
import { SidenavComponent } from './shared/sidenav/sidenav.component';
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
   
   handleToggleSidenavRequest(): void {
    this.isSidenavVisible = !this.isSidenavVisible;
    console.log('ZebraComponent: Sidenav visibility:', this.isSidenavVisible);
  }

  handleCloseSidenavRequest(): void {
    this.isSidenavVisible = false;
    console.log('ZebraComponent: Sidenav close requested.');
  }
}
