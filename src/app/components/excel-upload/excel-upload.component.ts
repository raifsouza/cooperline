// src/app/components/file-upload/file-upload.component.ts
import { Component } from '@angular/core';
import { ExcelUploadService } from '../../services/excel-upload.service'; // Usar o novo serviço
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-file-upload', // Alterar o seletor
  templateUrl: './excel-upload.component.html', // O nome do template HTML é 'excel-upload.component.html'
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

  // NOVAS PROPRIEDADES PARA O UPLOAD DE LOTE
  selectedLoteFile: File | null = null;
  loteUploadMessage: string = '';
  isLoteError: boolean = false;

  // Atualiza o tipo de activeTab para incluir 'lote'
  activeTab: 'excel' | 'prn' | 'lote' = 'excel'; // Controla qual aba está ativa

  constructor(private ExcelUploadService: ExcelUploadService) { } // Injetar o novo serviço

  // Atualiza o tipo de tab para incluir 'lote'
  setActiveTab(tab: 'excel' | 'prn' | 'lote'): void {
    this.activeTab = tab;
    // Limpar mensagens e arquivos ao trocar de aba
    this.selectedExcelFile = null;
    this.selectedPrnFile = null;
    this.selectedLoteFile = null; // Limpa o arquivo de lote
    this.excelUploadMessage = '';
    this.isExcelError = false;
    this.prnUploadMessage = '';
    this.isPrnError = false;
    this.loteUploadMessage = ''; // Limpa a mensagem de lote
    this.isLoteError = false; // Limpa o erro de lote
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

  // --- NOVAS FUNÇÕES PARA UPLOAD DE LOTE ---
  onLoteFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file && (file.name.endsWith('.csv') || file.name.endsWith('.xlsx'))) {
      this.selectedLoteFile = file;
      this.loteUploadMessage = '';
      this.isLoteError = false;
    } else {
      this.selectedLoteFile = null;
      this.loteUploadMessage = 'Por favor, selecione um arquivo .csv ou .xlsx para o lote.';
      this.isLoteError = true;
    }
  }

 onLoteUpload(): void {
    if (this.selectedLoteFile) {
      this.loteUploadMessage = 'Enviando Lote...';
      this.isLoteError = false;

      this.ExcelUploadService.uploadLoteFile(this.selectedLoteFile).subscribe({ // <--- CHAMADA AO NOVO MÉTODO
        next: (response: { message: string; }) => {
          this.loteUploadMessage = response.message || 'Arquivo de lote enviado com sucesso!';
          this.isLoteError = false;
          this.selectedLoteFile = null; // Limpa o arquivo após o upload
        },
        error: (error: { error: { message: string; }; }) => {
          console.error('Erro no upload do lote:', error);
          this.loteUploadMessage = error.error?.message || 'Erro ao enviar o arquivo de lote.';
          this.isLoteError = true;
        }
      });
    } else {
      this.loteUploadMessage = 'Nenhum arquivo de lote selecionado.';
      this.isLoteError = true;
    }
  }
}