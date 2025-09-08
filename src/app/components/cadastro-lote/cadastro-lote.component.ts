// src/app/components/file-upload/file-upload.component.ts
import { Component } from '@angular/core';
import { ExcelUploadService } from '../../services/excel-upload.service'; // Usar o novo serviço
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-file-upload', // Alterar o seletor
  templateUrl: './cadastro-lote.component.html', // O nome do template HTML é 'cadastro-lote.component.html'
  imports: [CommonModule],
  styleUrls: ['./cadastro-lote.component.scss']
})
export class CadastroLoteComponent { // Alterar o nome da classe
  
  selectedLoteFile: File | null = null;
  loteUploadMessage: string = '';
  isLoteError: boolean = false;

  constructor(private ExcelUploadService: ExcelUploadService) { } // Injetar o novo serviço

  
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