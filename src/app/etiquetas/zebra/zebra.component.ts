// src/app/zebra/zebra.component.ts
import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { LabelaryService } from '../../services/labelary.service';
import { PrintHistoryApiService } from '../../services/print-history-api.service';
import { LabelManagementService, ZPLResponse } from '../../services/label-management.service';
import { PrintHistoryEntry } from '../../models/print-history.model';
import { ProductEntry, LoteEntry } from '../../models/label-entry.model'; // Certifique-se de que LoteEntry tem zplContent
import { HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { NgSelectModule } from '@ng-select/ng-select';
import { Observable, take } from 'rxjs';

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
  imports: [CommonModule, FormsModule, HttpClientModule, NgSelectModule ],
  templateUrl: './zebra.component.html',
  styleUrls: ['./zebra.component.scss']
})
export class ZebraComponent implements OnInit, OnDestroy {
  zplContent: string = '^XA^FO50,50^A0N36,36^FDHello, Labelary!^FS^XZ'; // Pode manter um valor inicial ou deixar vazio
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
  retrievedLabelName: string | null = null;
  showPrintOptionsPopup: boolean = false;
  reprint: boolean = false

  loggedInUserName: string | null = null;
  loggedInUserId: string | null = null;

  loteNumberInput: string = '';
  bobinaNumberInput: string = '';
  tamanhoNumberInput: string = '';
  pedidoOcNumberInput: string = '';
  isMetragemEditable: boolean = false;

  isLoadingLoteLabels: boolean = false;
  loteLabelsErrorMessage: string | null = null;

  searchedLabels: LoteEntry[] = [];
  selectedLoteLabel: LoteEntry | null = null;
  masterLoteZplContent: string | null = null;

  products: ProductEntry[] = [];
  isSelectedProduct: boolean = false;
  selectedProduct: ProductEntry | null = null;
  isLoadingProducts: boolean = false;
  productsErrorMessage: string | null = null;

  private _printHistoryCache: PrintHistoryEntry[] = [];

  showReprintConfirmationPopup: boolean = false;

  constructor(
    private labelaryService: LabelaryService,
    private sanitizer: DomSanitizer,
    private printHistoryApiService: PrintHistoryApiService,
    private labelManagementService: LabelManagementService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.renderLabel();
    this.loadProducts();
    this.setupBrowserPrint();
    this.loadUserDataFromLocalStorage();
  }

  ngOnDestroy(): void {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
    }
  }

  private loadUserDataFromLocalStorage(): void {
   this.authService.userId$.subscribe(userId => {
      this.loggedInUserId = userId;
   });
   this.authService.userName$.subscribe(userName => {
      this.loggedInUserName = userName;
   });

   if (!this.authService.getUserId()) {
      this.loggedInUserId = 'desconhecido';
      this.loggedInUserName = 'Usuário Desconhecido';
      console.warn('Dados de usuário não disponíveis via AuthService no início. Usando valores padrão.');
   }
  }

  loadProducts(): void {
    this.isLoadingProducts = true;
    this.productsErrorMessage = null;
    this.products = [];
    console.log('Tentando carregar produtos do backend...');

    this.labelManagementService.getAllProducts().subscribe({
      next: (data: ProductEntry[]) => {
        this.products = data;
        this.isLoadingProducts = false;
        
        if (this.products && this.products.length > 0) {
        console.log('Produtos carregados com sucesso no frontend:', this.products[0]);
        }
      },
      error: (error: any) => {
        console.error('Erro ao carregar produtos no frontend:', error);
        this.productsErrorMessage = 'Falha ao carregar produtos do banco de dados. Tente novamente.';
        this.isLoadingProducts = false;
        this.products = [];
      }
    });
  }

  customSearchFn(term: string, item: ProductEntry): boolean {
  const searchTerm = term.toLowerCase();

  const codeMatch = item.codigo.toLowerCase().includes(searchTerm);
  if (codeMatch) return true;

  // Constrói uma única string com todas as linhas do nome para a busca
  const fullName = [
    item.nome_linha_1,
    item.nome_linha_2,
    item.nome_linha_3,
    item.nome_linha_4,
    item.nome_linha_5,
    item.nome_linha_6
  ]
  .filter(line => !!line) // Remove linhas vazias
  .join(' ')
  .toLowerCase();

  const nameMatch = fullName.includes(searchTerm);
  return nameMatch;
}

  onLoteInputChange(): void {
    let value = this.loteNumberInput.replace(/[^0-9]/g, '');

    if (value.length > 4) {
      value = value.substring(0, 4) + '-' + value.substring(4);
    }

    if (value.length > 11) {
      value = value.substring(0, 11);
    }
    this.loteNumberInput = value;

    if (this.loteNumberInput.length !== 11)
    this.updatePreview();
  }

  onBobinaInputChange(): void {
    let value = this.bobinaNumberInput.replace(/[^0-9]/g, '');
    if (value.length > 1) {
      value = value.substring(0, 5);
    }
    this.bobinaNumberInput = value;
    this.updatePreview();
  }

  // onTamanhoInputChange(): void {
  //   let value = this.tamanhoNumberInput.replace(/[^0-9]/g, '');
  //   if(value.length > 3) {
  //     value = value.substring(0, 3);
  //   }
  //   this.tamanhoNumberInput = value;
  //   this.updatePreview();
  // }

  onPedidoOcInputChange(): void {
    let value = this.pedidoOcNumberInput.replace(/[^0-9]/g, '');
    if(value.length > 1) {
      value = value.substring(0, 8);
    }
    this.pedidoOcNumberInput = value;
    this.updatePreview();
  }

  isLabelInputEnabled(): boolean {
    return this.loteNumberInput.length === 11;
  }

  isSearchButtonEnabled(): boolean {
    return this.loteNumberInput.length === 11 && !this.isLoadingLoteLabels;
  }

searchLabelsByLote(): void {
  if (!this.isSearchButtonEnabled()) {
    this.loteLabelsErrorMessage = 'Por favor, preencha o Lote corretamente.';
    // Limpa estados antigos
    this.selectedLoteLabel = null;
    this.masterLoteZplContent = null;
    this.zplContent = '';
    this.renderLabel();
    return;
  }

  this.isLoadingLoteLabels = true;
  this.loteLabelsErrorMessage = null;
  const loteComplete = this.loteNumberInput

  // A chamada ao serviço agora só valida se o lote foi encontrado
  this.labelManagementService.getLoteEntriesByLoteNumber(loteComplete).subscribe({
    next: (loteEntries) => {
      this.isLoadingLoteLabels = false;
      if (loteEntries.length > 0) {
        this.selectedLoteLabel = loteEntries[0]; // Guarda os dados do lote encontrado
        this.loteLabelsErrorMessage = 'Lote validado com sucesso! Agora, por favor, selecione um produto.';
        console.log('Lote validado:', this.selectedLoteLabel);
        this.isSelectedProduct = true;
        // AÇÃO TERMINA AQUI. Não buscamos mais o ZPL.
      } else {
        this.loteLabelsErrorMessage = 'Nenhum lote encontrado com este número.';
        this.selectedLoteLabel = null;
      }
    },
    error: (err) => {
      this.isLoadingLoteLabels = false;
      this.loteLabelsErrorMessage = 'Erro ao buscar o lote.';
      this.selectedLoteLabel = null;
      console.error(err);
    }
  });
}


onProductSelected(): void {
  // Limpa o ZPL anterior
  console.log('Frontend - Objeto do produto selecionado:', this.selectedProduct);
  this.masterLoteZplContent = null;
  this.zplContent = '';
  this.errorMessage = null;

  if (!this.selectedProduct || !this.selectedProduct.label_id) {
    this.renderLabel(); // Limpa a pré-visualização
    if (this.selectedProduct) {
      this.errorMessage = 'Este produto não tem um layout de etiqueta associado.';
    }
    return;
  }

  console.log(`Produto selecionado. Buscando layout com ID: ${this.selectedProduct.label_id}`);

  this.labelManagementService.getLabelById(this.selectedProduct.label_id).subscribe({
    next: (labelEntry) => {
      if (labelEntry && labelEntry.originalContent) {
        this.masterLoteZplContent = labelEntry.originalContent;
        // Chama a função que cuida da pré-visualização
        if (this.selectedProduct?.retalho?.toLowerCase() === 'sim') {
            this.isMetragemEditable = true;
            this.tamanhoNumberInput = ''; // Limpa para o usuário digitar
          } else {
            this.isMetragemEditable = false;
            // Usa o tamanho padrão do produto como valor
            this.tamanhoNumberInput = this.selectedProduct?.tamanho_padrao || '100';
          }

          this.updatePreview(); // Chama a atualização da tela
        } else {
          // ...
        }
      },
      error: (err) => {
        // ...
      }
    });
  }

  private generateFinalZpl(printDate: Date): string {
    if (!this.selectedProduct || !this.masterLoteZplContent) {
      return '';
    }
    
    let zplFinal = this.masterLoteZplContent;

    const replacements: { [key: string]: any } = {
      // Dados do lote que o usuário digitou
      '{{LOTE}}': this.loteNumberInput,
      '{{BOB_NUM_SERIE}}': this.bobinaNumberInput,
      '{{PEDIDO_OC}}': this.pedidoOcNumberInput,
      
      // USA A DATA QUE FOI PASSADA COMO PARÂMETRO
      '{{DATA_FAB}}': printDate.toLocaleDateString('pt-BR'),

      // Dados que vêm do produto selecionado do banco
      '{{NOME_LINHA_1}}': this.selectedProduct.nome_linha_1, 
      '{{NOME_LINHA_2}}': this.selectedProduct.nome_linha_2, 
      '{{NOME_LINHA_3}}': this.selectedProduct.nome_linha_3, 
      '{{NOME_LINHA_4}}': this.selectedProduct.nome_linha_4, 
      '{{NOME_LINHA_5}}': this.selectedProduct.nome_linha_5, 
      '{{NOME_LINHA_6}}': this.selectedProduct.nome_linha_6, 
    // ...
      '{{COD_BARRAS}}': this.selectedProduct.cod_barras,
      '{{SECAO}}': `${this.tamanhoNumberInput} m`,
      '{{TENSAO}}': this.selectedProduct.tensao,
      '{{DESIGNACAO}}': this.selectedProduct.designacao,
      '{{MASSA_BRUTA}}': `${this.selectedProduct.massa_bruta_kg_100m} kg/100mt`,
      '{{MASSA_LIQUIDA}}': `${this.selectedProduct.massa_liquida_kg_100m} kg/100mt`,
      '{{NORMA}}': this.selectedProduct.norma_aplicada,
      '{{COMPOSICAO}}': this.selectedProduct.composicao,
      '{{NUMERO_REGISTRO}}': this.selectedProduct.numero_registro,
    };

    console.log("Frontend - Dados FINAIS para substituição:", replacements);

    const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    for (const placeholder in replacements) {
      const valor = replacements[placeholder] || '';
      const regex = new RegExp(escapeRegex(placeholder), 'g');
      zplFinal = zplFinal.replace(regex, valor);
    }

    // Esta função apenas RETORNA o ZPL, ela não atualiza a tela.
    return zplFinal;
  }

  public updatePreview(): void {
  // Para a pré-visualização, usamos a data local (new Date())
  this.zplContent = this.generateFinalZpl(new Date());
  this.renderLabel(); // Chama a renderização do Labelary
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
      this.errorMessage = 'Nenhum conteúdo ZPL para renderizar. Selecione um produto e lote ou insira ZPL manual.';
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
      const fileName = `lote_${this.loteNumberInput || 'desconhecido'}_${this.selectedProduct?.codigo || 'produto'}.png`;
      a.download = fileName;
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

    const currentProductCode = this.selectedProduct ? this.selectedProduct.codigo : null;
    const currentProductLote = this.loteNumberInput + '-' + this.bobinaNumberInput;

    if (currentProductCode && currentProductLote) {
      this.printHistoryApiService.checkIfReprint(currentProductCode, currentProductLote).pipe(
        take(1)
      ).subscribe(isReprint => {
        console.log('Resultado da verificação de reimpressão (isReprint):', isReprint); // DEBUG: Adicione este log

        if (isReprint) {
          this.showReprintConfirmationPopup = true; // <-- Esta linha DEVE estar sendo executada
          this.showPrintOptionsPopup = false; // <-- Garanta que o outro popup esteja fechado, se ele estiver abrindo por padrão
          console.log('showReprintConfirmationPopup definido para true'); // DEBUG: Adicione este log
        } else {
          this.showPrintOptionsPopup = true;
          this.showReprintConfirmationPopup = false; // Garanta que este popup esteja fechado
          this.reprint = false;
        }
      }, error => {
        console.error('Erro ao verificar reimpressão:', error);
        this.showPrintOptionsPopup = true;
        this.showReprintConfirmationPopup = false; // Garanta que este popup esteja fechado
        this.reprint = false;
      });
    } else {
      this.showPrintOptionsPopup = true;
      this.showReprintConfirmationPopup = false; // Garanta que este popup esteja fechado
      this.reprint = false;
    }
  }

    // Funções para lidar com o popup de reimpressão
  confirmReprint(): void {
    this.showReprintConfirmationPopup = false; // Fecha o popup de reimpressão
    this.reprint = true;
    this.showPrintOptionsPopup = true;         // Abre o popup de opções de impressão
  }

  cancelReprint(): void {
    this.showReprintConfirmationPopup = false; // Fecha o popup de reimpressão
    // O usuário optou por não imprimir, então não faz mais nada.
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
        this.printerList = devices.filter((d: { type: string; }) => d.type === 'printer');

        if (this.printerList && this.printerList.length > 0) {
          if (!this.selectedPrinter) {
              this.selectedPrinter = this.printerList[0];
              this.printerStatus = `Impressora conectada: ${this.selectedPrinter.name}`;
          } else {
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

      BrowserPrint.getAvailableDevices((devices: any[]) => {
        this.printerList = devices.filter((d: { type: string; }) => d.type === 'printer');
        if (this.printerList && this.printerList.length > 0) {
          if (!this.selectedPrinter) {
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
    alert('Nenhuma impressora Zebra selecionada.');
    return;
  }
  if (!this.selectedProduct || !this.masterLoteZplContent) {
    alert('Por favor, valide um lote e selecione um produto antes de imprimir.');
    return;
  }

  // busca data e hora atual do servidor
  this.labelManagementService.getServerTime().subscribe({
    next: (timeResponse) => {
      const serverDate = new Date(timeResponse.currentTime);

      
      let zplToPrint = this.generateFinalZpl(serverDate);
      
      if (!zplToPrint) {
        alert('Falha ao gerar ZPL com os dados. Verifique os placeholders.');
        return;
      }

      // quantidade de cópias
      const quantityCommand = `^PQ${this.numberOfCopies}`;
      zplToPrint = zplToPrint.replace(/\^PQ\d+/i, quantityCommand);

      console.log('ZPL final (com cópias) a ser enviado para impressão:', zplToPrint);
      
      // envia o zpl para a impressora
      const printOptions = {};
      this.selectedPrinter.send(zplToPrint,
        (success: any) => {
          console.log('ZPL enviado com sucesso!', success);
          alert('Etiqueta enviada para a impressora com sucesso!');
          this.saveHistory(zplToPrint); // Chama a função para salvar o histórico
        },
        (error: any) => {
          console.error('Erro ao enviar ZPL para a impressora:', error);
          alert('Erro ao imprimir na impressora Zebra.');
        }
      );
    },
    error: (err) => {
      console.error('Erro ao buscar a hora do servidor:', err);
      alert('Não foi possível obter a hora do servidor. A impressão foi cancelada.');
    }
  });
}

  private saveHistory(printedZpl: string): void {
  const currentUserId = this.authService.getUserId();
  const currentUserName = this.authService.getUserName();

  if (currentUserId && this.selectedProduct) {
    const fullProductNameForHistory = [
      this.selectedProduct.nome_linha_1, this.selectedProduct.nome_linha_2,
      this.selectedProduct.nome_linha_3, this.selectedProduct.nome_linha_4,
      this.selectedProduct.nome_linha_5, this.selectedProduct.nome_linha_6,
    ].filter(Boolean).join(' ');

    const historyEntry: PrintHistoryEntry = {
      userId: currentUserId,
      userName: currentUserName || 'Nome não disponível',
      timestamp: new Date().toISOString(),
      printerName: this.selectedPrinter.name,
      copies: this.numberOfCopies,
      productName: fullProductNameForHistory,
      productCode: this.selectedProduct.codigo,
      labelName: this.retrievedLabelName || 'N/A',
      productLote: this.selectedLoteLabel?.lote || this.loteNumberInput,
      reprint: this.reprint,
      zplContentSent: printedZpl // Salvando o ZPL exato que foi impresso
    };

    this.printHistoryApiService.savePrintEntry(historyEntry).subscribe({
      next: (response) => console.log('Histórico de impressão salvo.', response),
      error: (apiError) => console.error('Erro ao salvar histórico.', apiError)
    });
  } else {
    console.warn('Não foi possível salvar o histórico: ID de usuário ou produto selecionado não encontrado.');
  }
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
