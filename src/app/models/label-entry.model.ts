// src/app/models/label-entry.model.ts
export interface LabelEntry {
  id: number;
  file_name: string;        // Corresponde a 'file_name' na sua tabela
  original_content: string; // Corresponde a 'original_content' na sua tabela
  designacao?: string;
  tensao?: string;
  data_fab?: string;
  pais_origem?: string;
  validade?: string;
  lote?: string;
  registro?: string;
  barcode?: string;
  // REMOVIDO: dpmm, width_inch, height_inch, created_at, updated_at
  // porque não estavam na sua tabela conforme a imagem.
}

export interface ProductEntry {
  codigo: string;
  nome_produto: string;
  tamanho_padrao?: string;
  designacao?: string;
  tensao?: string;
  massa_bruta_kg_100m?: number;
  norma_aplicada?: string;
  composicao?: string;
  numero_registro?: string;
  cod_barras?: string;
  pedido_oc?: string;
  retalho?: string;
  massa_liquida_kg_100m?: number;
  // Adicione outras colunas da sua tabela product_entries se precisar delas no frontend
}