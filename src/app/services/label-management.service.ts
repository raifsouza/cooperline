// src/app/services/label-management.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, map, Observable, of } from 'rxjs';
import { LabelEntry, ProductEntry, LoteEntry } from '../models/label-entry.model'; 
import { environment } from '../../environments/environment.prod';


export interface ZPLResponse {
  zplContent: string;
  nameLabel?: string; // Adicione esta propriedade. Use '?' se for opcional ou pode vir null.
}
@Injectable({
  providedIn: 'root'
})
export class LabelManagementService {
  private apiUrl = `${environment.apiUrl}/api`;

  constructor(private http: HttpClient) { }

  /**
   * Obtém todas as etiquetas salvas no banco de dados.
   * @returns Um Observable com um array de LabelEntry.
   */
  getAllLabels(): Observable<LabelEntry[]> {
    return this.http.get<LabelEntry[]>(`${this.apiUrl}/labels`);
  }

  /**
   * Obtém todas as informações de etiqueta salvas no banco de dados.
   * @returns Um Observable com um array de ProductEntry.
   */
  getAllProducts(): Observable<ProductEntry[]> {
    return this.http.get<ProductEntry[]>(`${this.apiUrl}/products`);
  }

  /**
   * Salva uma nova etiqueta no banco de dados.
   * @param label A etiqueta a ser salva.
   * @returns Um Observable com a etiqueta salva.
   */
  createLabel(label: LabelEntry): Observable<LabelEntry> {
    return this.http.post<LabelEntry>(`${this.apiUrl}/labels`, label);
  }

  /**
   * Atualiza uma etiqueta existente no banco de dados.
   * @param id O ID da etiqueta a ser atualizada.
   * @param label A etiqueta com os dados atualizados.
   * @returns Um Observable com a etiqueta atualizada.
   */
  updateLabel(id: number, label: LabelEntry): Observable<LabelEntry> {
    return this.http.put<LabelEntry>(`${this.apiUrl}/labels/${id}`, label);
  }

  /**
   * Exclui uma etiqueta do banco de dados.
   * @param id O ID da etiqueta a ser excluída.
   * @returns Um Observable que completa quando a etiqueta é excluída.
   */
  deleteLabel(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/labels/${id}`);
  }

  /**
   * Obtém uma etiqueta específica por ID.
   * @param id O ID da etiqueta.
   * @returns Um Observable com a etiqueta encontrada.
   */
  getLabelById(id: number): Observable<LabelEntry> {
    return this.http.get<LabelEntry>(`${this.apiUrl}/labels/${id}`);
  }

  /**
   * Obtém entradas de lote pelo número do lote.
   * @param loteNumber O número do lote a ser buscado.
   * @returns Um Observable com um array de LoteEntry.
   */
  getLoteEntriesByLoteNumber(loteNumber: string): Observable<LoteEntry[]> {
    // A rota da API que você criou é '/api/lote', e você passará o lote como um query parameter.
    return this.http.get<LoteEntry[]>(`${this.apiUrl}/lote?lote=${loteNumber}`);
  }

  syncRadarLots(): Observable<any> {
    const radarSyncUrl = `${this.apiUrl}/wk-radar/lote`;
    return this.http.post(radarSyncUrl, {});
  }

  getServerTime(): Observable<{ currentTime: string }> {

    const apiUrl = this.apiUrl
    return this.http.get<{ currentTime: string }>(`${apiUrl}/time`);
  }
  
  /**
   * Método auxiliar para tratamento de erros em requisições HTTP.
   * @param operation Nome da operação que falhou.
   * @param result Valor opcional para retornar em caso de erro.
   */
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error);
      // Aqui você pode adicionar lógica para apresentar o erro na UI
      // Retorna um resultado vazio para que a aplicação continue funcionando
      return of(result as T);
    };
  }
}