// src/app/services/print-history-api.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, map, Observable, of } from 'rxjs';
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

  checkIfReprint(productCode: string, productLote: string): Observable<boolean> {
    const params = new HttpParams()
      .set('productCode', productCode)
      .set('productLote', productLote)
      .set('checkReprint', 'true'); // Um flag para o backend saber que é uma verificação de reimpressão

    // O backend deve retornar um JSON como: { isReprint: true } ou { isReprint: false }
    return this.http.get<{ isReprint: boolean }>(`${this.apiUrl}/check-reprint`, { params }).pipe(
      map(response => response.isReprint),
      catchError(error => {
        console.error('Erro ao verificar reimpressão no backend:', error);
        // Em caso de erro na API, retorne false para não bloquear a impressão
        return of(false);
      })
    );
  }
}