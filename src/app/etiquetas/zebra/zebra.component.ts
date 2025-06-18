// src/app/zebra/zebra.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { LabelaryService } from '../../services/labelary.service';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { SidenavComponent } from '../../shared/sidenav/sidenav.component';

declare var BrowserPrint: any; // Declarar BrowserPrint para o TypeScript

@Component({
  selector: 'app-zebra',
  imports: [CommonModule, FormsModule, NavbarComponent, SidenavComponent],
  templateUrl: './zebra.component.html',
  styleUrl: './zebra.component.scss'
})
export class ZebraComponent implements OnInit, OnDestroy {
  zplContent: string = '^XA^FO50,50^A0N36,36^FDHello, Labelary!^FS^XZ'; // Default ZPL
  dpmm: number = 8;
  width: number = 4;
  height: number = 2;
  renderedLabelUrl: SafeUrl | null = null;
  isLoading: boolean = false;
  errorMessage: string | null = null;
  isSidenavVisible: boolean = false;

  private objectUrl: string | null = null; // Para limpar a URL do Blob

  // Propriedades para Impressão Zebra
  printerList: any[] = [];
  selectedPrinter: any = null; // Armazenará o objeto da impressora Zebra selecionada
  printerStatus: string = 'Inicializando conexão com impressora...';
  isConnectingToPrinter: boolean = false;

  // NOVA PROPRIEDADE para controlar o pop-up
  showPrintOptionsPopup: boolean = false;

  constructor(
    private labelaryService: LabelaryService,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    this.renderLabel(); // Renderiza a etiqueta padrão ao iniciar
    this.setupBrowserPrint(); // Inicializa o BrowserPrint para detecção de impressoras
  }

  ngOnDestroy(): void {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl); // Limpa a URL do Blob ao destruir o componente
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();

      reader.onload = () => {
        if (reader.result) {
          this.zplContent = reader.result.toString();
          this.renderLabel(); // Renderiza a etiqueta com o conteúdo do arquivo
        }
      };
      reader.readAsText(file);
    }
  }

  renderLabel(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.renderedLabelUrl = null;

    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl); // Limpa a URL do Blob anterior
      this.objectUrl = null;
    }

    this.labelaryService.renderLabel(this.zplContent, this.dpmm, this.width, this.height)
      .subscribe({
        next: (blob: Blob) => {
          this.objectUrl = URL.createObjectURL(blob);
          this.renderedLabelUrl = this.sanitizer.bypassSecurityTrustUrl(this.objectUrl);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error rendering label:', error);
          this.errorMessage = 'Falha ao renderizar etiqueta. Verifique o conteúdo ZPL e os parâmetros.';
          this.isLoading = false;
          if (error.error instanceof Blob) {
              const reader = new FileReader();
              reader.onload = () => {
                  this.errorMessage = reader.result?.toString() || this.errorMessage;
              };
              reader.readAsText(error.error);
          }
        }
      });
  }

  downloadLabel(): void {
    if (this.renderedLabelUrl && this.objectUrl) {
      const a = document.createElement('a');
      a.href = this.objectUrl;
      a.download = 'label.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      alert('Nenhuma etiqueta renderizada para baixar.');
    }
  }

  // NOVO: Método para abrir o pop-up de opções de impressão
  openPrintOptionsPopup(): void {
    if (!this.renderedLabelUrl || !this.zplContent) {
      alert('Nenhuma etiqueta renderizada ou ZPL para imprimir. Renderize uma etiqueta primeiro.');
      return;
    }
    this.showPrintOptionsPopup = true;
    // Opcional: Re-verificar impressoras Zebra ao abrir o pop-up
    // this.setupBrowserPrint();
  }

  // NOVO: Método para fechar o pop-up de opções de impressão
  closePrintOptionsPopup(): void {
    this.showPrintOptionsPopup = false;
  }

  // Método para configurar o Zebra Browser Print e listar impressoras
  setupBrowserPrint(): void {
    this.isConnectingToPrinter = true;
    this.printerStatus = 'Tentando conectar ao BrowserPrint...';
    this.printerList = []; // Limpa a lista anterior
    this.selectedPrinter = null; // Reseta a impressora selecionada

    if (typeof BrowserPrint === 'undefined') {
      console.error('BrowserPrint SDK não carregado. Verifique o angular.json e typings.d.ts.');
      this.printerStatus = 'BrowserPrint SDK não disponível. Certifique-se de que está instalado e rodando.';
      this.isConnectingToPrinter = false;
      return;
    }

    BrowserPrint.getDefaultDevice('printer', (printer: any) => {
      this.selectedPrinter = printer;
      if (printer) {
        this.printerStatus = `Impressora padrão detectada: ${printer.name}`;
        console.log('Impressora padrão:', printer);
      } else {
        this.printerStatus = 'Nenhuma impressora padrão detectada.';
        console.warn('Nenhuma impressora padrão Zebra detectada.');
      }

      BrowserPrint.getAvailableDevices((devices: any[]) => {
        this.printerList = devices.filter(d => d.type === 'printer'); // Filtra apenas impressoras
        if (this.printerList && this.printerList.length > 0) {
          console.log('Impressoras disponíveis:', this.printerList);
          if (!this.selectedPrinter) {
             this.selectedPrinter = this.printerList[0]; // Seleciona a primeira se não houver padrão
             this.printerStatus = `Primeira impressora disponível selecionada: ${this.selectedPrinter.name}`;
          }
        } else {
          this.printerStatus = 'Nenhuma impressora Zebra encontrada.';
        }
        this.isConnectingToPrinter = false;
      }, (error: any) => {
        console.error('Erro ao obter lista de impressoras:', error);
        this.printerStatus = 'Erro ao listar impressoras.';
        this.isConnectingToPrinter = false;
      });

    }, (error: any) => {
      console.error('Erro ao obter impressora padrão:', error);
      this.printerStatus = 'Erro ao conectar ao BrowserPrint. Verifique se está rodando.';
      this.isConnectingToPrinter = false;
    });
  }

  // Método para Imprimir Etiqueta Renderizada (PDF/Imagem via Driver Padrão)
  printRenderedImage(): void {
    this.closePrintOptionsPopup(); // Fecha o pop-up após a seleção
    if (this.renderedLabelUrl && this.objectUrl) {
      const printWindow = window.open('', '_blank', 'width=600,height=400');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Imprimir Etiqueta Renderizada</title>
              <style>
                body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
                img { max-width: 100%; max-height: 100%; }
                @media print {
                    body {
                        margin: 0;
                        padding: 0;
                    }
                    img {
                        display: block;
                        margin: auto;
                        width: auto;
                        height: auto;
                    }
                }
              </style>
            </head>
            <body>
              <img src="${this.objectUrl}" onload="window.print();window.close()" />
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    } else {
      alert('Nenhuma etiqueta renderizada para imprimir visualmente.');
    }
  }

  // Método para Imprimir ZPL Diretamente na Impressora Zebra (via BrowserPrint)
  printZebraDirectly(): void {
    this.closePrintOptionsPopup(); // Fecha o pop-up após a seleção
    if (!this.selectedPrinter) {
      alert('Nenhuma impressora Zebra selecionada. Por favor, selecione uma impressora ou verifique a conexão.');
      console.error('Nenhuma impressora Zebra selecionada.');
      return;
    }

    if (!this.zplContent) {
      alert('Nenhum conteúdo ZPL para imprimir.');
      console.error('Nenhum ZPL para imprimir.');
      return;
    }

    this.selectedPrinter.send(this.zplContent,
      (success: any) => {
        console.log('ZPL enviado com sucesso para a impressora Zebra!', success);
        alert('Etiqueta enviada para a impressora Zebra com sucesso!');
      },
      (error: any) => {
        console.error('Erro ao enviar ZPL para a impressora Zebra:', error);
        this.errorMessage = `Falha ao imprimir na Zebra: ${error.message || error}`;
        alert('Erro ao imprimir na impressora Zebra. Verifique o console para detalhes.');
      }
    );
  }

  handleToggleSidenavRequest(): void {
    this.isSidenavVisible = !this.isSidenavVisible;
    console.log('ZebraComponent: Sidenav visibility:', this.isSidenavVisible);
  }

  handleCloseSidenavRequest(): void {
    this.isSidenavVisible = false;
    console.log('ZebraComponent: Sidenav close requested.');
  }
}