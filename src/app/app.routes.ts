import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component'; // Importe seu componente de login
import { DashboardComponent } from './dashboard/dashboard.component';
import { authGuard } from './auth.guard';
import { AdminGuard } from './admin.guard';
import { ZebraComponent } from './etiquetas/zebra/zebra.component';
import { PainelAdministrativoComponent } from './painel-administrativo/painel-administrativo.component';
import { ExcelUploadComponent } from './components/excel-upload/excel-upload.component';
import { PrintHistoryPageComponent } from './print-history-page/print-history-page.component';
import { CadastroLoteComponent } from './components/cadastro-lote/cadastro-lote.component'; // Importe o novo componente

export const routes: Routes = [
  // Rota para a tela de login
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'etiquetas/zebra', component: ZebraComponent, canActivate: [authGuard] },
  { path: 'cadastro-lote', component: CadastroLoteComponent, canActivate: [authGuard] },
  { path: 'painel-administrativo', component: PainelAdministrativoComponent, canActivate: [authGuard, AdminGuard] },
  { path: 'print-history', component: PrintHistoryPageComponent, canActivate: [authGuard, AdminGuard] },
  { path: 'upload', component: ExcelUploadComponent, canActivate: [authGuard, AdminGuard] },
  // Rota padrão: redireciona para a tela de login quando a URL estiver vazia
  { path: '', redirectTo: '/login', pathMatch: 'full' },

  // Rota curinga: para qualquer URL não mapeada, pode redirecionar para o login ou uma página 404
  { path: '**', redirectTo: '/login' } // Ou para uma página 404: { path: '**', component: NotFoundComponent }
];
