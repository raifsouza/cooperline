import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component'; // Importe seu componente de login
import { DashboardComponent } from './dashboard/dashboard.component';
import { authGuard } from './auth.guard';
import { ZebraComponent } from './etiquetas/zebra/zebra.component';

export const routes: Routes = [
  // Rota para a tela de login
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'etiquetas/zebra', component: ZebraComponent, canActivate: [authGuard] },
  // Rota padrão: redireciona para a tela de login quando a URL estiver vazia
  { path: '', redirectTo: '/login', pathMatch: 'full' },

  // Rota curinga: para qualquer URL não mapeada, pode redirecionar para o login ou uma página 404
  { path: '**', redirectTo: '/login' } // Ou para uma página 404: { path: '**', component: NotFoundComponent }
];
