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
        console.log('Produtos carregados com sucesso no frontend:', this.products);
      },
      error: (error: any) => {
        console.error('Erro ao carregar produtos no frontend:', error);
        this.productsErrorMessage = 'Falha ao carregar produtos do banco de dados. Tente novamente.';
        this.isLoadingProducts = false;
        this.products = [];
      }
    });
  }

  customSearchFn(term: string, item: ProductEntry) {
    term = term.toLowerCase();
    // Retorna true se o termo de busca estiver no código ou no nome do produto
    return item.codigo.toLowerCase().includes(term) ||
           item.nome_produto.toLowerCase().includes(term);
  }

   searchLabelsByLote(): void {
    // A validação de entrada ainda inclui a bobina, pois ela é importante para a exibição/contexto,
    // mas o filtro no frontend pela bobina foi removido.
    if (!this.isSearchButtonEnabled()) {
      this.loteLabelsErrorMessage = 'Por favor, preencha o Lote (11 dígitos) e a Bobina (1 dígito) corretamente.';
      this.searchedLabels = [];
      this.selectedLoteLabel = null;
      this.masterLoteZplContent = null; 
      this.zplContent = '';
      this.renderLabel();
      return;
    }

    this.isLoadingLoteLabels = true;
    this.isSelectedProduct = true;
    this.loteLabelsErrorMessage = null;
    this.searchedLabels = [];
    this.selectedLoteLabel = null;
    this.masterLoteZplContent = null; 
    this.zplContent = ''; 
    
    // Primeiro, faz a busca pelo Lote (sem a bobina no critério de busca do backend,
    // apenas para verificar se o lote existe e pegar uma entrada como 'selectedLoteLabel')
    // Assumindo que getLoteEntriesByLoteNumber pode receber apenas o lote ou o lote completo.
    // Se o backend espera o lote completo (lote + bobina), então a primeira chamada continua com `loteComplete`.
    // Mas o filtro *no frontend* `filteredByBobina` é que foi removido.
    const loteComplete = this.loteNumberInput + '-' + this.bobinaNumberInput;
    console.log('Iniciando busca por lote completo:', loteComplete); // LOG DE DEBUG 1

    this.labelManagementService.getLoteEntriesByLoteNumber(loteComplete).subscribe({
      next: (loteEntries: LoteEntry[]) => {
        this.searchedLabels = loteEntries;
        this.isLoadingLoteLabels = false;
        console.log('Resultado da busca por loteEntries:', loteEntries); // LOG DE DEBUG 2

        if (loteEntries.length > 0) {
          this.selectedLoteLabel = loteEntries[0];
          console.log('Etiqueta(s) de lote encontrada(s):', this.selectedLoteLabel); // LOG DE DEBUG 3
          console.log('Buscando ZPL para o lote:', this.loteNumberInput); // LOG DE DEBUG 4

          this.labelManagementService.getZPLByLoteNumber(this.loteNumberInput).subscribe({
             next: (zplResponse: ZPLResponse | null) => {
              console.log('Resposta do getZPLByLoteNumber:', zplResponse); // LOG DE DEBUG 5

              if (zplResponse && zplResponse.zplContent) {
                console.log('zplResponse e zplResponse.zplContent são válidos.'); // LOG DE DEBUG 6
                let cleanedZpl = zplResponse.zplContent;

                // --- INÍCIO DA LIMPEZA DO ZPL ---

                cleanedZpl = cleanedZpl.replace(/^[\u0000-\u001F\u007F-\u009F]*/, '');

                const xaIndex = cleanedZpl.indexOf('^XA');
                if (xaIndex !== -1) {
                    cleanedZpl = cleanedZpl.substring(xaIndex);
                } else {
                    console.error('ZPL retornado não contém ^XA. Conteúdo original:', zplResponse.zplContent); // LOG DE ERRO
                    this.loteLabelsErrorMessage = 'ZPL template inválido: falta ^XA.';
                    this.zplContent = '';
                    this.renderLabel();
                    return;
                }

                if (!cleanedZpl.endsWith('^XZ')) {
                    cleanedZpl = cleanedZpl.trim() + '^XZ';
                }

                cleanedZpl = cleanedZpl.replace(/[\r\n]+/g, ''); 
                cleanedZpl = cleanedZpl.trim();

                // --- FIM DA LIMPEZA DO ZPL ---

                this.masterLoteZplContent = cleanedZpl; 
                this.zplContent = this.masterLoteZplContent; 
                this.retrievedLabelName = zplResponse.nameLabel || null; // Capture o nameLabel aqui
                console.log('Nome da etiqueta recuperado:', this.retrievedLabelName);
                console.log('ZPL mestre carregado e limpo para o lote:', this.zplContent); // ESTE É O LOG QUE QUEREMOS VER

                if (this.selectedProduct) {
                  this.onProductSelected();
                } else {
                  this.loteLabelsErrorMessage = 'Lote e Bobina encontrados, ZPL carregado. Por favor, selecione um produto para preencher a etiqueta.';
                  this.renderLabel();
                }
              } else {
                console.warn('Condição if (zplResponse && zplResponse.zplContent) falhou.'); // LOG DE DEBUG 7
                console.warn('Valor de zplResponse:', zplResponse); // LOG DE DEBUG 8
                this.loteLabelsErrorMessage = 'Lote e Bobina encontrados, mas nenhum ZPL template mestre associado a este lote.';
                this.zplContent = '';
                this.renderLabel();
              }
            },
            error: (zplError: any) => {
              console.error('ERRO NO getZPLByLoteNumber (segunda busca):', zplError); // LOG DE DEBUG 9
              this.loteLabelsErrorMessage = 'Falha ao buscar o template ZPL mestre para este lote. Tente novamente.';
              this.zplContent = '';
              this.renderLabel();
            }
          });

        } else {
          console.warn('Nenhuma etiqueta encontrada para o número de lote especificado (primeira busca).'); // LOG DE DEBUG 10
          this.loteLabelsErrorMessage = 'Nenhuma etiqueta encontrada para o número de lote especificado.';
          this.zplContent = '';
          this.renderLabel();
        }
      },
      error: (error: any) => {
        console.error('ERRO NA PRIMEIRA BUSCA (getLoteEntriesByLoteNumber):', error); // LOG DE DEBUG 11
        this.loteLabelsErrorMessage = 'Falha ao buscar etiquetas para este lote. Tente novamente.';
        this.isLoadingLoteLabels = false;
        this.searchedLabels = [];
        this.selectedLoteLabel = null;
        this.masterLoteZplContent = null;
        this.zplContent = '';
        this.renderLabel();
      }
    });
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
    
    if (this.loteNumberInput.length !== 11) {
      this.bobinaNumberInput = ''; 
    }
    this.renderLabel();
  }

  onBobinaInputChange(): void {
    let value = this.bobinaNumberInput.replace(/[^0-9]/g, '');
    if (value.length > 1) {
      value = value.substring(0, 1);
    }
    this.bobinaNumberInput = value;
    this.renderLabel();
  }

  isBobinaInputEnabled(): boolean {
    return this.loteNumberInput.length === 11;
  }

  isSearchButtonEnabled(): boolean {
    return this.loteNumberInput.length === 11 && this.bobinaNumberInput.length === 1 && !this.isLoadingLoteLabels;
  }

  onProductSelected(): void {
    if (this.selectedProduct && this.selectedLoteLabel && this.masterLoteZplContent) { 
      console.log('Produto selecionado para preenchimento de etiqueta:', this.selectedProduct);

      let dynamicZpl = this.masterLoteZplContent; 

      const replaceField = (zpl: string, oldValue: string, newValue: string | number | null | undefined): string => {
        const escapedOldValue = String(oldValue).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(\\^FD)${escapedOldValue}(.*?\\^FS)`, 'g');
        return zpl.replace(regex, `$1${newValue || ''}$2`); 
      };

      // --- LÓGICA PARA PARSEAR O NOME DO PRODUTO E INFORMAÇÕES RELACIONADAS ---
      let productNamePart1 = '';
      let productNamePart2 = '';
      let productNamePart3 = '';
      let productBitola = this.selectedProduct.tamanho_padrao || '';
      let productColor = '';

      const fullProductName = this.selectedProduct.nome_produto || '';
      const parts = fullProductName.split(' ');

      if (parts.length > 0) {
          productNamePart1 = parts.slice(0, 3).join(' ');
          productNamePart2 = parts.slice(3, 6).join(' ');
          productNamePart3 = parts.slice(6, parts.length -1).join(' ');

          const lastPart = parts[parts.length - 1];
          if (lastPart && (lastPart.length === 2 || lastPart.length === 3) && lastPart.toUpperCase() === lastPart) {
              const colorMap: { [key: string]: string } = {
                  'PT': 'PRETO', 'AZ': 'AZUL', 'VM': 'VERMELHO', 'VD': 'VERDE', 'BR': 'BRANCO', 'AM': 'AMARELO'
              };
              productColor = colorMap[lastPart.toUpperCase()] || lastPart;
              if (productNamePart3.endsWith(lastPart)) {
                  productNamePart3 = productNamePart3.substring(0, productNamePart3.length - lastPart.length).trim();
              }
          } else {
              productNamePart3 = parts.slice(6).join(' ');
          }
      }

      const loteFromSearch = this.selectedLoteLabel.lote;
      const fabricadoEmFromSearch = new Date(this.selectedLoteLabel.fabricadoEm).toLocaleDateString('pt-BR');
      const bobinaFromInput = this.bobinaNumberInput || '';


      // --- SUBSTITUIÇÕES PARA OS CAMPOS DAS ETIQUETAS ---
      dynamicZpl = replaceField(dynamicZpl, `PRODUTO: `, `PRODUTO: ${this.selectedProduct.nome_produto || ''}`);
      dynamicZpl = replaceField(dynamicZpl, `ITEM1: `, `ITEM1: ${productNamePart1}`);
      dynamicZpl = replaceField(dynamicZpl, `ITEM2: `, `ITEM2: ${productNamePart2}`);
      dynamicZpl = replaceField(dynamicZpl, `ITEM3: `, `ITEM3: ${productNamePart3}`);
      dynamicZpl = replaceField(dynamicZpl, `BITOLA: `, `BITOLA: ${productBitola}`);
      dynamicZpl = replaceField(dynamicZpl, `COR: `, `COR: ${productColor ? productColor.toUpperCase() : ''}`);
      dynamicZpl = replaceField(dynamicZpl, `LOTE: `, `LOTE: ${loteFromSearch}`);
      dynamicZpl = replaceField(dynamicZpl, `FABRICADO EM: `, `FABRICADO EM: ${fabricadoEmFromSearch}`);
      dynamicZpl = replaceField(dynamicZpl, `BOBINA: `, `BOBINA: ${bobinaFromInput}`); 
      dynamicZpl = replaceField(dynamicZpl, `DESIGNACAO: `, `DESIGNACAO: ${this.selectedProduct.designacao || ''}`);
      dynamicZpl = replaceField(dynamicZpl, `TENSAO: `, `TENSÃO: ${this.selectedProduct.tensao || ''}`);
      dynamicZpl = replaceField(dynamicZpl, `MASSA BRUTA: `, `MASSA BRUTA: ${this.selectedProduct.massa_bruta_kg_100m || ''} kg/100mt`);
      dynamicZpl = replaceField(dynamicZpl, `NORMA: `, `NORMA: ${this.selectedProduct.norma_aplicada || ''}`);
      dynamicZpl = replaceField(dynamicZpl, `COMPOSICAO: `, `COMPOSIÇÃO: ${this.selectedProduct.composicao || ''}`);
      dynamicZpl = replaceField(dynamicZpl, `BOB NUM. SERIE: `, `BOB NUM. SÉRIE: ${this.selectedProduct.codigo || ''}`); 
      dynamicZpl = dynamicZpl.replace(/\^FD(COD_BARRAS|7898932971009)\^FS/g, `^FD${this.selectedProduct.cod_barras || ''}^FS`);


      this.zplContent = dynamicZpl;
      this.renderLabel();
    } else if (!this.selectedProduct && this.masterLoteZplContent) {
        this.zplContent = this.masterLoteZplContent; 
        this.renderLabel();
        this.errorMessage = "Nenhum produto selecionado para preencher a etiqueta. Exibindo o ZPL base do lote.";
    }
    else {
      console.log('Nenhum produto ou lote selecionado. Revertendo ZPL para um estado base.');
      this.zplContent = '^XA^FO50,50^A0N36,36^FDHello, Labelary!^FS^XZ'; 
      this.renderLabel();
      this.errorMessage = null;
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




  getBobinaFromLote(fullLote: string): string {
    if (!fullLote) {
      return '';
    }
    const parts = fullLote.split('-');
    if (parts.length >= 3 && Number.isInteger(Number(parts[parts.length - 1]))) {
      return parts[parts.length - 1];
    }
    return '';
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

    let zplToPrint = this.zplContent;

    zplToPrint = zplToPrint.replace(/\^PQ\d+,\d+,\d+,[YN]/gi, '');

    if (!zplToPrint.trim().endsWith('^XZ')) {
        zplToPrint = zplToPrint.trim() + '^XZ';
    }

    zplToPrint = zplToPrint.replace(/\^XZ$/, `^PQ${this.numberOfCopies},0,1,Y^XZ`);

    console.log('ZPL final (com cópias) a ser enviado para impressão:', zplToPrint);

    const printOptions = {};

   this.selectedPrinter.send(
      zplToPrint,
      (success: any) => {
        console.log('ZPL enviado com sucesso para a impressora Zebra!', success);
        alert('Etiqueta enviada para a impressora Zebra com sucesso!');

        const currentUserId = this.authService.getUserId();
        const currentUserName = this.authService.getUserName();

        if (currentUserId) {
          const productCode = this.selectedProduct ? this.selectedProduct.codigo : null;
          const productName = this.selectedProduct ? this.selectedProduct.nome_produto: null;
          const lotePrinted = this.selectedLoteLabel ? this.selectedLoteLabel.lote : this.loteNumberInput || null; 
          const productNameToSave = this.retrievedLabelName || null;
          const historyEntry: PrintHistoryEntry = {
            userId: currentUserId,
            userName: currentUserName || 'Nome não disponível',
            timestamp: new Date().toISOString(),
            printerName: this.selectedPrinter.name,
            copies: this.numberOfCopies,
            productName: productName,
            productCode: productCode,
            labelName: productNameToSave,
            productLote: lotePrinted,
            reprint: this.reprint,
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

     this.closePrintOptionsPopup();
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