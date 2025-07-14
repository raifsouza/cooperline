// src/app/components/excel-upload/excel-upload.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExcelUploadService } from '../../services/excel-upload.service'; // Ajuste o caminho

@Component({
  selector: 'app-excel-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './excel-upload.component.html',
  styleUrls: ['./excel-upload.component.scss']
})
export class ExcelUploadComponent {
  selectedFile: File | null = null;
  uploadStatus: string = '';
  errorMessage: string | null = null;
  isLoading: boolean = false;

  constructor(private excelUploadService: ExcelUploadService) {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.uploadStatus = `Arquivo selecionado: ${this.selectedFile.name}`;
      this.errorMessage = null;
    } else {
      this.selectedFile = null;
      this.uploadStatus = 'Nenhum arquivo selecionado.';
    }
  }

  onUpload(): void {
    if (!this.selectedFile) {
      this.errorMessage = 'Por favor, selecione um arquivo Excel para carregar.';
      return;
    }

    this.isLoading = true;
    this.uploadStatus = 'Enviando arquivo...';
    this.errorMessage = null;

    this.excelUploadService.uploadExcel(this.selectedFile).subscribe({
      next: (response) => {
        this.uploadStatus = `Upload concluído! ${response.message || ''} Registros processados: ${response.processedCount || 0}`;
        this.selectedFile = null; // Limpa a seleção após o upload
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erro no upload:', error);
        this.errorMessage = `Falha no upload: ${error.error?.message || 'Erro de servidor.'}`;
        this.uploadStatus = '';
        this.isLoading = false;
      }
    });
  }
}