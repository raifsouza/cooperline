// src/app/print-history-page/print-history-page.component.ts

import { Component, OnInit } from '@angular/core';
import { PrintHistoryApiService } from '../services/print-history-api.service';
import { PrintHistoryEntry } from '../models/print-history.model'; // Importante ter essa interface
import { AuthService } from '../services/auth.service'; // Se quiser filtrar por usuário logado
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-print-history-page',
  standalone: true, // Adicionado se o seu projeto usa componentes standalone
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
  }

  checkReprint(reprint:boolean){
    if(reprint == false){
      return "Impressão"
    } else {
      return "Reimpressão"
    }
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

  /**
   * Extrai o número do lote (removendo a bobina final, se existir).
   * Ex: "0625-000442-1" -> "0625-000442"
   * Ex: "0625-000442" -> "0625-000442"
   * @param fullLote A string completa do lote (ex: "0625-000442-1").
   * @returns A parte do lote sem a bobina, ou a string original se não houver bobina reconhecível.
   */
  getLoteWithoutBobina(fullLote: string): string {
    if (!fullLote) { // Trata casos de null ou undefined
      return '';
    }
    const parts = fullLote.split('-');
    // Verifica se tem pelo menos 3 partes (Lote-X-Bobina) e se a última parte é um dígito numérico.
    // Usamos Number.isInteger para garantir que é um número inteiro, como uma bobina deve ser.
    if (parts.length >= 3 && Number.isInteger(Number(parts[parts.length - 1]))) {
        return parts.slice(0, -1).join('-'); // Remove a última parte e junta
    }
    return fullLote; // Retorna a string original se não encontrar o padrão esperado
  }

  /**
   * Extrai o número da bobina da string completa do lote.
   * Ex: "0625-000442-1" -> "1"
   * Ex: "0625-000442" -> ""
   * @param fullLote A string completa do lote (ex: "0625-000442-1").
   * @returns O número da bobina como string, ou uma string vazia se não for encontrado.
   */
  getBobinaFromLote(fullLote: string): string {
    if (!fullLote) { // Trata casos de null ou undefined
      return '';
    }
    const parts = fullLote.split('-');
    // Verifica se tem pelo menos 3 partes e se a última parte é um dígito numérico.
    if (parts.length >= 3 && Number.isInteger(Number(parts[parts.length - 1]))) {
      return parts[parts.length - 1]; // Retorna a última parte
    }
    return ''; // Retorna vazio se não houver bobina ou se o formato não for o esperado
  }
}