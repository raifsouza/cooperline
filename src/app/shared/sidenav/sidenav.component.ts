import { Component, Input, Output, EventEmitter, OnInit, SimpleChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sidenav',
  standalone: true,
  imports: [CommonModule, RouterLinkActive],
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.scss']
})
export class SidenavComponent implements OnInit, OnDestroy {
  @Input() isOpen: boolean = false; // propriedade controlada pelo component pai, quando o botão para abrir a sidenav for clicado o valor muda para 'isOpen'
  @Output() closeSidenavRequest = new EventEmitter<void>(); // evento responsavel por notifica o component pai, de que o usuario quer fechar a sidenav

  userAccessLevel: number | null = null;
  private authSubscription: Subscription | null = null;
  public isSidenavSubmenuOpen: boolean = false; // propriedade para o estado do submenu

  constructor(private authService: AuthService) { }

  ngOnInit(): void {
    this.authSubscription = this.authService.userAccessLevel$.subscribe(level => {
      this.userAccessLevel = level;
      console.log('Sidenav: Nivel de acesso recebido', this.userAccessLevel);
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && !this.isOpen) {
      this.isSidenavSubmenuOpen = false;
    }
  }

  // fechar a sidenav (botão interno e backdrop)
  onClose(): void {
    this.closeSidenavRequest.emit();
  }

  // abrir os links das rotas na sidenav, fecha a sidenav após clicar em um dos links
  onLinkClick(): void {
    if (this.isOpen) {
      this.onClose();
    }
  }

  toggleSidenavSubmenu(): void {
    this.isSidenavSubmenuOpen = !this.isSidenavSubmenuOpen;
  }

  ngOnDestroy(): void {
      this.authSubscription?.unsubscribe();
  }
}
