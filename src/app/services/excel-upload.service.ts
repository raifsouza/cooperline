// src/app/services/excel-upload.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ExcelUploadService {
  // ATENÇÃO: Substitua este URL pelo endpoint real da sua API de upload!
  private uploadUrl = 'http://localhost:3000/api/upload-excel';
  private prnApiUrl = 'http://localhost:3000/api/upload-prn'; 

  constructor(private http: HttpClient) { }

  uploadExcel(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('excelFile', file, file.name); // 'excelFile' é o nome do campo esperado no backend

    return this.http.post(this.uploadUrl, formData);
  }

  uploadPrnFile(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('prnFile', file, file.name); // 'prnFile' deve corresponder ao nome do campo no backend
    return this.http.post(this.prnApiUrl, formData);
  }
}