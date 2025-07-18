// src/app/services/excel-upload.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ExcelUploadService {
  // ATENÇÃO: Substitua este URL pelo endpoint real da sua API de upload!
  // É mais consistente usar uma base única e depois adicionar os caminhos específicos.
  // Ex: private baseUrl = environment.nextJsApiUrl + '/api/upload';
  // E então:
  // this.http.post(`${this.baseUrl}/excel`, formData);
  // this.http.post(`${this.baseUrl}/prn`, formData);
  // this.http.post(`${this.baseUrl}/lote`, formData);

  // Com base no seu código, parece que você tem URLs específicas:
  private uploadExcelUrl = 'http://localhost:3000/api/upload-excel';
  private uploadPrnUrl = 'http://localhost:3000/api/upload-prn';
  private uploadLoteUrl = 'http://localhost:3000/api/upload-lote'; // <--- NOVA URL para lote

  constructor(private http: HttpClient) { }

  uploadExcel(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('excelFile', file, file.name); // 'excelFile' é o nome do campo esperado no backend
    return this.http.post(this.uploadExcelUrl, formData);
  }

  uploadPrnFile(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('prnFile', file, file.name); // 'prnFile' deve corresponder ao nome do campo no backend
    return this.http.post(this.uploadPrnUrl, formData);
  }

  // NOVO MÉTODO PARA UPLOAD DE LOTE
  uploadLoteFile(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('loteFile', file, file.name); // <--- NOME DO CAMPO: 'loteFile'
    return this.http.post(this.uploadLoteUrl, formData);
  }
}