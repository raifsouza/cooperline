// src/app/zebra/zebra.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { LabelaryService } from '../../services/labelary.service';
import { PrintHistoryApiService } from '../../services/print-history-api.service';
import { LabelManagementService } from '../../services/label-management.service';
import { PrintHistoryEntry } from '../../models/print-history.model';
import { LabelEntry, ProductEntry } from '../../models/label-entry.model';
import { HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';

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

  // PROPRIEDADES EXISTENTES para etiquetas do banco de dados
  dbLabels: LabelEntry[] = [];
  selectedDbLabelId: number | null = null; // Usará o ID da etiqueta selecionada
  isLoadingDbLabels: boolean = false;
  dbLabelsErrorMessage: string | null = null;

  // NOVAS PROPRIEDADES PARA PRODUTOS (ADICIONADAS AQUI) 👇
  products: ProductEntry[] = []; // Array para armazenar os produtos carregados
  selectedProduct: ProductEntry | null = null; // O produto selecionado no novo dropdown
  isLoadingProducts: boolean = false; // <<< ADICIONADO: Variável de carregamento para produtos
  productsErrorMessage: string | null = null; // <<< ADICIONADO: Variável de erro para produtos

  constructor(
    private labelaryService: LabelaryService,
    private sanitizer: DomSanitizer,
    private printHistoryApiService: PrintHistoryApiService,
    private labelManagementService: LabelManagementService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.loadDbLabels();
    this.renderLabel();
    this.loadProducts(); // Carrega os produtos do banco ao iniciar
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

    // Se você precisa de um fallback imediato caso o usuário não esteja logado,
    // ou se as subscriptions não tiverem emitido um valor ainda (apenas na primeira carga).
    // O ideal é que o AuthService já tenha populado os BehaviorSubjects
    // a partir do localStorage no seu construtor.
    if (!this.authService.getUserId()) {
      this.loggedInUserId = 'desconhecido';
      this.loggedInUserName = 'Usuário Desconhecido';
      console.warn('Dados de usuário não disponíveis via AuthService no início. Usando valores padrão.');
    }
  }

  // MÉTODO PARA CARREGAR PRODUTOS (AJUSTADO PARA TRATAMENTO DE ERRO/LOADING)
  loadProducts(): void {
    this.isLoadingProducts = true; // Inicia o carregamento
    this.productsErrorMessage = null; // Limpa mensagens de erro anteriores
    this.products = []; // Limpa a lista antes de carregar
    console.log('Tentando carregar produtos do backend...');

    this.labelManagementService.getAllProducts().subscribe({
      next: (data: ProductEntry[]) => {
        this.products = data;
        this.isLoadingProducts = false; // Finaliza o carregamento
        console.log('Produtos carregados com sucesso no frontend:', this.products);
      },
      error: (error: any) => {
        console.error('Erro ao carregar produtos no frontend:', error);
        this.productsErrorMessage = 'Falha ao carregar produtos do banco de dados. Tente novamente.'; // Define mensagem de erro
        this.isLoadingProducts = false; // Finaliza o carregamento mesmo com erro
        this.products = []; // Garante que a lista esteja vazia em caso de erro
      }
    });
  }

  // MÉTODO PARA LIDAR COM A SELEÇÃO DE PRODUTO (NOME MANTIDO COMO NO HTML)
 onProductSelected(): void {
    if (this.selectedProduct) {
      console.log('Produto selecionado para preenchimento de etiqueta:', this.selectedProduct);

      let dynamicZpl = this.selectedDbLabelId !== null
        ? (this.dbLabels.find(label => label.id === this.selectedDbLabelId)?.original_content || '')
        : '';

      if (!dynamicZpl) {
        this.errorMessage = 'Nenhuma etiqueta ZPL do banco de dados selecionada para usar como template. Selecione uma etiqueta primeiro.';
        this.zplContent = '';
        this.renderedLabelUrl = null;
        return;
      }

      const replaceField = (zpl: string, oldValue: string | number, newValue: string | number | null | undefined): string => {
        const escapedOldValue = String(oldValue).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\^FD${escapedOldValue}\\^FS`, 'g');
        return zpl.replace(regex, `^FD${newValue || ''}^FS`);
      };

      // --- LÓGICA PARA PARSEAR O NOME DO PRODUTO E INFORMAÇÕES RELACIONADAS ---
      let productNamePart1 = '';
      let productNamePart2 = '';
      let productNamePart3 = ''; // Nova parte para o nome
      let productBitola = this.selectedProduct.tamanho_padrao || ''; // Usar o campo tamanho_padrao
      let productColor = ''; // Será populada se encontrada

      const fullProductName = this.selectedProduct.nome_produto || '';
      const parts = fullProductName.split(' '); // Dividir o nome do produto por espaços

      // Exemplo de lógica de parse:
      // CABO NAXMEGA FLEX BWF/AS 70°C 0,6/1KV 2X1,5MM PT
      // Supondo: parte1 = "CABO NAXMEGA FLEX", parte2 = "BWF/AS 70°C", parte3 = "0,6/1KV"
      // Bitola: "2X1,5MM" (se não vier do tamanho_padrao)
      // Cor: "PT" (se for o último elemento e tiver 2 caracteres)

      if (parts.length > 0) {
          // Lógica flexível para tentar capturar as partes
          // Você pode precisar ajustar isso com base na consistência dos seus nomes de produto
          productNamePart1 = parts.slice(0, 3).join(' '); // Ex: "CABO NAXMEGA FLEX"
          productNamePart2 = parts.slice(3, 6).join(' '); // Ex: "BWF/AS 70°C 0,6/1KV" - Ajustado para pegar mais
          // Se tiver uma terceira linha para o nome, pegue o restante
          productNamePart3 = parts.slice(6, parts.length -1).join(' '); // Pega tudo até a penúltima parte (excluindo cor)

          // Tenta identificar a cor no final da string se for um código de 2 ou 3 letras comum
          const lastPart = parts[parts.length - 1];
          if (lastPart && (lastPart.length === 2 || lastPart.length === 3) && lastPart.toUpperCase() === lastPart) {
              // Verifica se é uma cor conhecida ou um código de cor
              // Adicione mais cores conforme necessário, ou use um mapeamento
              const colorMap: { [key: string]: string } = {
                  'PT': 'PRETO',
                  'AZ': 'AZUL',
                  'VM': 'VERMELHO',
                  'VD': 'VERDE',
                  'BR': 'BRANCO',
                  'AM': 'AMARELO'
              };
              productColor = colorMap[lastPart.toUpperCase()] || lastPart; // Mapeia ou usa o próprio código
              // Se a última parte foi a cor, remove-a da terceira parte do nome
              if (productNamePart3.endsWith(lastPart)) {
                  productNamePart3 = productNamePart3.substring(0, productNamePart3.length - lastPart.length).trim();
              }
          } else {
            // Se a última parte não for cor, então a última parte do nome
            productNamePart3 = parts.slice(6).join(' '); // Pega tudo do índice 6 em diante
          }
      }

      // Se 'tamanho_padrao' já contém "2X1,5MM", use-o diretamente.
      // Se não, e "2X1,5MM" estiver no nome do produto, você precisaria de uma regex para extraí-lo.
      // Por enquanto, vamos assumir que selectedProduct.tamanho_padrao tem o formato desejado.

      // --- SUBSTITUIÇÕES PARA OS CAMPOS DAS DUAS ETIQUETAS ---

      // **Nome do Produto (dividido em 3 linhas)**
      // Linha 1: CABO COPPERLINE (mantido fixo ou mapear para algo como 'CABO' + 'selectedProduct.fabricante')
      dynamicZpl = replaceField(dynamicZpl, `CABO COPPERLINE\\5C&`, `CABO COPPERLINE\\5C&`); // Pode ser dinâmico se tiver um campo para isso

      // Linha 2: FLEXMEGA 70°C (ajustado para a parte 1 do nome parseado)
      dynamicZpl = replaceField(dynamicZpl, `FLEXMEGA 70°C\\5C&`, `${productNamePart1}\\5C&`);

      // Linha 3: 1 x 16,0 mm² (ajustado para a parte 2 do nome parseado)
      dynamicZpl = replaceField(dynamicZpl, `1 x 16,0 mm²\\5C&`, `${productNamePart2}\\5C&`);

      // Linha 4: AZUL (agora a cor, se houver)
      // O ZPL original tem ^FT192,508 para AZUL. Vamos usar isso.
      dynamicZpl = replaceField(dynamicZpl, `AZUL\\5C&`, `${productColor ? productColor.toUpperCase() : ''}\\5C&`);

      // Bitola Principal (Campo grande ^FT243,56^A0I,51,51)
      // O seu ZPL tem "100 m" aqui. Se for a bitola, ajuste o FT.
      // Vou usar o FT existente para "100 m" e colocar a bitola, mas o tamanho da fonte pode não ser o ideal.
      dynamicZpl = replaceField(dynamicZpl, `100 m`, `${productBitola || ''} m`); // Assumindo "100 m" é o placeholder para bitola ou metragem

      // **Detalhes da Etiqueta (dados da tabela `label_entries` ou `product_entries`)**
      dynamicZpl = replaceField(dynamicZpl, `- Designação: 247 NM 02 C4`, `- Designação: ${this.selectedProduct.designacao || ''}`);
      dynamicZpl = replaceField(dynamicZpl, `- Tensão: 450/750 V`, `- Tensão: ${this.selectedProduct.tensao || ''}`);

      const dataFab = this.selectedDbLabelId
          ? this.dbLabels.find(label => label.id === this.selectedDbLabelId)?.data_fab || ''
          : '';
      dynamicZpl = replaceField(dynamicZpl, `- Data Fab.: 08/04/2024`, `- Data Fab.: ${dataFab}`);

      const paisOrigem = this.selectedDbLabelId
          ? this.dbLabels.find(label => label.id === this.selectedDbLabelId)?.pais_origem || ''
          : '';
      dynamicZpl = replaceField(dynamicZpl, `- País de origem: Brasil`, `- País de origem: ${paisOrigem}`);

      const validade = this.selectedDbLabelId
          ? this.dbLabels.find(label => label.id === this.selectedDbLabelId)?.validade || ''
          : '';
      dynamicZpl = replaceField(dynamicZpl, `- Validade: Indeterminada`, `- Validade: ${validade}`);

      const lote = this.selectedDbLabelId
          ? this.dbLabels.find(label => label.id === this.selectedDbLabelId)?.lote || ''
          : '';
      dynamicZpl = replaceField(dynamicZpl, `- Lote: 0424-000038`, `- Lote: ${lote}`);


      dynamicZpl = replaceField(dynamicZpl, `- Resistente à chama (BWF-B)`, `- Resistente à chama (BWF-B)`);
      dynamicZpl = replaceField(dynamicZpl, `- Massa bruta: 15,7 kg/100mt`, `- Massa bruta: ${this.selectedProduct.massa_bruta_kg_100m || ''} kg/100mt`);
      dynamicZpl = replaceField(dynamicZpl, `- Norma aplicada: NBR 247-3`, `- Norma aplicada: ${this.selectedProduct.norma_aplicada || ''}`);
      dynamicZpl = replaceField(dynamicZpl, `- Composição: Cobre / Pvc-A`, `- Composição: ${this.selectedProduct.composicao || ''}`);
      dynamicZpl = replaceField(dynamicZpl, `- Instalar conforme NBR 5410`, `- Instalar conforme NBR 5410`);
      dynamicZpl = replaceField(dynamicZpl, `- Bob N°/Série: 50060`, `- Bob N°/Série: ${this.selectedProduct.numero_registro || ''}`); // ou campo 'registro' de label_entries

      // **Código de Barras**
      dynamicZpl = replaceField(dynamicZpl, `7898932971009`, `${this.selectedProduct.cod_barras || ''}`);

      // Informações da Empresa (geralmente fixas) - Mantidas as originais ou substitua se tiver campos no DB
      // dynamicZpl = replaceField(dynamicZpl, `MEGA FIOS LTDA - Ind. Brasileira`, `SUA NOVA EMPRESA`);
      // dynamicZpl = replaceField(dynamicZpl, `SAC: (86) 99406-0073 - CEP: 64078-820`, `SAC: (XX) XXXX-XXXX - CEP: XXXXX-XXX`);
      // dynamicZpl = replaceField(dynamicZpl, `CNPJ: 07.127.994/0001-50    IE: 19.455.499-6`, `CNPJ: YYYYYYYY/YYYY-YY    IE: ZZZZZZZZ-Z`);
      // dynamicZpl = replaceField(dynamicZpl, `sac@copperline.com.br`, `seuemail@dominio.com.br`);


      this.zplContent = dynamicZpl;
      this.renderLabel();
    } else {
      console.log('Nenhum produto selecionado. Revertendo ZPL para o original da etiqueta do banco.');
      this.zplContent = this.selectedDbLabelId !== null
        ? (this.dbLabels.find(label => label.id === this.selectedDbLabelId)?.original_content || '')
        : '';
      this.renderLabel();
      this.errorMessage = null;
    }
  }


  // MÉTODO: Carrega etiquetas do banco de dados
  loadDbLabels(): void {
    this.isLoadingDbLabels = true;
    this.dbLabelsErrorMessage = null;
    this.dbLabels = []; // Limpa a lista antes de carregar
    this.labelManagementService.getAllLabels().subscribe({
      next: (labels: LabelEntry[]) => {
        this.dbLabels = labels;
        this.isLoadingDbLabels = false;
      },
      error: (error) => {
        console.error('Erro ao carregar etiquetas do banco de dados:', error);
        this.dbLabelsErrorMessage = 'Falha ao carregar etiquetas do banco de dados. Tente novamente.';
        this.isLoadingDbLabels = false;
        this.dbLabels = [];
      }
    });
  }

  // MÉTODO: Lida com a seleção de uma etiqueta do banco
  onDbLabelSelected(): void {
    const selectedLabel = this.dbLabels.find(label => label.id === this.selectedDbLabelId);
    if (selectedLabel) {
      this.zplContent = selectedLabel.original_content;
      this.renderLabel();
    } else {
      this.zplContent = '';
      this.renderedLabelUrl = null;
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
        this.printerList = devices.filter(d => d.type === 'printer');
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

    // A sua ZPL tem múltiplos ^XA/^XZ.
    // O comando ^PQ deve ser inserido ANTES do ^XZ que finaliza o bloco de impressão da etiqueta,
    // e não o ^XZ dos comandos de gestão de gráficos (^IDR).

    // 1. Remover qualquer ^PQ existente para evitar duplicidade.
    //    É mais seguro buscar por ^PQ em qualquer lugar e removê-lo,
    //    ou, se ele estiver sempre no final do bloco principal de impressão,
    //    podemos direcionar a remoção para lá.
    //    Vamos usar uma regex mais genérica para remover ^PQ seguido de seus parâmetros
    //    que não estejam no contexto de um comando ^IDR (que não deveria ter ^PQ).
    //    Seu ZPL de exemplo não tem ^PQ, então essa primeira remoção talvez não seja estritamente necessária
    //    se você *nunca* salvar um ^PQ no DB. Mas é uma boa prática de segurança.

    // Regex mais flexível para remover ^PQ, mas cuidado para não remover ^XZ de forma errada
    // Se o ^PQ puder vir antes de ^XZ, a regex abaixo vai remover ele e o ^XZ junto
    // zplToPrint = zplToPrint.replace(/\^PQ(\d+),(\d+),(\d+),([YN])(\s*\^XZ)?/g, '');

    // Para seu ZPL atual que não tem ^PQ, podemos focar na inserção.
    // Onde inserir? Antes do ^XZ que finaliza o bloco de impressão principal.
    // Olhando seu ZPL, o bloco principal de impressão termina na linha antes de ^XA^IDR...
    // O último ^XZ antes dos ^XA^IDR.

    // A regex /\^XZ$/ vai buscar o último ^XZ da string inteira.
    // No seu caso, o ZPL parece ter comandos de imagem após o ZPL principal da etiqueta.
    // O ZPL principal da etiqueta que você quer imprimir termina no ^XZ da linha 113.
    // Os outros ^XA^IDR são para gerenciar imagens na impressora, e não definem o trabalho de impressão.

    // **Estratégia:** Inserir o ^PQ antes do ÚLTIMO ^XZ que não faz parte de um ^IDR.
    // Uma forma mais simples é buscar o último ^XZ da string e inserir o ^PQ lá.
    // Se seus ^IDR estiverem sempre no final, a regex /\^XZ$/ funciona.

    // **Ajuste para garantir que o ^PQ seja o último comando antes do ^XZ final do trabalho de impressão**
    // Se o ZPL do banco não tiver ^PQ, a primeira replace não fará nada.
    // Se ele já tiver um ^PQ, esta linha o removerá.
    zplToPrint = zplToPrint.replace(/\^PQ\d+,\d+,\d+,[YN]/g, ''); // Remove ^PQ existente sem remover ^XZ

    // Agora, insere o novo ^PQ antes do ^XZ final.
    // Se houver múltiplos ^XZ (como no seu caso com os ^IDR), precisamos ser mais específicos.
    // O seu ZPL principal termina com um ^XZ e depois vêm os comandos ^XA^IDR.
    // Se você quer que o comando ^PQ se aplique apenas à etiqueta gerada,
    // ele deve vir **dentro** do bloco `^XA...^XZ` principal da etiqueta.

    // Considerando o ZPL que você me deu, onde o bloco principal da etiqueta termina antes dos ^IDR:
    // A melhor estratégia é identificar o último ^XZ do bloco principal de impressão.
    // No seu exemplo, é o ^XZ na linha 113.
    // Se o ZPL da etiqueta que vem do banco (this.zplContent) já está no formato
    // ^XA ... ^XZ
    // ^XA ... ^XZ (para a segunda etiqueta)
    // ^XZ (final do trabalho principal)
    // ^XA^IDR... (comandos de imagem)

    // O comando `^PQ` deve ser adicionado ao **último ^XZ do bloco principal da etiqueta**.
    // A sua regex `zplToPrint.replace(/\^XZ$/, ...)` funcionaria se o último `^XZ` da string
    // fosse o `^XZ` do bloco principal da etiqueta.
    // No seu caso, os comandos `^XA^IDR` também terminam com `^XZ`, o que confunde a regex.

    // Vamos garantir que a inserção ocorra antes do último ^XZ que encerra o trabalho principal,
    // e não um ^XZ de comandos de gestão de memória.
    // Se o ZPL principal é o que está antes dos ^XA^IDR, podemos fatiar a string.

    // Encontra a posição do último ^XZ que precede os comandos ^XA^IDR.
    // Isso é um pouco mais complexo e pode ser frágil se a estrutura mudar.
    // Alternativa mais robusta:
    // O ZPL pode ser interpretado como um único trabalho de impressão,
    // e o `^PQ` deve vir antes do último `^XZ` de todo o ZPL.

    // Se o `^PQ` não está aparecendo no console, o problema é que a regex de inserção
    // não está encontrando o `^XZ` final para substituir.

    // Vamos testar uma versão mais robusta da inserção:
    // Garanta que o ZPL termine com ^XZ e que não haja ^PQ antes.
    if (!zplToPrint.trim().endsWith('^XZ')) {
        // Adiciona ^XZ se não houver no final, ou limpa algo que esteja depois.
        zplToPrint = zplToPrint.trim() + '^XZ';
    }

    // Remova qualquer ^PQ existente.
    // Importante: use 'gi' para global e case-insensitive, se necessário.
    zplToPrint = zplToPrint.replace(/\^PQ\d+,\d+,\d+,[YN]/gi, '');

    // Agora insira o novo ^PQ antes do ^XZ final.
    // Isso deve funcionar se o ZPL terminar com ^XZ (seja o da etiqueta ou de um comando ^IDR).
    zplToPrint = zplToPrint.replace(/\^XZ$/, `^PQ${this.numberOfCopies},0,1,Y^XZ`);

    // Log para depuração
    console.log('ZPL final (com cópias) a ser enviado para impressão:', zplToPrint);
    // --- Fim da lógica ZPL para cópias ---

    // A variável printOptions aqui não é usada para definir cópias, pois
    // o comando ^PQ no ZPL é a forma canônica de fazer isso na Zebra.
    // Ela pode ser usada para outras configurações do BrowserPrint, se necessário.
    const printOptions = {}; // Deixa vazio ou com outras opções se houver

   this.selectedPrinter.send(
      zplToPrint,
      (success: any) => {
        console.log('ZPL enviado com sucesso para a impressora Zebra!', success);
        alert('Etiqueta enviada para a impressora Zebra com sucesso!');

        // Agora pegue os dados do usuário do AuthService
        const currentUserId = this.authService.getUserId();
        const currentUserName = this.authService.getUserName(); // Se você tiver um getter para userName


        if (currentUserId) { // Verifica se o ID do usuário está disponível
          const selectedLabel = this.dbLabels.find(label => label.id === this.selectedDbLabelId);

          const historyEntry: PrintHistoryEntry = {
            userId: currentUserId,
            userName: currentUserName || 'Nome não disponível',
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