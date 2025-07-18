// src/app/services/label-management.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, map, Observable, of } from 'rxjs';
// Importe LoteEntry aqui. Certifique-se de que ele está definido em '../models/label-entry.model'
import { LabelEntry, ProductEntry, LoteEntry } from '../models/label-entry.model'; 


// **NOVA INTERFACE DE RESPOSTA**
export interface ZPLResponse {
  zplContent: string;
  nameLabel?: string; // Adicione esta propriedade. Use '?' se for opcional ou pode vir null.
}
@Injectable({
  providedIn: 'root'
})
export class LabelManagementService {
  private apiUrl = 'http://localhost:3000/api/labels'; // Ajuste esta URL para o seu backend
  private productsApiUrl = 'http://localhost:3000/api/products'; 
  private loteApiUrl = 'http://localhost:3000/api/lote'; // 👈 **NOVO: URL para a API de lote**

  constructor(private http: HttpClient) { }

  /**
   * Obtém todas as etiquetas salvas no banco de dados.
   * @returns Um Observable com um array de LabelEntry.
   */
  getAllLabels(): Observable<LabelEntry[]> {
    return this.http.get<LabelEntry[]>(this.apiUrl);
  }

  /**
   * Obtém todas as informações de etiqueta salvas no banco de dados.
   * @returns Um Observable com um array de ProductEntry.
   */
  getAllProducts(): Observable<ProductEntry[]> {
    return this.http.get<ProductEntry[]>(this.productsApiUrl);
  }

  /**
   * Salva uma nova etiqueta no banco de dados.
   * @param label A etiqueta a ser salva.
   * @returns Um Observable com a etiqueta salva.
   */
  createLabel(label: LabelEntry): Observable<LabelEntry> {
    return this.http.post<LabelEntry>(this.apiUrl, label);
  }

  /**
   * Atualiza uma etiqueta existente no banco de dados.
   * @param id O ID da etiqueta a ser atualizada.
   * @param label A etiqueta com os dados atualizados.
   * @returns Um Observable com a etiqueta atualizada.
   */
  updateLabel(id: number, label: LabelEntry): Observable<LabelEntry> {
    return this.http.put<LabelEntry>(`${this.apiUrl}/${id}`, label);
  }

  /**
   * Exclui uma etiqueta do banco de dados.
   * @param id O ID da etiqueta a ser excluída.
   * @returns Um Observable que completa quando a etiqueta é excluída.
   */
  deleteLabel(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Obtém uma etiqueta específica por ID.
   * @param id O ID da etiqueta.
   * @returns Um Observable com a etiqueta encontrada.
   */
  getLabelById(id: number): Observable<LabelEntry> {
    return this.http.get<LabelEntry>(`${this.apiUrl}/${id}`);
  }

  /**
   * Obtém entradas de lote pelo número do lote.
   * @param loteNumber O número do lote a ser buscado.
   * @returns Um Observable com um array de LoteEntry.
   */
  // 👈 **NOVO MÉTODO**
  getLoteEntriesByLoteNumber(loteNumber: string): Observable<LoteEntry[]> {
    // A rota da API que você criou é '/api/lote', e você passará o lote como um query parameter.
    return this.http.get<LoteEntry[]>(`${this.loteApiUrl}?lote=${loteNumber}`);
  }
  
    /**
   * NOVO MÉTODO: Obtém o conteúdo ZPL mestre para um dado número de lote.
   * Este método é usado para buscar o template ZPL após a validação do lote-bobina.
   * @param loteNumber O número do lote (ex: "0424-000038") para o qual buscar o ZPL mestre.
   * @returns Um Observable com um objeto contendo o zplContent ou null se não encontrado.
   */
  getZPLByLoteNumber(loteNumber: string): Observable<ZPLResponse | null> {
    const params = new HttpParams().set('lote', loteNumber);
    // O tipo esperado pelo .get agora inclui nameLabel
    return this.http.get<ZPLResponse>(`${this.apiUrl}/zpl-by-lote`, { params }).pipe(
      map(response => response ? response : null),
      catchError(this.handleError<ZPLResponse | null>('getZPLByLoteNumber', null))
    );
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