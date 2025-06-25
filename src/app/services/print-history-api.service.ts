// src/app/services/print-history-api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PrintHistoryEntry } from '../models/print-history.model'; // Ajuste o caminho conforme necessário

@Injectable({
  providedIn: 'root'
})
export class PrintHistoryApiService {
  // ATENÇÃO: Substitua este URL pelo endpoint real da sua API de backend!
  // Exemplo: 'http://localhost:3000/api/print-history' ou 'https://sua-api.com/print-log'
  private apiUrl = 'SEU_URL_DA_API_DE_HISTORICO_AQUI';

  constructor(private http: HttpClient) { }

  /**
   * Envia uma nova entrada de histórico de impressão para o backend.
   * @param entry A entrada do histórico a ser salva.
   * @returns Um Observable da resposta da API.
   */
  savePrintEntry(entry: PrintHistoryEntry): Observable<any> {
    return this.http.post(this.apiUrl, entry);
  }

  // Se no futuro você quiser buscar o histórico do banco, adicionaria um método aqui:
  // getPrintHistory(): Observable<PrintHistoryEntry[]> {
  //   return this.http.get<PrintHistoryEntry[]>(this.apiUrl);
  // }
}