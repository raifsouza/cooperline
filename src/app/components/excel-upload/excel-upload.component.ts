// src/app/components/file-upload/file-upload.component.ts
import { Component } from '@angular/core';
import { ExcelUploadService } from '../../services/excel-upload.service'; // Usar o novo serviço
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-file-upload', // Alterar o seletor
  templateUrl: './excel-upload.component.html',
  imports: [CommonModule],
  styleUrls: ['./excel-upload.component.scss']
})
export class ExcelUploadComponent { // Alterar o nome da classe
  selectedExcelFile: File | null = null;
  excelUploadMessage: string = '';
  isExcelError: boolean = false;

  selectedPrnFile: File | null = null;
  prnUploadMessage: string = '';
  isPrnError: boolean = false;

  activeTab: 'excel' | 'prn' = 'excel'; // Controla qual aba está ativa

  constructor(private ExcelUploadService: ExcelUploadService) { } // Injetar o novo serviço

  setActiveTab(tab: 'excel' | 'prn'): void {
    this.activeTab = tab;
    // Limpar mensagens e arquivos ao trocar de aba
    this.selectedExcelFile = null;
    this.selectedPrnFile = null;
    this.excelUploadMessage = '';
    this.isExcelError = false;
    this.prnUploadMessage = '';
    this.isPrnError = false;
  }

  // --- Funções para Upload de Excel ---
  onExcelFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file && file.name.endsWith('.xlsx')) {
      this.selectedExcelFile = file;
      this.excelUploadMessage = '';
      this.isExcelError = false;
    } else {
      this.selectedExcelFile = null;
      this.excelUploadMessage = 'Por favor, selecione um arquivo .xlsx.';
      this.isExcelError = true;
    }
  }

  onExcelUpload(): void {
    if (this.selectedExcelFile) {
      this.excelUploadMessage = 'Enviando Excel...';
      this.isExcelError = false;
      this.ExcelUploadService.uploadExcel(this.selectedExcelFile).subscribe({
        next: (response: { message: string; }) => {
          this.excelUploadMessage = response.message || 'Arquivo Excel enviado com sucesso!';
          this.isExcelError = false;
          this.selectedExcelFile = null;
        },
        error: (error: { error: { message: string; }; }) => {
          console.error('Erro no upload do Excel:', error);
          this.excelUploadMessage = error.error?.message || 'Erro ao enviar o arquivo Excel.';
          this.isExcelError = true;
        }
      });
    } else {
      this.excelUploadMessage = 'Nenhum arquivo Excel selecionado.';
      this.isExcelError = true;
    }
  }

  // --- Funções para Upload de PRN ---
  onPrnFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file && file.name.endsWith('.prn')) {
      this.selectedPrnFile = file;
      this.prnUploadMessage = '';
      this.isPrnError = false;
    } else {
      this.selectedPrnFile = null;
      this.prnUploadMessage = 'Por favor, selecione um arquivo .prn.';
      this.isPrnError = true;
    }
  }

  onPrnUpload(): void {
    if (this.selectedPrnFile) {
      this.prnUploadMessage = 'Enviando PRN...';
      this.isPrnError = false;
      this.ExcelUploadService.uploadPrnFile(this.selectedPrnFile).subscribe({
        next: (response: { message: string; }) => {
          this.prnUploadMessage = response.message || 'Arquivo .prn enviado com sucesso!';
          this.isPrnError = false;
          this.selectedPrnFile = null;
        },
        error: (error: { error: { message: string; }; }) => {
          console.error('Erro no upload do .prn:', error);
          this.prnUploadMessage = error.error?.message || 'Erro ao enviar o arquivo .prn.';
          this.isPrnError = true;
        }
      });
    } else {
      this.prnUploadMessage = 'Nenhum arquivo .prn selecionado.';
      this.isPrnError = true;
    }
  }
}