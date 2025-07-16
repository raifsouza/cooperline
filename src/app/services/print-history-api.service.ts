// src/app/services/print-history-api.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PrintHistoryEntry } from '../models/print-history.model';

@Injectable({
  providedIn: 'root'
})
export class PrintHistoryApiService {
  private apiUrl = 'http://localhost:3000/api/print-history';

  constructor(private http: HttpClient) { }

  savePrintEntry(entry: PrintHistoryEntry): Observable<PrintHistoryEntry> {
    console.log('Enviando histórico de impressão para o backend:', entry);
    return this.http.post<PrintHistoryEntry>(this.apiUrl, entry);
  }

  // NOVO MÉTODO: Buscar o histórico de impressões
  getPrintHistory(): Observable<PrintHistoryEntry[]> {
    console.log('Buscando histórico de impressão do backend...');
    return this.http.get<PrintHistoryEntry[]>(this.apiUrl);
  }
}