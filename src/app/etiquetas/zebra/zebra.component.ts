// src/app/zebra/zebra.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { LabelaryService } from '../../services/labelary.service';
import { PrintHistoryApiService } from '../../services/print-history-api.service';
import { LabelManagementService } from '../../services/label-management.service'; // Importar o novo serviço
import { PrintHistoryEntry } from '../../models/print-history.model';
import { LabelEntry } from '../../models/label-entry.model'; // Certifique-se de ter este modelo
import { HttpClientModule } from '@angular/common/http';

declare var BrowserPrint: any;

interface AuthUser {
  id: string;
  nome: string;
  matricula: string;
  email: string;
}

@Component({
  selector: 'app-zebra',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './zebra.component.html',
  styleUrl: './zebra.component.scss'
})
export class ZebraComponent implements OnInit, OnDestroy {
  zplContent: string = '^XA^FO50,50^A0N36,36^FDHello, Labelary!^FS^XZ';
  dpmm: number = 8;
  width: number = 4;
  height: number = 6;
  renderedLabelUrl: SafeUrl | null = null;
  isLoading: boolean = false;
  errorMessage: string | null = null;
  isSidenavVisible: boolean = false;

  private objectUrl: string | null = null;

  printerList: any[] = [];
  selectedPrinter: any = null;
  printerStatus: string = 'Inicializando conexão com impressora...';
  isConnectingToPrinter: boolean = false;
  numberOfCopies: number = 1;

  showPrintOptionsPopup: boolean = false;

  loggedInUserName: string | null = null;
  loggedInUserId: string | null = null;
  loggedInUserMatricula: string | null = null;

  // NOVAS PROPRIEDADES para etiquetas do banco de dados
  dbLabels: LabelEntry[] = [];
  selectedDbLabelId: number | null = null; // Usará o ID da etiqueta selecionada
  isLoadingDbLabels: boolean = false;
  dbLabelsErrorMessage: string | null = null;

  constructor(
    private labelaryService: LabelaryService,
    private sanitizer: DomSanitizer,
    private printHistoryApiService: PrintHistoryApiService,
    private labelManagementService: LabelManagementService // Injete o novo serviço
  ) { }

  ngOnInit(): void {
    this.loadDbLabels(); // Carrega as etiquetas do banco ao iniciar
    this.renderLabel(); // Renderiza a etiqueta padrão inicial
    this.setupBrowserPrint();
    this.loadUserDataFromLocalStorage();
  }

  ngOnDestroy(): void {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
    }
  }

  private loadUserDataFromLocalStorage(): void {
    const authDataString = localStorage.getItem('CapacitorStorage.inspector_auth');
    if (authDataString) {
      try {
        const authData = JSON.parse(authDataString);
        if (authData && authData.user) {
          const user: AuthUser = authData.user;
          this.loggedInUserId = user.id;
          this.loggedInUserName = user.nome;
          this.loggedInUserMatricula = user.matricula;
          console.log('Dados do usuário carregados:', this.loggedInUserName, this.loggedInUserId, this.loggedInUserMatricula);
        }
      } catch (e) {
        console.error('Erro ao parsear dados de autenticação do localStorage:', e);
      }
    } else {
      this.loggedInUserName = localStorage.getItem('userName');
      console.log('UserName carregado diretamente do localStorage:', this.loggedInUserName);
    }

    if (!this.loggedInUserId && !this.loggedInUserName) {
      this.loggedInUserId = 'desconhecido';
      this.loggedInUserName = 'Usuário Desconhecido';
      this.loggedInUserMatricula = '000000';
      console.warn('Nenhum dado de usuário encontrado no localStorage. Usando valores padrão.');
    }
  }

  // NOVO MÉTODO: Carrega etiquetas do banco de dados
  loadDbLabels(): void {
    this.isLoadingDbLabels = true;
    this.dbLabelsErrorMessage = null;
    this.dbLabels = []; // Limpa a lista antes de carregar
    this.labelManagementService.getAllLabels().subscribe({
      next: (labels: LabelEntry[]) => {
        this.dbLabels = labels;
        this.isLoadingDbLabels = false;
        // Opcional: pré-selecionar a primeira etiqueta se houver
        // if (this.dbLabels.length > 0 && this.selectedDbLabelId === null) {
        //   this.selectedDbLabelId = this.dbLabels[0].id;
        //   this.onDbLabelSelected();
        // }
      },
      error: (error) => {
        console.error('Erro ao carregar etiquetas do banco de dados:', error);
        this.dbLabelsErrorMessage = 'Falha ao carregar etiquetas do banco de dados. Tente novamente.';
        this.isLoadingDbLabels = false;
        this.dbLabels = []; // Garante que a lista esteja vazia em caso de erro
      }
    });
  }

  // NOVO MÉTODO: Lida com a seleção de uma etiqueta do banco
  onDbLabelSelected(): void {
    const selectedLabel = this.dbLabels.find(label => label.id === this.selectedDbLabelId);
    if (selectedLabel) {
      this.zplContent = selectedLabel.original_content; // Define o conteúdo ZPL
      this.renderLabel(); // Renderiza a etiqueta selecionada
    } else {
      this.zplContent = ''; // Limpa o ZPL se "Selecione uma etiqueta" for escolhido
      this.renderedLabelUrl = null;
      this.errorMessage = null; // Limpa mensagens de erro
    }
  }

  renderLabel(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.renderedLabelUrl = null;

    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }

    if (!this.zplContent) {
      this.errorMessage = 'Nenhum conteúdo ZPL para renderizar. Selecione uma etiqueta ou insira ZPL manual.';
      this.isLoading = false;
      return;
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
      // Use o nome da etiqueta do banco se estiver selecionada, senão um nome genérico
      const selectedLabel = this.dbLabels.find(label => label.id === this.selectedDbLabelId);
      a.download = selectedLabel ? `${selectedLabel.file_name}.png` : 'label.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      alert('Nenhuma etiqueta renderizada para baixar.');
    }
  }

  openPrintOptionsPopup(): void {
    if (!this.renderedLabelUrl || !this.zplContent) {
      alert('Nenhuma etiqueta renderizada ou ZPL para imprimir. Renderize uma etiqueta primeiro.');
      return;
    }
    this.showPrintOptionsPopup = true;
  }

  closePrintOptionsPopup(): void {
    this.showPrintOptionsPopup = false;
  }

  setupBrowserPrint(): void {
    this.isConnectingToPrinter = true;
    this.printerStatus = 'Tentando conectar ao BrowserPrint e listar impressoras...';
    this.printerList = [];
    this.selectedPrinter = null;

    if (typeof BrowserPrint === 'undefined') {
      console.error('BrowserPrint SDK não carregado. Verifique o angular.json e typings.d.ts.');
      this.printerStatus = 'BrowserPrint SDK não disponível. Certifique-se de que está instalado e rodando.';
      this.isConnectingToPrinter = false;
      return;
    }

    BrowserPrint.getDefaultDevice('printer', (printer: any) => {
      if (printer) {
        this.selectedPrinter = printer;
        this.printerStatus = `Impressora padrão detectada: ${printer.name}`;
      } else {
        this.printerStatus = 'Nenhuma impressora padrão detectada, procurando outras...';
      }

      BrowserPrint.getAvailableDevices((devices: any[]) => {
        this.printerList = devices.filter(d => d.type === 'printer');

        if (this.printerList && this.printerList.length > 0) {
          if (!this.selectedPrinter) {
             this.selectedPrinter = this.printerList[0];
             this.printerStatus = `Impressora conectada: ${this.selectedPrinter.name}`;
          } else {
             // Se já encontrou a padrão, apenas atualiza a lista para seleção posterior
             this.printerStatus = `Impressora conectada: ${this.selectedPrinter.name}`;
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
      console.error('Erro ao conectar ao BrowserPrint ou obter impressora padrão:', error);
      this.printerStatus = 'Erro ao conectar ao serviço Zebra BrowserPrint. Verifique se ele está rodando.';
      this.isConnectingToPrinter = false;

      // Tenta listar as impressoras mesmo após um erro no getDefaultDevice (caso seja um erro temporário ou específico do padrão)
      BrowserPrint.getAvailableDevices((devices: any[]) => {
        this.printerList = devices.filter(d => d.type === 'printer');
        if (this.printerList && this.printerList.length > 0) {
          if (!this.selectedPrinter) { // Garante que selectedPrinter só seja setado se ainda não foi
             this.selectedPrinter = this.printerList[0];
             this.printerStatus = `Impressora conectada: ${this.selectedPrinter.name}`;
          } else {
             this.printerStatus = `Impressora conectada: ${this.selectedPrinter.name}`;
          }
        } else {
          this.printerStatus = 'Nenhuma impressora Zebra encontrada.';
        }
        this.isConnectingToPrinter = false;
      }, (errorList: any) => {
        console.error('Erro adicional ao tentar listar impressoras após falha de padrão:', errorList);
        this.printerStatus = 'Erro ao conectar ou listar impressoras Zebra.';
        this.isConnectingToPrinter = false;
      });
    });
  }

  printRenderedImage(): void {
    this.closePrintOptionsPopup();
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

  printZebraDirectly(): void {
    this.closePrintOptionsPopup();
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

    const printOptions = {
      copies: this.numberOfCopies
    };

    this.selectedPrinter.send(
      this.zplContent,
      (success: any) => {
        console.log('ZPL enviado com sucesso para a impressora Zebra!', success);
        alert('Etiqueta enviada para a impressora Zebra com sucesso!');

        if (this.loggedInUserId) {
          const selectedLabel = this.dbLabels.find(label => label.id === this.selectedDbLabelId);
          const historyEntry: PrintHistoryEntry = {
            userId: this.loggedInUserId,
            userName: this.loggedInUserName || 'Nome não disponível',
            timestamp: new Date().toISOString(),
            printerName: this.selectedPrinter.name,
            copies: this.numberOfCopies,
            labelName: selectedLabel ? selectedLabel.file_name : 'ZPL Manual'
          };

          this.printHistoryApiService.savePrintEntry(historyEntry).subscribe({
            next: (response) => {
              console.log('Histórico de impressão salvo no banco de dados:', response);
            },
            error: (apiError) => {
              console.error('Erro ao salvar histórico no banco de dados:', apiError);
            }
          });
        } else {
          console.warn('Não foi possível salvar o histórico de impressão: ID de usuário não encontrado.');
        }
      },
      (error: any) => {
        console.error('Erro ao enviar ZPL para a impressora Zebra:', error);
        this.errorMessage = `Falha ao imprimir na Zebra: ${error.message || error}`;
        alert('Erro ao imprimir na impressora Zebra. Verifique o console para detalhes.');
      },
      printOptions
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