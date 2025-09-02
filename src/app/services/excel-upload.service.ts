// src/app/services/excel-upload.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ExcelUploadService {
  private apiUrl = `${environment.apiUrl}/api`; // url base para a API

  constructor(private http: HttpClient) { }

  uploadExcel(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('excelFile', file, file.name); // 'excelFile' é o nome do campo esperado no backend
    return this.http.post(`${this.apiUrl}/upload-excel`, formData);
  }

  uploadPrnFile(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('prnFile', file, file.name); // 'prnFile' deve corresponder ao nome do campo no backend
    return this.http.post(`${this.apiUrl}/upload-prn`, formData);
  }

  uploadLoteFile(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('loteFile', file, file.name); // nome do campo: 'loteFile'
    return this.http.post(`${this.apiUrl}/upload-lote`, formData);
  }
}