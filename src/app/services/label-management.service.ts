// src/app/services/label-management.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LabelEntry } from '../models/label-entry.model'; // Importe o modelo de etiqueta

@Injectable({
  providedIn: 'root'
})
export class LabelManagementService {
  private apiUrl = 'http://localhost:3000/api/labels'; // Ajuste esta URL para o seu backend

  constructor(private http: HttpClient) { }

  /**
   * Obtém todas as etiquetas salvas no banco de dados.
   * @returns Um Observable com um array de LabelEntry.
   */
  getAllLabels(): Observable<LabelEntry[]> {
    return this.http.get<LabelEntry[]>(this.apiUrl);
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
}