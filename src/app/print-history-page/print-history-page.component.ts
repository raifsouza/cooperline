// src/app/print-history-page/print-history-page.component.ts

import { Component, OnInit } from '@angular/core';
import { PrintHistoryApiService } from '../services/print-history-api.service';
import { PrintHistoryEntry } from '../models/print-history.model';
import { AuthService } from '../services/auth.service'; // Se quiser filtrar por usuário logado
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-print-history-page',
  imports: [CommonModule, FormsModule],
  templateUrl: './print-history-page.component.html',
  styleUrls: ['./print-history-page.component.scss']
})
export class PrintHistoryPageComponent implements OnInit {
  printHistory: PrintHistoryEntry[] = [];
  isLoading: boolean = true;
  errorMessage: string | null = null;

  constructor(
    private printHistoryApiService: PrintHistoryApiService,
    private authService: AuthService // Opcional: para filtrar por usuário
  ) { }

  ngOnInit(): void {
    this.loadPrintHistory();
  }

  loadPrintHistory(): void {
    this.isLoading = true;
    this.errorMessage = null;

    // Se você quiser buscar o histórico de TODOS os usuários, use:
    this.printHistoryApiService.getPrintHistory().subscribe({
      next: (data) => {
        this.printHistory = data;
        this.isLoading = false;
        console.log('Histórico de impressão carregado:', data);
      },
      error: (error) => {
        console.error('Erro ao carregar histórico de impressão:', error);
        this.errorMessage = 'Falha ao carregar o histórico de impressão.';
        this.isLoading = false;
      }
    });

    // Se você quiser buscar o histórico APENAS do usuário logado:
    // const userId = this.authService.getUserId();
    // if (userId) {
    //   this.printHistoryApiService.getPrintHistoryByUserId(userId).subscribe({ // Você precisaria criar este método no serviço
    //     next: (data) => {
    //       this.printHistory = data;
    //       this.isLoading = false;
    //       console.log('Histórico de impressão do usuário carregado:', data);
    //     },
    //     error: (error) => {
    //       console.error('Erro ao carregar histórico de impressão do usuário:', error);
    //       this.errorMessage = 'Falha ao carregar o histórico de impressão do usuário.';
    //       this.isLoading = false;
    //     }
    //   });
    // } else {
    //   this.errorMessage = 'Usuário não logado. Não é possível carregar o histórico.';
    //   this.isLoading = false;
    // }
  }

  // Opcional: Função para formatar a data/hora
  formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleString('pt-BR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }
}