import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common'; // Necessário para *ngIf, [class.xxx]
import { RouterLink, RouterLinkActive } from '@angular/router'; // Para os links de navegação

@Component({
  selector: 'app-sidenav',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.scss']
})
export class SidenavComponent {
  @Input() isOpen: boolean = false; // propriedade controlada pelo component pai, quando o botão para abrir a sidenav for clicado o valor muda para 'isOpen'
  @Output() closeSidenavRequest = new EventEmitter<void>(); // evento responsavel por notifica o component pai, de que o usuario quer fechar a sidenav

  public isSidenavSubmenuOpen: boolean = false; // prorpiedade para o estado do submenu

  constructor() { }

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
}
